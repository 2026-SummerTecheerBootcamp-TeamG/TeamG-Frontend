import type { TripSummary } from "@/types/trip";
import { formatWon } from "@/screens/PlanningRoom/lib/parseRequest";

const chipColors = ["from-cobalt to-[#4E6BFF]", "from-teal to-[#3FBFA5]", "from-amber to-[#F0B45E]"];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

interface Props {
  /** null이면 로딩 중 */
  trips: TripSummary[] | null;
  onSelect: (planId: number) => void;
}

/** 상태 배지 — 목록에서 계획의 진행 단계를 한눈에 */
function StatusBadge({ status }: { status: TripSummary["status"] }) {
  if (status === "confirmed")
    return (
      <span className="rounded-md bg-teal/10 px-1.5 py-0.5 text-[10.5px] font-bold text-teal">
        확정
      </span>
    );
  if (status === "draft")
    return (
      <span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[10.5px] font-bold text-amber">
        임시저장 · 이어서 수정
      </span>
    );
  return (
    <span className="rounded-md bg-line-soft px-1.5 py-0.5 text-[10.5px] font-bold text-ink-3">
      생성 중
    </span>
  );
}

/** 저장한 계획 목록 — 만든 계획 전부 (미확정 계획도 언제든 다시 열어 수정/확정) */
export default function TripList({ trips, onSelect }: Props) {
  // plan이 아직 없는 요청(접수 직후 등)만 제외하고 전부 보여준다.
  // 예전엔 확정본만 노출했는데, "미확정 계획을 다시 불러 수정/확정할 수 없다"는
  // 피드백으로 전체 노출 + 상태 배지 방식으로 변경.
  const visibleTrips =
    trips === null ? null : trips.filter((t) => t.plan_id !== null);

  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">내 계획</h3>
        <span className="font-mono text-[11px] text-ink-3">{visibleTrips?.length ?? "-"}건</span>
      </div>
      {visibleTrips === null ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">불러오는 중...</div>
      ) : visibleTrips.length === 0 ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">
          아직 만든 계획이 없습니다.
          <br />
          홈에서 문장 한 줄로 시작해 보세요.
        </div>
      ) : (
        <ul className="px-3 py-2">
          {visibleTrips.map((trip, i) => (
            <li key={trip.request_id}>
              {/* 행 전체가 하나의 클릭 영역 — 예약·결제는 "모양만" 배지 (기능 통합)
                  행 어디를 눌러도 같은 곳(상세의 예약·결제 패널)으로 가므로
                  버튼을 쪼갤 이유가 없다는 피드백 반영 */}
              <button
                onClick={() => trip.plan_id !== null && onSelect(trip.plan_id)}
                disabled={trip.status === "processing"}
                className="flex w-full items-center gap-4 border-b border-line-soft px-3 py-4 text-left transition-colors last:border-b-0 hover:bg-[#f7f9fa] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${chipColors[i % 3]} text-[13px] font-bold text-white`}
                >
                  {trip.destinations[0]?.slice(0, 2) ?? "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-base font-bold tracking-[-0.03em]">
                      {trip.destinations.join(" · ") || "목적지 미정"}
                    </span>
                    <StatusBadge status={trip.status} />
                  </span>
                  <span className="mt-1 block font-mono text-[11.5px] text-ink-3">
                    {fmt(trip.start_date)} – {fmt(trip.end_date)} · {trip.departure} 출발
                  </span>
                </span>

                {/* 오른쪽 끝: [가격] [예약·결제 배지] 나란히 — 가격이 배지 왼쪽이라 눈에 잘 띔 */}
                <span className="flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap font-mono text-[16px] font-extrabold tracking-[-0.02em]">
                    {formatWon(trip.total_budget)}원
                  </span>
                  {trip.status === "confirmed" && (
                    <span className="whitespace-nowrap rounded-field bg-cobalt px-4 py-3 text-[13px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(39,67,224,.5)]">
                      예약·결제 →
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}