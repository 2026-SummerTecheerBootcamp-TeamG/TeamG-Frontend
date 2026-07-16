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

/** 저장한 계획 목록 (확정된 계획만 노출) */
export default function TripList({ trips, onSelect }: Props) {
  // 확정된 계획만 보여준다 (임시저장·생성 중 계획은 숨김)
  const confirmedTrips =
    trips === null ? null : trips.filter((t) => t.status === "confirmed");

  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">저장한 계획</h3>
        <span className="font-mono text-[11px] text-ink-3">{confirmedTrips?.length ?? "-"}건</span>
      </div>
      {confirmedTrips === null ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">불러오는 중...</div>
      ) : confirmedTrips.length === 0 ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">
          아직 저장한 계획이 없습니다.
          <br />
          계획을 만들고 ‘이 계획으로 확정’을 누르면 여기에 쌓입니다.
        </div>
      ) : (
        <ul className="px-3 py-2">
          {confirmedTrips.map((trip, i) => (
            <li key={trip.request_id}>
              <button
                onClick={() => trip.plan_id !== null && onSelect(trip.plan_id)}
                disabled={trip.plan_id === null}
                className="flex w-full items-center gap-4 border-b border-line-soft px-3 py-4 text-left transition-colors last:border-b-0 hover:bg-[#f7f9fa] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${chipColors[i % 3]} text-[13px] font-bold text-white`}
                >
                  {trip.destinations[0]?.slice(0, 2) ?? "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold tracking-[-0.03em]">
                    {trip.destinations.join(" · ") || "목적지 미정"}
                  </span>
                  <span className="mt-1 block font-mono text-[11.5px] text-ink-3">
                    {fmt(trip.start_date)} – {fmt(trip.end_date)} · {trip.departure} 출발
                  </span>
                </span>
                <span className="whitespace-nowrap text-right">
                  <span className="block font-mono text-[13.5px] font-bold">
                    {formatWon(trip.total_budget)}원
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}