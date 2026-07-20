import type { ReactNode } from "react";

type Tone = "cobalt" | "violet" | "stamp";

/** 정적 문자열로 나열해야 Tailwind가 클래스를 스캔할 수 있다 (템플릿 보간 금지) */
const TONE_BADGE: Record<Tone, string> = {
  cobalt: "bg-cobalt-soft text-cobalt",
  violet: "bg-violet/10 text-violet",
  stamp: "bg-[#fef0ee] text-stamp",
};

const TONE_GLOW: Record<Tone, string> = {
  cobalt: "bg-cobalt/10",
  violet: "bg-violet/10",
  stamp: "bg-stamp/10",
};

/** 토스 랜딩처럼 — 화면 전체 폭 섹션에 큰 헤드라인과 카드형 비주얼을 좌우로 번갈아 배치 */
export default function FeatureSection({
  step,
  tone,
  icon,
  title,
  desc,
  reverse = false,
  children,
}: {
  step: string;
  tone: Tone;
  icon: string;
  title: string;
  desc: string;
  reverse?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={reverse ? "md:order-2" : ""}>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold tracking-[0.04em] ${TONE_BADGE[tone]}`}
        >
          <span aria-hidden>{icon}</span>
          STEP {step}
        </span>
        <h3 className="mt-4 text-[clamp(22px,3vw,32px)] font-extrabold leading-[1.3] tracking-[-0.03em]">
          {title}
        </h3>
        <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-ink-2">
          {desc}
        </p>
      </div>

      <div className={reverse ? "md:order-1" : ""}>
        <div className="relative">
          <span
            aria-hidden
            className={`absolute -inset-6 -z-10 rounded-[40px] blur-2xl ${TONE_GLOW[tone]}`}
          />
          <div className="rounded-[28px] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(15,20,24,.25)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { Tone };
