import IntroCards from "./components/IntroCards";

/**
 * 메인 화면 (랜딩 + 챗 + 계획서)
 *  - 왼쪽 챗 패널  → 이슈 4
 *  - 오른쪽 계획서 → 이슈 5
 */
export default function PlanningRoom() {
  return (
    <div>
      {/* 배경 이미지 섹션 — 전체 너비 */}
      <section
        className="relative pt-10 pb-5 md:pt-14"
        style={{
          backgroundImage: "url('/ex6.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 90%",
        }}
      >
        <div className="absolute inset-0 bg-white/0" />
        
        <div className="relative mx-auto max-w-[1240px] px-5 md:px-7">
          <p className="mb-4 flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-white font-bold">
  검색 없이 → 바로 계획
  <span className="h-px w-[120px] bg-line" />
</p>
          <h1 className="max-w-[15ch] text-[clamp(32px,4.4vw,52px)] font-extrabold leading-[1.12] tracking-[-0.045em] text-white">
  고르는 대신 적어보세요.
</h1>
          <p className="mt-4 max-w-[46ch] text-[16.5px] text-white">
          가는 날짜, 인원, 목적지, 예산을 입력하면<br />여행 계획이 완성됩니다.
</p>
        </div>
      </section>

      {/* 나머지 컨텐츠 */}
      <div className="mx-auto max-w-[1240px] px-5 md:px-7">
        <section className="grid grid-cols-1 items-start gap-5 pb-24 pt-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* 챗 패널 자리 (이슈 4) */}
          <div className="h-[620px] rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04),0_18px_40px_-28px_rgba(15,20,24,.3)] lg:sticky lg:top-[88px]">
            <div className="grid h-full place-items-center text-sm text-ink-3">
              챗 패널 (이슈 4)
            </div>
          </div>

          {/* 계획서 캔버스 자리 (이슈 5) */}
          <div className="min-h-[620px] rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04),0_18px_40px_-28px_rgba(15,20,24,.3)]">
            <div className="grid h-[620px] place-items-center text-sm text-ink-3">
              계획서 캔버스 (이슈 5)
            </div>
          </div>
        </section>
      </div>

      {/* 소개 카드 4개 */}
      <IntroCards />
    </div>
  );
}