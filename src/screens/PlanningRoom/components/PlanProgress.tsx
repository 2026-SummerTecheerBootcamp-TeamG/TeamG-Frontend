// 실제 백엔드 파이프라인 순서와 1:1 (usePlan의 stepFromEvents가 이 인덱스를 계산)
// 검색(항공+숙소) -> 예산 배분 -> 일정/동선 -> 저장
const STEPS = [
  "요청 정리",
  "항공·숙소 검색",
  "예산 배분",
  "일정·동선 구성",
  "계획서 저장",
];

interface Props {
  /** 현재 단계 인덱스 */
  current: number;
  /** 진행률 0~100 (trace 이벤트 기반) */
  progress: number;
}

/** 계획을 짜는 동안 보여주는 진행률 + 단계 리스트 */
export default function PlanProgress({ current, progress }: Props) {
  return (
    <div
      className="flex h-[620px] flex-col justify-center px-8"
      style={{ fontFamily: "Pretendard, sans-serif" }}
    >
      {/* 진행률 */}
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-ink-2">
            {STEPS[Math.min(current, STEPS.length - 1)]}
          </span>
          <span className="text-[12.5px] font-semibold tabular-nums text-cobalt">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
          <span
            className="block h-full rounded-full bg-cobalt transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
      </div>

      {/* 단계 리스트 */}
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