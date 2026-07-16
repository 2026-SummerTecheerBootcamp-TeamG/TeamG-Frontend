import { useCallback, useEffect, useRef, useState } from "react";
import type { ParsedFields, PlanDetail, PlanStatus } from "@/types/trip";
import {
  confirmParse,
  confirmPlan as confirmPlanRequest,
  createRun,
  editPlan,
  getPlan,
  getRun,
} from "@/api/trips";

const STEP_COUNT = 5;
const STEP_DELAY = 1200;
const POLL_INTERVAL = 1500;
const POLL_TIMEOUT = 120_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 계획 생성 / 수정 / 확정 - 실제 백엔드 파이프라인(parse 확정 -> runs 접수 -> 폴링 -> plan 조회)을 오케스트레이션 */
export function usePlan() {
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  /** 확정 당시의 파싱 필드 (plan_detail 응답엔 목적지/인원 요약이 없어서 헤더 표시용으로 따로 들고 있음) */
  const [request, setRequest] = useState<ParsedFields | null>(null);
  const [status, setStatus] = useState<PlanStatus>("idle");
  const [step, setStep] = useState(0);
  const [version, setVersion] = useState(1);
  const [error, setError] = useState<string | null>(null);

  /** 진행 중인 작업이 취소됐는지 (언마운트/새 요청 시작) 확인하는 플래그 */
  const cancelledRef = useRef(false);
  useEffect(() => () => {
    cancelledRef.current = true;
  }, []);

  /** 빌드 중 5단계를 시각적으로만 순서대로 켠다 (실제 파이프라인 진행률과 별개) */
  const tickSteps = useCallback(async (token: { cancelled: boolean }) => {
    for (let i = 0; i < STEP_COUNT; i++) {
      if (token.cancelled) return;
      setStep(i);
      await sleep(STEP_DELAY);
    }
  }, []);

  /** run_id가 완료/실패될 때까지 폴링 */
  const pollRun = useCallback(async (runId: string, token: { cancelled: boolean }) => {
    const started = Date.now();
    while (Date.now() - started < POLL_TIMEOUT) {
      if (token.cancelled) return null;
      const detail = await getRun(runId);
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

      const steps = tickSteps(token);

      try {
        await confirmParse(parseId);
        const run = await createRun(parseId);
        if (!run.plan_id) throw new Error("plan_id를 받지 못했습니다.");

        await pollRun(run.run_id, token);
        token.cancelled = true; // 단계 표시 애니메이션 중단

        const detail = await getPlan(run.plan_id);
        if (cancelledRef.current) return;
        setPlan(detail);
        setStatus("ready");
      } catch (e) {
        token.cancelled = true;
        if (cancelledRef.current) return;
        setError(e instanceof Error ? e.message : "계획을 생성하지 못했습니다.");
        setStatus("error");
      } finally {
        await steps;
      }
    },
    [pollRun, tickSteps],
  );

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

  return { plan, request, status, step, version, error, start, editWithMessage, confirm };
}
