import { useEffect, useRef, useState } from "react";
import { STEP_RANGE } from "../hooks/usePlan";

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
  /** 전체 진행률 0~100 (trace 이벤트 기반) */
  progress: number;
}

/**
 * 진행 중인 바를 "매 프레임" 부드럽게 채우는 훅 (requestAnimationFrame).
 * setInterval 방식은 결국 작은 계단이라 뚝뚝 끊겨 보였다 → 매 프레임(60fps)
 * 목표치와의 거리에 비례해 다가가는 지수 감쇠 방식으로 완전히 연속적인
 * 움직임을 만든다. 목표가 멈춰 있는 동안에도 97%까지 아주 천천히 전진.
 * 값은 절대 뒤로 가지 않는다 (왔다갔다 방지).
 */
function useSmoothProgress(target: number) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);
  const state = useRef({ value: 0, target: 0, last: 0 });

  state.current.target = Math.max(state.current.target, target); // 목표도 역행 금지

  useEffect(() => {
    const tick = (now: number) => {
      const s = state.current;
      const dt = Math.min(100, now - (s.last || now)) / 1000; // 초 단위 (탭 복귀 폭주 방지)
      s.last = now;
      // 목표 추격: 거리의 일정 비율씩 (지수 감쇠 = 처음 빠르고 끝은 살살)
      const chase = (s.target - s.value) * Math.min(1, dt * 3.5);
      // 대기 크리프: 목표에 도달해 있어도 초당 1.2%씩 97%까지
      const creep = dt * 1.2;
      s.value = Math.min(97, Math.max(s.value + Math.max(chase, 0), Math.min(97, s.value + creep)));
      setValue(s.value);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return value;
}

/** 진행 중인 단계 전용 바 — 단계가 바뀔 때 key로 리마운트되어 0부터 다시 찬다 */
function RunningBar({ target }: { target: number }) {
  const value = useSmoothProgress(target);
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
      {/* width를 매 프레임 직접 갱신하므로 CSS transition은 오히려 빼는 게 매끄러움 */}
      <span
        className="block h-full rounded-full bg-cobalt"
        style={{ width: `${Math.max(2, value)}%` }}
      />
    </div>
  );
}

/** 계획을 짜는 동안 보여주는 단계별 진행률 리스트 */
export default function PlanProgress({ current, progress }: Props) {
  // 단계 역행 방지: 이벤트 타이밍이 어긋나 current가 일시적으로 낮게 와도
  // 화면의 단계는 절대 뒤로 가지 않는다 ("검색 파트에서 왔다갔다" 현상 차단)
  const maxStepRef = useRef(0);
  maxStepRef.current = Math.max(maxStepRef.current, current);
  const shownStep = maxStepRef.current;

  return (
    <div
      className="flex h-[620px] flex-col justify-center px-8"
      style={{ fontFamily: "Pretendard, sans-serif" }}
    >
      {STEPS.map((label, i) => {
        const done = i < shownStep;
        const running = i === shownStep;

        // 전체 진행률(%)을 이 단계 구간 안의 0~100으로 환산
        const range = STEP_RANGE[Math.min(i, STEP_RANGE.length - 1)];
        const withinPct = running
          ? Math.max(0, Math.min(100, ((progress - range.base) / (range.cap - range.base)) * 100))
          : 0;

        return (
          <div
            key={label}
            className={`border-b border-line-soft py-3.5 transition-opacity duration-300 last:border-b-0 ${
              done || running ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="flex items-center gap-3.5">
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

            {/* 항목마다 자기만의 진행률 바 — 완료는 꽉 참, 진행 중은 부드럽게 참 */}
            {done && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
                <span className="block h-full w-full rounded-full bg-ink/80" />
              </div>
            )}
            {running && <RunningBar key={`run-${i}`} target={withinPct} />}
          </div>
        );
      })}
    </div>
  );
}
