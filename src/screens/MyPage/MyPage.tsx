import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProfileCard from "./components/ProfileCard";
import TripList from "./components/TripList";
import TripDetail from "./components/TripDetail";
import { deleteTrip, listTrips, updateTripTitle } from "@/api/trips";
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

  // 선택한 계획을 내부 state가 아니라 URL 쿼리(?plan=8)로 관리한다.
  // 이유: state로만 들고 있으면 상세를 보다가 헤더의 "마이페이지"를 눌러도
  //       주소가 /mypage 그대로라 아무 일도 안 일어남(무반응 버그).
  //       URL로 관리하면 헤더 클릭(쿼리 없는 /mypage)이 곧 목록 복귀가 되고,
  //       브라우저 뒤로가기·새로고침·링크 공유도 전부 자연스럽게 동작한다.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const planParam = searchParams.get("plan");
  const selectedPlanId =
    planParam !== null && !Number.isNaN(Number(planParam)) ? Number(planParam) : null;
  const selectPlan = (id: number) => {
    // 미확정(draft) 계획은 읽기 전용 상세 대신 메인 워크벤치로 —
    // 거기서 대화로 이어서 수정할 수 있다 (PlanningRoom이 ?plan=을 읽어 불러옴)
    const trip = trips?.find((t) => t.plan_id === id);
    if (trip?.status === "draft") {
      navigate(`/?plan=${id}`);
      return;
    }
    setSearchParams({ plan: String(id) });
  };
  const backToList = () => setSearchParams({});

  /** 미확정 계획 삭제 — 성공하면 목록에서 즉시 제거 (재조회 없이) */
  const handleDelete = async (requestId: number) => {
    try {
      await deleteTrip(requestId);
      setTrips((prev) => prev?.filter((t) => t.request_id !== requestId) ?? null);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  /** 계획 이름 수정 — 성공 시 목록만 갱신하고 null, 실패 시 에러 문구 반환 (인라인 표시) */
  const handleRename = async (requestId: number, title: string) => {
    try {
      const res = await updateTripTitle(requestId, title);
      setTrips(
        (prev) =>
          prev?.map((t) =>
            t.request_id === requestId ? { ...t, title: res.title } : t,
          ) ?? null,
      );
      return null;
    } catch (e) {
      // 전역 error state를 쓰면 목록 전체가 에러 화면으로 바뀌므로 문구만 돌려준다
      return getApiErrorMessage(e);
    }
  };

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-11 md:px-7">
      {selectedPlanId !== null ? (
        <TripDetail planId={selectedPlanId} onBack={backToList} />
      ) : (
        <>
          {/* 제목 왼쪽 / 돌아가기 오른쪽 끝 — justify-between으로 양끝 정렬 */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.045em]">
              마이페이지
            </h1>
            <button
              onClick={() => navigate("/planningroom")}
              className="rounded-lg border border-line bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
            >
              ← 돌아가기
            </button>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <ProfileCard />
            {error ? (
              <p className="rounded-card border border-line bg-paper px-[22px] py-11 text-center text-sm text-stamp">
                {error}
              </p>
            ) : (
              <TripList
                trips={trips}
                onSelect={selectPlan}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
