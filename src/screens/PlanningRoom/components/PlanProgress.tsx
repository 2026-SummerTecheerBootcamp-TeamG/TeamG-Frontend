const STEPS = [
    "요청 정리",
    "항공편 확정",
    "숙소 확정",
    "동선 배치",
    "예산 정산",
  ];
  
  /** 계획을 짜는 동안 보여주는 단계 리스트 */
  export default function PlanProgress({ current }: { current: number }) {
    return (
      <div className="flex h-[620px] flex-col justify-center px-8">
        {STEPS.map((label, i) => {
          const done = i < current;
          const running = i === current;
  
          return (
            <div
              key={label}
              className={`flex items-center gap-3.5 border-b border-line-soft py-3.5 transition-opacity duration-300 last:border-b-0 ${
                done || running ? "opacity-100" : "opacity-30"
              }`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] text-[10px] text-white transition-colors ${
                  done
                    ? "border-ink bg-ink"
                    : running
                      ? "animate-pulse border-cobalt bg-white"
                      : "border-line bg-white"
                }`}
              >
                {done && "✓"}
              </span>
              <span className="text-[14.5px] font-semibold tracking-[-0.02em]">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }