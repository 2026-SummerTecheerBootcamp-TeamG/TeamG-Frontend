/**
 * 메인 화면 (랜딩 + 챗 + 계획서)
 * 이슈 1에서는 레이아웃 뼈대만 잡는다.
 *  - 랜딩 문구   → 이슈 2
 *  - 왼쪽 챗 패널 → 이슈 4
 *  - 오른쪽 계획서 → 이슈 5
 */
export default function PlanningRoom() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 md:px-7">
      {/* 랜딩 (이슈 2에서 채운다) */}
      <section className="pt-10 pb-5 md:pt-14">
        <p className="mb-4 flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink-3">
          한 문장 → 확정된 여행
          <span className="h-px w-[120px] bg-line" />
        </p>
        <h1 className="max-w-[15ch] text-[clamp(32px,4.4vw,52px)] font-extrabold leading-[1.12] tracking-[-0.045em]">
          쓴 대로 정해진 계획이 나옵니다.
        </h1>
        <p className="mt-4 max-w-[46ch] text-[16.5px] text-ink-2">
          가는 날짜, 인원, 목적지, 예산을 한 줄로 적어보세요. 고를 목록 대신
          항공편·숙소·하루 동선이 예산 안에서 하나로 정리돼 나옵니다.
        </p>
      </section>

      {/* 워크벤치: 왼쪽 챗 + 오른쪽 계획서 (lg 미만에서 1단으로 스택) */}
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
  );
}