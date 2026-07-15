import PlanSheet from "@/screens/PlanningRoom/components/PlanSheet";
import type { SavedTrip } from "../lib/savedTrips";

interface Props {
  trip: SavedTrip;
  onBack: () => void;
}

/** 저장한 계획 상세 (계획서를 읽기 전용으로 재사용) */
export default function TripDetail({ trip, onBack }: Props) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
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
        <span className="text-xl font-extrabold tracking-[-0.03em]">
          {trip.plan.city} {trip.plan.nights}박 {trip.plan.nights + 1}일
        </span>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
        <PlanSheet
          plan={trip.plan}
          budget={trip.budget}
          version={1}
          status="confirmed"
          departureIata="ICN"
          onConfirm={() => {}}
          readOnly
        />
      </div>
    </div>
  );
}