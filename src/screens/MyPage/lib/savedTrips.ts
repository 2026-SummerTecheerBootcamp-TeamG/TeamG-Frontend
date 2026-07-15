import { buildPlan } from "@/screens/PlanningRoom/lib/buildPlan";
import type { Plan } from "@/types/trip";

/**
 * 저장한 계획 샘플 (퍼블리싱용 임시 데이터)
 * API 연동 이슈에서 GET /trips, GET /trips/plans/{id} 응답으로 대체한다.
 */
export interface SavedTrip {
  id: string;
  plan: Plan;
  budget: number;
  savedAt: Date;
}

const make = (
  id: string,
  city: string,
  start: [number, number, number],
  end: [number, number, number],
  pax: number,
  budget: number,
  savedAt: Date,
): SavedTrip => {
  const req = {
    city,
    start: new Date(start[0], start[1] - 1, start[2]),
    end: new Date(end[0], end[1] - 1, end[2]),
    pax,
    budget,
  };
  return { id, plan: buildPlan(req), budget, savedAt };
};

export const SAVED_TRIPS: SavedTrip[] = [
  make("t1", "오사카", [2026, 3, 10], [2026, 3, 13], 2, 1_300_000, new Date(2026, 1, 2)),
  make("t2", "타이베이", [2026, 6, 5], [2026, 6, 8], 3, 1_500_000, new Date(2026, 4, 19)),
  make("t3", "후쿠오카", [2026, 9, 12], [2026, 9, 14], 2, 1_000_000, new Date(2026, 6, 30)),
];