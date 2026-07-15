import type { JSX } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import {
  Plane,
  UtensilsCrossed,
  Waves,
  BedDouble,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.jpg";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

type ItineraryItem = {
  id: string;
  time: string;
  category: "항공" | "맛집" | "여가" | "숙소";
  title: string;
  subtitle: string;
  price: string;
};

type TransitInfo = {
  mode: string;
  duration: string;
};

const dayOneItems: ItineraryItem[] = [
  {
    id: "flight",
    time: "08:20",
    category: "항공",
    title: "ICN 인천국제공항 → FUK 후쿠오카 국제공항",
    subtitle: "제주항공 C14DF1 • 직항 1h 35m • 왕복 포함가",
    price: "400,000",
  },
  {
    id: "ramen",
    time: "11:30",
    category: "맛집",
    title: "하카타 라멘 신신",
    subtitle: "동선 주변 자동 추가 • 보통 대기 없음",
    price: "12,000",
  },
  {
    id: "onsen",
    time: "12:40",
    category: "여가",
    title: "후쿠오카 트레디셔널 온천",
    subtitle: "숙소 도보 5분",
    price: "50,000",
  },
  {
    id: "matcha",
    time: "17:00",
    category: "맛집",
    title: "후쿠오카 말차 라떼 동동",
    subtitle: "동선 주변 자동 추가 • 보통 대기 없음",
    price: "20,000",
  },
  {
    id: "hotel",
    time: "19:30",
    category: "숙소",
    title: "코튼빌리지 프리미엄 호텔 체크인",
    subtitle: "동선 주변 자동 추가 • 보통 대기 없음",
    price: "200,000",
  },
];

const transitBetween: TransitInfo[] = [
  { mode: "공항선 → 하카타역", duration: "12분" },
  { mode: "도보", duration: "8분" },
  { mode: "도보", duration: "12분" },
  { mode: "도보", duration: "10분" },
];

type CategoryType = "항공" | "맛집" | "여가" | "숙소";

interface CategoryStyle {
  dot: string;
  icon: JSX.Element;
}

const categoryStyles: Record<CategoryType, CategoryStyle> = {
  항공: { dot: "bg-cyan-300", icon: <Plane className="h-5 w-5 text-black" /> },
  맛집: { dot: "bg-emerald-200", icon: <UtensilsCrossed className="h-5 w-5 text-black" /> },
  여가: { dot: "bg-amber-300", icon: <Waves className="h-5 w-5 text-black" /> },
  숙소: { dot: "bg-red-300", icon: <BedDouble className="h-5 w-5 text-black" /> },
};

function useResponsiveScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = window.innerWidth;
      setScale(availableWidth / DESIGN_WIDTH);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return scale;
}

