import { useState } from "react";
import ProfileCard from "./components/ProfileCard";
import TripList from "./components/TripList";
import TripDetail from "./components/TripDetail";
import { SAVED_TRIPS } from "./lib/savedTrips";

/**
 * 마이페이지
 *  - 프로필 조회 (이슈 7)
 *  - 저장한 계획 목록/상세 (이슈 8)
 */
export default function MyPage() {
  /** 선택한 계획 id (null이면 목록 화면) */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SAVED_TRIPS.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-11 md:px-7">
      {selected ? (
        <TripDetail trip={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <h1 className="mb-6 text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.045em]">
            마이페이지
          </h1>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <ProfileCard />
            <TripList trips={SAVED_TRIPS} onSelect={setSelectedId} />
          </div>
        </>
      )}
    </div>
  );
}