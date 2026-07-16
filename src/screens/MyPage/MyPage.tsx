import { useEffect, useState } from "react";
import ProfileCard from "./components/ProfileCard";
import TripList from "./components/TripList";
import TripDetail from "./components/TripDetail";
import { listTrips } from "@/api/trips";
import { getApiErrorMessage } from "@/lib/api";
import type { TripSummary } from "@/types/trip";

/**
 * 마이페이지
 *  - 프로필 조회 (이슈 7)
 *  - 저장한 계획 목록/상세 (이슈 8)
 */
export default function MyPage() {
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 선택한 plan_id (null이면 목록 화면) */
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-11 md:px-7">
      {selectedPlanId !== null ? (
        <TripDetail planId={selectedPlanId} onBack={() => setSelectedPlanId(null)} />
      ) : (
        <>
          <h1 className="mb-6 text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.045em]">
            마이페이지
          </h1>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <ProfileCard />
            {error ? (
              <p className="rounded-card border border-line bg-paper px-[22px] py-11 text-center text-sm text-stamp">
                {error}
              </p>
            ) : (
              <TripList trips={trips} onSelect={setSelectedPlanId} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
