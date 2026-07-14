import { useCallback, useState } from "react";
import type { Plan, PlanStatus, TripRequest } from "@/types/trip";
import { applyEdit, buildPlan } from "../lib/buildPlan";

const STEP_COUNT = 5;
const STEP_DELAY = 520;

/** 계획서 생성 / 수정 / 확정 */
export function usePlan() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<PlanStatus>("idle");
  const [step, setStep] = useState(0);
  const [version, setVersion] = useState(1);

  /** 단계 표시를 순서대로 켠 뒤 계획을 만든다 */
  const run = useCallback(async (req: TripRequest) => {
    setStatus("building");
    setStep(0);

    for (let i = 0; i < STEP_COUNT; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, STEP_DELAY));
    }

    // TODO: POST /api/v1/trips → GET /trips/{tripId}/versions/{versionId} 로 교체
    setPlan(buildPlan(req));
    setStatus("ready");
  }, []);

  /** 슬롯이 다 찼을 때 (첫 생성) */
  const start = useCallback(
    (req: TripRequest) => {
      setVersion(1);
      void run(req);
    },
    [run],
  );

  /** 문장으로 들어온 수정 요청 */
  const edit = useCallback(
    (req: TripRequest, text: string) => {
      const { request, note } = applyEdit(req, text);
      setVersion((v) => v + 1);
      void run(request);
      return { request, note };
    },
    [run],
  );

  /** 계획 확정 */
  const confirm = useCallback(() => {
    // TODO: POST /api/v1/trips/{tripId}/confirm 연동
    setStatus("confirmed");
  }, []);

  return { plan, status, step, version, start, edit, confirm };
}