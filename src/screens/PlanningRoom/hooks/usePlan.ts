import { useCallback, useEffect, useRef, useState } from "react";
import type { ParsedFields, PlanDetail, PlanStatus, TraceEvent } from "@/types/trip";
import {
  confirmParse,
  confirmPlan as confirmPlanRequest,
  createRun,
  editPlan,
  getPlan,
  getRun,
} from "@/api/trips";

const POLL_INTERVAL = 1500;
const POLL_TIMEOUT = 120_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * trace 이벤트 목록 -> 현재 진행 단계 (0~4, PlanProgress의 STEPS 인덱스)
 *
 * 예전에는 타이머로 단계를 "연출"했는데(1.2초마다 한 칸), 그러면 연출이 끝난 뒤
 * 남은 실제 작업 시간 전부를 마지막 칸이 뒤집어써서
 * "예산 산정이 왜 이렇게 오래 걸리냐"는 오해를 만들었다 (실제 예산 배분은 0.001초).
 * 이제 백엔드가 폴링 응답에 실어주는 실제 trace 이벤트로 단계를 계산한다.
 *
 * Math.max로만 올리는 이유: 병렬 실행 때문에 이벤트 순서가 섞여도 단계가 뒤로 가지 않게.
 */
function stepFromEvents(events: TraceEvent[] | undefined): number {
  let step = 0;
  for (const e of events ?? []) {
    const a = e.action ?? "";
    if (e.kind === "done" || a.includes("저장")) step = Math.max(step, 4);
    else if (a.includes("일정") || a.includes("내러티브")) step = Math.max(step, 3);
    else if (a.includes("배분")) step = Math.max(step, 2);
    else if (e.kind === "api" || e.kind === "llm" || e.kind === "data")
      step = Math.max(step, 1); // 검색 단계의 툴 호출/LLM 턴들
  }
  return step;
}

