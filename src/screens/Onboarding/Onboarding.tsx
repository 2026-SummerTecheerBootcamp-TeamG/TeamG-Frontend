import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import FeatureSection from "./components/FeatureSection";
import Reveal from "./components/Reveal";
import { onboardingStorage } from "@/lib/onboarding";
import bg from "@/assets/img/background.jpg";

/** 숙소(teal) / 일정(amber) / 동선(violet) 색상 구분은 index.css 디자인 토큰과 동일하게 맞춘다 */
const PLAN_PARTS = [
  { icon: "🏨", label: "숙소", dot: "bg-teal" },
  { icon: "🗓️", label: "일정", dot: "bg-amber" },
  { icon: "🧭", label: "동선", dot: "bg-violet" },
];

// step 01 예시의 파싱 칩 — 위 채팅 예시 문장과 반드시 1:1로 맞아야 한다
// (예전엔 문장에 없는 "2인"이 칩에 있어 "멋대로 추가한" 것처럼 보였음 — 피드백)
const SLOT_CHIPS = ["8/10 – 8/13", "도쿄", "2인", "100만원"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const finish = () => {
    onboardingStorage.markSeen();
    navigate("/planningroom", { replace: true });
  };

  return (
    <div className="bg-white">
      {/* 히어로 — 토스 랜딩 참고: 좌측 큰 헤드라인 + 우측 떠 있는 사진/칩 비주얼. 전체화면 등 뷰포트가 커지면 히어로 콘텐츠가 화면 중앙 쪽으로 내려와 채워지도록 min-h-screen + 수직 중앙 정렬 */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-12 px-5 py-16 md:grid-cols-2 md:gap-10 md:px-7 md:py-20">
          <div>
            <span className="w-fit rounded-full bg-cobalt-soft px-3.5 py-1.5 text-[12.5px] font-bold text-cobalt">
              트립캔버스 시작 가이드
            </span>
            <h1 className="mt-9 text-[clamp(32px,5.2vw,56px)] font-extrabold leading-[1.45] tracking-[-0.035em] text-ink">
              복잡한 계획은 AI에게,
              <br />
              여행은 당신에게
            </h1>
            <p className="mt-9 max-w-[440px] text-[16px] leading-relaxed text-ink-2">
              날짜와 인원만 말해주세요. 숙소·일정·동선까지 AI가 한 번에
              정리해드립니다.
            </p>

            <div className="mt-16 flex items-center gap-3">
              {/* hover: 색 + 살짝 커짐 (피드백) — transition-all로 둘 다 부드럽게 */}
              <button
                onClick={finish}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-cobalt px-7 py-4 text-[15.5px] font-bold text-white transition-all duration-200 hover:scale-[1.04] hover:bg-[#1c36c4]"
              >
                <span>채팅하러 가기</span>
                <ArrowRight size={17} strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>

          {/* 우측 비주얼 — 사진 카드 + 떠 있는 정보 칩 (토스 랜딩의 플로팅 UI 카드 스타일) */}
          <div className="relative mx-auto w-full max-w-[480px] md:mx-0 md:ml-auto">
            <div
              className="aspect-[4/5] rounded-[32px] bg-cover bg-center shadow-[0_30px_70px_-24px_rgba(39,67,224,.35)]"
              style={{ backgroundImage: `url(${bg})` }}
            />

            <div className="absolute -left-4 -top-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_40px_-16px_rgba(15,20,24,.25)] md:-left-8">
              <span className="text-[18px]">🗓️</span>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold text-ink-3">일정</p>
                <p className="text-[13px] font-bold text-ink">8.10 – 8.13</p>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_18px_40px_-16px_rgba(15,20,24,.25)] md:-right-8">
              <span className="text-[18px]">✅</span>
              <div className="leading-tight">
                <p className="text-[11px] font-semibold text-ink-3">완성까지</p>
                <p className="text-[13px] font-bold text-ink">약 3분</p>
              </div>
            </div>
          </div>
        </div>

        {/* 스크롤 유도 화살표 — 아래에 더 볼 내용이 있다는 힌트, 스크롤하면 fade-out */}
        <div
          className={`flex justify-center pb-10 transition-opacity duration-300 md:pb-14 ${
            scrolled ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex h-30 w-9 animate-bounce items-center justify-center rounded-full text-ink-3">
            <ChevronDown size={42} strokeWidth={2.5} aria-hidden />
          </span>
        </div>
      </section>

      {/* 3단계 — 섹션별로 큰 헤드라인 + 좌우 교차 배치 (토스 기능 소개 섹션 스타일) */}
      <section className="bg-white">
        {/* 각 단계는 스크롤로 들어올 때 아래→위로 떠오르며 등장 (Reveal, 피드백).
            맨 아래 파란 CTA 영역은 연출 제외 — 피드백 명세 */}
        <div className="mx-auto flex max-w-[1240px] flex-col gap-28 px-5 pb-20 pt-16 md:gap-36 md:px-7 md:pb-28 md:pt-24">
          <Reveal>
          <FeatureSection
            step="01"
            tone="cobalt"
            icon="💬"
            title="채팅으로 요청하세요"
            desc="가고 싶은 날짜, 인원, 예산, 취향을 자유롭게 말해주세요. 정해진 양식은 없습니다."
          >
            <div className="flex flex-col gap-2">
              <div className="max-w-[90%] self-end whitespace-pre-wrap break-keep rounded-2xl rounded-br-[5px] bg-ink px-3 py-2 text-[12.5px] text-white">
                8월 10일에 3박 4일, 도쿄 2명이서 100만원으로 여행 가고 싶어
              </div>
              <div className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-[5px] bg-[#eef1f4] px-3 py-2.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b7bfc7]"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SLOT_CHIPS.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-cobalt-soft px-2 py-1 text-[10.5px] font-semibold text-cobalt"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </FeatureSection>
          </Reveal>

          <Reveal>
          <FeatureSection
            step="02"
            tone="violet"
            icon="🧩"
            title="AI가 숙소·일정·동선을 한 번에"
            desc="대화 내용을 바탕으로 숙소, 일정, 이동 동선까지 색으로 구분해서 정리해드립니다."
            reverse
          >
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[11.5px] font-semibold text-ink-2">구성 중</span>
                  <span className="text-[11.5px] font-semibold tabular-nums text-cobalt">
                    81%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
                  <span className="block h-full w-[81%] rounded-full bg-cobalt" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {PLAN_PARTS.map((part) => (
                  <div
                    key={part.label}
                    className="flex items-center gap-2 rounded-field border border-line bg-white px-3 py-2"
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${part.dot}`} />
                    <span className="text-[13px]">{part.icon}</span>
                    <span className="text-[12.5px] font-semibold text-ink">
                      {part.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FeatureSection>
          </Reveal>

          <Reveal>
          <FeatureSection
            step="03"
            tone="stamp"
            icon="✅"
            title="마음에 들면 확정"
            desc="자유롭게 수정하다가 마음에 들면 확정하세요. 마이페이지에서 언제든 다시 볼 수 있어요."
          >
            <div className="flex flex-col items-center gap-3 py-2">
              <span className="flex h-16 w-16 rotate-[-8deg] items-center justify-center rounded-full border-[3px] border-dashed border-stamp text-[12px] font-extrabold tracking-[0.08em] text-stamp">
                확정
              </span>
              <p className="text-center text-[12.5px] text-ink-2">
                마이페이지 → 저장한 계획
              </p>
            </div>
          </FeatureSection>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cobalt to-violet">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:22px_22px] opacity-[0.12]"
        />
        {/* 세로 여백 2배(py-24→48) — 텍스트는 그대로 수직·수평 중앙 (피드백) */}
        <div className="relative mx-auto flex max-w-[1240px] flex-col items-center justify-center px-5 py-48 text-center text-white md:px-7 md:py-56">
          <h2 className="text-[clamp(26px,4vw,42px)] font-extrabold leading-[1.25] tracking-[-0.035em]">
            이제 직접 계획을 세워볼까요?
          </h2>
          <p className="mt-3 text-[16px] text-white/80">
            지금 시작하면 몇 분 안에 첫 여행 계획이 완성돼요.
          </p>
          {/* hover: 살짝 커지기만 하는 흰 버튼 — 색 반전은 시도 후 롤백 (파란 배경에 묻혀 보임) */}
          <button
            onClick={finish}
            className="mt-8 rounded-full bg-white px-9 py-4 text-[16px] font-bold text-cobalt transition-transform hover:scale-[1.03]"
          >
            여행 계획 시작하기 →
          </button>
        </div>
      </section>
    </div>
  );
}
