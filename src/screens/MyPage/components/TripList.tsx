import type { SavedTrip } from "../lib/savedTrips";
import { formatWon } from "@/screens/PlanningRoom/lib/parseRequest";

const chipColors = ["from-cobalt to-[#4E6BFF]", "from-teal to-[#3FBFA5]", "from-amber to-[#F0B45E]"];

const fmt = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

interface Props {
  trips: SavedTrip[];
  onSelect: (id: string) => void;
}

/** 저장한 계획 목록 */
export default function TripList({ trips, onSelect }: Props) {
  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">저장한 계획</h3>
        <span className="font-mono text-[11px] text-ink-3">{trips.length}건</span>
      </div>

      {trips.length === 0 ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">
          아직 저장한 계획이 없습니다.
          <br />
          계획을 만들고 ‘이 계획으로 확정’을 누르면 여기에 쌓입니다.
        </div>
      ) : (
        <ul className="px-3 py-2">
          {trips.map((trip, i) => (
            <li key={trip.id}>
              <button
                onClick={() => onSelect(trip.id)}
                className="flex w-full items-center gap-4 border-b border-line-soft px-3 py-4 text-left transition-colors last:border-b-0 hover:bg-[#f7f9fa]"
              >
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${chipColors[i % 3]} font-mono text-[13px] font-bold text-white`}
                >
                  {trip.plan.iata}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold tracking-[-0.03em]">
                    {trip.plan.city} {trip.plan.nights}박 {trip.plan.nights + 1}일
                  </span>
                  <span className="mt-1 block font-mono text-[11.5px] text-ink-3">
                    {fmt(trip.plan.days[0].date)} –{" "}
                    {fmt(trip.plan.days[trip.plan.days.length - 1].date)} · 성인{" "}
                    {trip.plan.pax}명
                  </span>
                </span>

                <span className="whitespace-nowrap text-right">
                  <span className="block font-mono text-[13.5px] font-bold">
                    {formatWon(trip.plan.allocation.total)}원
                  </span>
                  <span className="mt-1 inline-block rounded bg-[#e6f6f2] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.08em] text-teal">
                    확정
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