/** 계획 생성 / 수정 / 확정 - 실제 백엔드 파이프라인(parse 확정 -> runs 접수 -> 폴링 -> plan 조회)을 오케스트레이션 */
export function usePlan() {
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  /** 확정 당시의 파싱 필드 (plan_detail 응답엔 목적지/인원 요약이 없어서 헤더 표시용으로 따로 들고 있음) */
  const [request, setRequest] = useState<ParsedFields | null>(null);
  const [status, setStatus] = useState<PlanStatus>("idle");
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState(1);
  const [error, setError] = useState<string | null>(null);

  /** 진행 중인 작업이 취소됐는지 (언마운트/새 요청 시작) 확인하는 플래그 */
  const cancelledRef = useRef(false);
  useEffect(() => () => {
    cancelledRef.current = true;
  }, []);

  /** run_id가 완료/실패될 때까지 폴링 — 폴링할 때마다 실제 진행 단계도 갱신 */
  const pollRun = useCallback(async (runId: string, token: { cancelled: boolean }) => {
    const started = Date.now();
    while (Date.now() - started < POLL_TIMEOUT) {
      if (token.cancelled) return null;
      const detail = await getRun(runId);
      const nextStep = stepFromEvents(detail.events); // 진짜 진행률 (trace 이벤트 기반)
      setStep(nextStep);
      setProgress((prev) => Math.max(prev, progressFromEvents(detail.events, nextStep)));
      if (detail.status === "completed") return detail.result;
      if (detail.status === "failed") throw new Error("계획 생성에 실패했습니다.");
      await sleep(POLL_INTERVAL);
    }
    throw new Error("계획 생성이 시간 초과되었습니다. 다시 시도해 주세요.");
  }, []);

  /** parse_id가 확정된 상태 -> 파이프라인 실행 -> 완료되면 plan 조회 */
  const start = useCallback(
    async (parseId: string, fields: ParsedFields) => {
      cancelledRef.current = false;
      const token = { cancelled: false };
      setStatus("building");
      setError(null);
      setStep(0);
      setVersion(1);
      setRequest(fields);

      try {
        await confirmParse(parseId);
        const run = await createRun(parseId);
        if (!run.plan_id) throw new Error("plan_id를 받지 못했습니다.");

        await pollRun(run.run_id, token);

        const detail = await getPlan(run.plan_id);
        if (cancelledRef.current) return;
        setPlan(detail);
        setStatus("ready");
      } catch (e) {
        token.cancelled = true;
        if (cancelledRef.current) return;
        setError(e instanceof Error ? e.message : "계획을 생성하지 못했습니다.");
        setStatus("error");
      }
    },
    [pollRun],
  );

  /**
   * 마이페이지에서 넘어온 기존 계획(draft)을 불러와 바로 수정 모드로 전환
   * (생성 파이프라인을 거치지 않고 저장된 스냅샷을 그대로 워크벤치에 올린다)
   * 반환: 성공 시 PlanDetail (대화 복원 등에 사용), 실패 시 null
   */
  const loadExisting = useCallback(async (planId: number) => {
    cancelledRef.current = false;
    // 실패 시 여기서 삼키지 않고 그대로 던진다 — 호출부(PlanningRoom)가
    // 실제 원인(로그인 만료/네트워크/404 등)을 사용자에게 보여줄 수 있게.
    // (예전엔 catch로 null만 돌려줘서 "불러오지 못했습니다"만 보였음)
    const detail = await getPlan(planId);
    if (cancelledRef.current) return null;
    setPlan(detail);
    setRequest(null); // 저장 스냅샷엔 요청 요약이 없음 (PlanSheet가 null 허용)
    setVersion(1);
    setStatus(detail.status === "confirmed" ? "confirmed" : "ready");
    return detail;
  }, []);

  /** 문장으로 들어온 수정 요청 */
  const editWithMessage = useCallback(
    async (text: string): Promise<{ note: string }> => {
      if (!plan) return { note: "계획이 아직 없습니다." };

      const response = await editPlan(plan.plan_id, text);

      if (!("run_id" in response)) {
        // supported: false - 예산영향/재계획 외 미지원 카테고리 안내
        return { note: response.message };
      }

      const token = { cancelled: false };
      const result = await pollRun(response.run_id, token);

      // 재계획: 접수 응답에 plan_id가 바로 옴 / 국소수정: 폴링 결과의 new_plan_id
      const newPlanId =
        response.plan_id ??
        (result && typeof result === "object" && "new_plan_id" in result
          ? (result as { new_plan_id: number }).new_plan_id
          : null);

      if (!newPlanId) return { note: "수정 결과를 확인하지 못했습니다." };

      const detail = await getPlan(newPlanId);
      setPlan(detail);
      setVersion((v) => v + 1);

      const summary =
        result && typeof result === "object" && "summary" in result
          ? (result as { summary?: string }).summary
          : undefined;

      return { note: summary || "계획서를 갱신했습니다." };
    },
    [plan, pollRun],
  );

  /** 계획 확정 */
  const confirm = useCallback(async () => {
    if (!plan) return false;
    try {
      await confirmPlanRequest(plan.plan_id);
      setStatus("confirmed");
      return true;
    } catch {
      return false;
    }
  }, [plan]);

  return { plan, request, status, step, progress, version, error, start, loadExisting, editWithMessage, confirm };
}

/**
 * 실제 trace 이벤트로 진행률(0~100)을 계산한다.
 * 단계 안에서도 이벤트가 쌓일수록 조금씩 올라가 막대가 멈춰 보이지 않게 한다.
 * 타이머 연출이 아니라 전부 실제 이벤트 기반.
 */
const STEP_RANGE = [
  { base: 0, cap: 12 },
  { base: 12, cap: 55 },
  { base: 55, cap: 65 },
  { base: 65, cap: 88 },
  { base: 88, cap: 99 },
];

function progressFromEvents(events: TraceEvent[] | undefined, step: number): number {
  const range = STEP_RANGE[Math.min(step, STEP_RANGE.length - 1)];
  const span = range.cap - range.base;
  const list = events ?? [];
  const stepEventCount = list.filter((e) => {
    const a = e.action ?? "";
    if (step >= 4) return e.kind === "done" || a.includes("저장");
    if (step === 3) return a.includes("일정") || a.includes("내러티브");
    if (step === 2) return a.includes("배분");
    if (step === 1) return e.kind === "api" || e.kind === "llm" || e.kind === "data";
    return true;
  }).length;
  const filled = 1 - Math.pow(0.75, stepEventCount);
  return Math.round(range.base + span * filled);
}