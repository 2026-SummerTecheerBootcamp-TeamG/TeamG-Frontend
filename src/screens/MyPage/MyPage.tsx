import ProfileCard from "./components/ProfileCard";

/**
 * 마이페이지
 *  - 프로필 조회/수정 (이슈 7)
 *  - 저장한 계획 목록/상세 (이슈 8)
 */
export default function MyPage() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-11 md:px-7">
      <h1 className="mb-6 text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.045em]">
        마이페이지
      </h1>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <ProfileCard />

        {/* 저장한 계획 목록 자리 (이슈 8) */}
        <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
          <div className="grid h-[200px] place-items-center text-sm text-ink-3">
            저장한 계획 목록 (이슈 8)
          </div>
        </div>
      </div>
    </div>
  );
}