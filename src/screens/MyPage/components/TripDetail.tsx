import { useEffect, useState } from "react";
import PlanSheet from "@/screens/PlanningRoom/components/PlanSheet";
import { getPlan } from "@/api/trips";
import { getApiErrorMessage } from "@/lib/api";
import type { PlanDetail } from "@/types/trip";

interface Props {
  planId: number;
  onBack: () => void;
}

/** 저장한 계획 상세 (계획서를 읽기 전용으로 재사용) */
export default function TripDetail({ planId, onBack }: Props) {
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPlan(planId)
      .then((p) => {
        if (!cancelled) setPlan(p);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  return (
    <div>
      {/* 목록 버튼은 오른쪽 끝 — 마이페이지 첫 화면의 "돌아가기"와 같은 자리 (피드백) */}
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          목록
        </button>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
        {error && <p className="px-7 py-11 text-center text-sm text-stamp">{error}</p>}
        {!error && !plan && <p className="px-7 py-11 text-center text-sm text-ink-3">불러오는 중...</p>}
        {plan && (
          <PlanSheet
            plan={plan}
            request={null}
            status={plan.status === "confirmed" ? "confirmed" : "ready"}
            onConfirm={() => {}}
            readOnly
          />
        )}
      </div>
    </div>
  );
}