export const PlanConfirm = (): JSX.Element => {
  const scale = useResponsiveScale();
  const scaledHeight = DESIGN_HEIGHT * scale;
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(1);
  const [labelDay, setLabelDay] = useState(1); // 텍스트 전환용 (박스 애니메이션 끝난 뒤 갱신)

useEffect(() => {
  const timer = setTimeout(() => setLabelDay(selectedDay), 150); // duration-300과 동일하게
  return () => clearTimeout(timer);
}, [selectedDay]);

  return (
    <div className="m-0 h-dvh w-full overflow-y-auto overflow-x-hidden bg-white p-0">
      <div style={{ width: "100%", height: scaledHeight }}>
        <div
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <main className="relative h-[1080px] w-[1920px] overflow-hidden bg-white">
            {/* ===== 헤더 (고정) ===== */}
            <header className="absolute left-0 top-[0px] h-14 z-20 w-full border-b border-black bg-white">
              <div className="absolute left-17.25 top-1.75 w-12 font-['Pretendard',Helvetica]"><img src={logo} className="h-full w-full" /></div>
              <button type="button" onClick={() => navigate("/")} className="absolute left-32.5 top-3.25 h-6 w-48 cursor-pointer bg-transparent text-left text-2xl font-bold text-rose-600 transition-opacity hover:opacity-70 font-['Pretendard',Helvetica]">Trip</button>
              <button type="button" onClick={() => navigate("/")} className="absolute left-44.5 top-3.25 h-6 w-48 cursor-pointer bg-transparent text-left text-2xl font-bold text-black transition-opacity hover:opacity-70 font-['Pretendard',Helvetica]">Canvas</button>

              <nav aria-label="주요 메뉴">
                <button type="button" onClick={() => navigate("/my-trips")} className="absolute left-[363px] top-[15px] cursor-pointer bg-transparent text-xl font-bold text-black hover:opacity-70 [font-family:'Pretendard',Helvetica]">내 여행</button>
                <button type="button" onClick={() => navigate("/planning-room")} className="absolute left-[512px] top-[15px] cursor-pointer bg-transparent text-xl font-bold text-black hover:opacity-70 [font-family:'Pretendard',Helvetica]">플래닝 룸</button>
                <button type="button" onClick={() => navigate("/")} className="absolute left-[1620.5px] top-[15px] z-20 cursor-pointer bg-transparent text-xl font-semibold text-neutral-500 hover:opacity-70 [font-family:'Pretendard',Helvetica]">로그아웃</button>
                <button type="button" onClick={() => navigate("/my-page")} className="absolute left-[1749px] top-[15px] z-20 cursor-pointer bg-transparent text-xl font-bold text-black hover:opacity-70 [font-family:'Pretendard',Helvetica]">마이 페이지</button>
              </nav>
            </header>

            {/* ===== 왼쪽: 경로 타이틀 + 지도 + 예산 (고정) ===== */}
            <section aria-label="여행 개요 및 지도" className="absolute left-[31px] top-[55px] h-[935px] w-[1005px]">
              {/* 경로 타이틀 */}
              <h1 className="absolute left-0 top-[29.5px] text-5xl font-bold text-black [font-family:'Inter',Helvetica]">
                출발지
              </h1>
              <Plane className="absolute left-[140px] top-[42px] h-8 w-8 rotate-45 text-black" />
              <h1 className="absolute left-[209.5px] top-[29.5px] text-5xl font-bold text-black [font-family:'Inter',Helvetica]">
                도착지
              </h1>
              <p className="absolute left-0 top-[87px] text-2xl font-bold text-neutral-500 [font-family:'Inter',Helvetica]">
                여기에 날짜 및 여행 기간 표시 (예: 2024.07.06 ~ 2024.07.10)
              </p>

              {/* 지도 영역 */}
              <div className="absolute left-[0px] top-[128.5px] h-[654.5px] w-[981px] overflow-hidden rounded-[20px] border-2 border-black">

                {/* 장소 핀 */}
                {/*{dayPins.map((pin) => (
                  <div
                    key={pin.label}
                    className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                    style={{ left: pin.left, top: pin.top }}
                  >
                    <div className="flex items-center gap-1 whitespace-nowrap rounded-full border-[3px] border-black bg-white px-3 py-1 text-lg font-bold text-black shadow-sm [font-family:'Pretendard',Helvetica]">
                      {pin.label}
                    </div>
                    <MapPin className="-mt-1 h-8 w-8 fill-rose-600 text-black" />
                  </div>
                ))}*/}

                {/* DAY 선택 pill (지도 위 오버레이) */}
                <div className="absolute left-[37px] top-[16px] flex items-center gap-3">
                  {[1, 2, 3, 4].map((day) => {
                    const isSelected = selectedDay === day;
                    const showFullLabel = isSelected && labelDay === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`flex items-center justify-center border-2 border-black font-bold text-black transition-all duration-150 ease-in-out [font-family:'Pretendard',Helvetica] hover:brightness-95 active:translate-y-[2px] active:shadow-[0px_0px_2px_0px_rgba(0,0,0,1.00)]
                          ${isSelected
                            ? "h-12 w-32 rounded-[20px] bg-orange-100 text-xl shadow-[0px_4px_2px_0px_rgba(0,0,0,0.57)]"
                            : "h-12 w-12 rounded-full bg-white text-xl hover:bg-neutral-100"
                          }`}
                      >
                        {showFullLabel ? `DAY ${day}` : day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 예산 사용 카드 */}
              <div className="absolute left-[0px] top-[800px] h-[182px] w-[982.5px] rounded-[20px] border-2 border-black bg-white">
                <p className="absolute left-[37px] top-[28px] text-2xl font-bold text-black [font-family:'Inter',Helvetica]">
                  예산 사용
                </p>
                <p className="absolute left-[37px] top-[64px] [font-family:'Inter',Helvetica]">
                  <span className="text-4xl font-bold text-black">0</span>
                  <span className="text-2xl font-bold text-neutral-400/70"> / 0 만</span>
                </p>

                <div className="absolute left-[37px] top-[128px] h-[14px] w-[854.5px] rounded-[10px] bg-zinc-300" />
              </div>
            </section>

            {/* ===== 오른쪽: DAY 1 타임라인 (이 섹션만 내부 스크롤) ===== */}
            <section aria-label="DAY 1 일정" className="absolute left-[1127px] top-[55px] h-[935px] w-[763px]">
              <aside
                aria-label="구분선"
                className="absolute left-[-50px] top-[5px] h-[1015px] border-l border-black"
              ></aside>

              {/* 제목 영역: 스크롤 안 되고 항상 고정 */}
              <h2 className="absolute left-0 top-3 text-5xl font-bold text-black [font-family:'Inter',Helvetica]">
                DAY 1
              </h2>
              <p className="absolute left-[px] top-[65.5px] text-3xl font-semibold text-neutral-400 [font-family:'Inter',Helvetica]">
                예)7.6 월 • 방문 4곳 • 이동 3시간
              </p>

              {/* 타임라인 리스트: 여기만 내부 스크롤 */}
              <div className="absolute left-0 top-[128.5px] h-[868px] w-full overflow-y-auto pr-2">
                <div className="flex flex-col">
                  {dayOneItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start gap-4">
                        {/* 타임라인 점 */}
                        <div className="flex flex-col items-center pt-3">
                          <div
                            className={`h-7 w-7 shrink-0 rounded-full border-[3px] border-black ${categoryStyles[item.category].dot}`}
                          />
                          {index < dayOneItems.length&& (
                            <div className="mt-1 h-[100px] w-[2px] bg-zinc-300" />
                          )}
                        </div>

                        {/* 카드 */}
                        <div className="mb-4 flex-1 rounded-[25px] border-2 border-black bg-white p-6">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-black [font-family:'Inter',Helvetica]">
                              {item.time}
                            </span>
                            <div className="flex items-center gap-2">
                              {categoryStyles[item.category].icon}
                              <span className="text-2xl font-semibold text-black [font-family:'Inter',Helvetica]">
                                {item.category}
                              </span>
                            </div>
                            <span className="text-xl font-semibold text-black underline [font-family:'Inter',Helvetica]">
                              {item.price}
                            </span>
                          </div>

                          <p className="mt-3 text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">
                            {item.title}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-neutral-600 opacity-80 [font-family:'Pretendard',Helvetica]">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* 카드 사이 이동 정보 */}
                      {index < transitBetween.length && (
                        <div className="mb-4 ml-11 flex items-center gap-3 text-neutral-500">
                          <span className="text-lg font-semibold [font-family:'Pretendard',Helvetica]">---</span>
                          <span className="text-lg font-semibold [font-family:'Pretendard',Helvetica]">
                            {transitBetween[index].mode} • {transitBetween[index].duration}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};