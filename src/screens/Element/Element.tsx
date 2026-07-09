import type { JSX } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ArrowRight, Plane, Star, Plus, Check } from "lucide-react";
import { FaWonSign } from "react-icons/fa";
import { Link } from "react-router-dom";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

const navItems = [
  { label: "로그인", href: "/login", className: "left-[1608.5px] top-[15px]" },
  { label: "회원가입", href: "/signup", className: "left-[1737px] top-[15px]" },
];

const flightTexts = [
  { text: "항공", className: "left-[1354.3px] top-[238.49px] text-[1.5rem] font-semibold text-zinc-500" },
  { text: "ICN", className: "left-[1371.02px] top-[290.92px] text-3xl font-semibold text-black" },
  { text: "제주항공 C214FD • 09:40", className: "left-[1384.97px] top-[334.34px] text-base font-semibold text-zinc-500" },
  { text: "480,000", className: "left-[1420.01px] top-[349.4px] text-2xl font-semibold text-black" },
  { text: "FUK", className: "left-[1578.1px] top-[220.11px] text-3xl font-semibold text-black" },
];

const stayStarPositions = [
  "left-[1259.76px] top-[533.63px]",
  "left-[1280.76px] top-[534.18px]",
  "left-[1300.75px] top-[534.71px]",
];

const itineraryPills = [
  { boxClassName: "w-28 h-16 left-[1170.47px] top-[663.51px]", text: "에펠탑", textClassName: "left-[1189.54px] top-[684.79px]" },
  { boxClassName: "w-42 h-16 left-[1303.23px] top-[678.82px]", text: "전통 베이글집", textClassName: "left-[1315.74px] top-[698.5px]" },
  { boxClassName: "w-28 h-16 left-[1490.25px] top-[701.36px]", text: "파리", textClassName: "left-[1521px] top-[723.01px]" },
];

function useResponsiveScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = window.innerWidth;
      const nextScale = availableWidth / DESIGN_WIDTH;
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return scale;
}

export const Element = (): JSX.Element => {
  const scale = useResponsiveScale();
  const scaledHeight = DESIGN_HEIGHT * scale;

  return (
    <div className="m-0 h-dvh w-full overflow-hidden bg-white p-0">
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
          <main className="relative h-270 w-[1920px] overflow-hidden bg-white">
            <header className="absolute left-0 top-0 h-14 w-[1920px] border-b border-black bg-white">
              <div className="absolute left-25.75 top-5 h-10 w-22 origin-top-left rotate-[-15.93deg] rounded-full border border-white bg-rose-600" />
              <div className="absolute left-33.25 top-3.75 w-16 text-xl font-bold text-orange-50 font-['Pretendard',Helvetica]">로고</div>

              {/* 프로젝트 제목 버튼 (예: 홈으로 이동) */}
              <button
                type="button"
                className="absolute left-52.5 top-3.25 h-6 w-48 cursor-pointer bg-transparent text-left text-2xl font-bold text-black transition-opacity hover:opacity-70 font-['Pretendard',Helvetica]"
              >
                Trip Canvas
              </button>

              <nav aria-label="주요 메뉴">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to = {item.href}
                    type="button"
                    className={`absolute cursor-pointer bg-transparent text-xl font-bold text-black transition-opacity hover:opacity-70 font-['Pretendard',Helvetica] ${item.className}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>

            <section aria-label="히어로 섹션">
              <h1 className="absolute left-28.5 top-52.5 text-4xl font-bold text-black font-['Pretendard',Helvetica]">여행 계획은</h1>
              <h1 className="absolute left-30 top-104 text-4xl font-bold text-black font-['Inter',Helvetica]">이 한 줄로 끝.</h1>
              <p className="absolute left-28.5 top-[508.5px] text-xl font-semibold text-neutral-400 font-['Inter',Helvetica]">
                엔터를 누르는 순간, 네 개의 AI 에이전트가 <br /> 항공 • 숙소 • 일정 • 예산을 동시에 설계해요.
              </p>
              <div className="absolute left-28.5 top-68.75 h-28 w-178 rounded-[35px] border-[3px] border-black bg-white shadow-[2px_5px_2px_0px_rgba(0,0,0,1.00)]" />
              <p className="absolute left-[164.5px] top-78.25 text-3xl font-bold text-black font-['Pretendard',Helvetica]">후쿠오카 3박 4일 여행, 100만원</p>
              <div className="absolute left-153.5 top-76.25 h-13 w-[0.1px] border border-black bg-black" />
              <button type="button" onClick={() => window.location.href = '/login'} className="absolute left-[692.5px] top-74.5 flex h-16 w-22 items-center justify-center rounded-[10px] bg-rose-600">
                <ArrowRight className="h-8 w-8 text-white" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="absolute left-28.5 top-[605.5px] h-24 w-93.5 rounded-[40px] border-[3px] border-black bg-rose-600 text-3xl font-semibold text-white font-['Inter',Helvetica] shadow-[0px_10px_2px_0px_rgba(0,0,0,1.00)] transition-all duration-150 ease-out hover:translate-y-1 hover:shadow-[0px_6px_2px_0px_rgba(0,0,0,1.00)] active:translate-y-2.5 active:shadow-[0px_0px_2px_0px_rgba(0,0,0,1.00)]"
              >
                내 여행 만들기
              </button>
            </section>

            <section aria-label="예산 및 항공 카드">
              <div className="absolute left-329.25 top-[225.34px] z-10 h-48 w-[338.6px] origin-top-left rotate-[-19.2deg] rounded-[20px] border-[3px] border-black bg-white shadow-[7px_9px_2px_0px_rgba(0,0,0,0.25)]" />
              {flightTexts.map((item) => (
                <p key={item.text} className={`absolute z-10 origin-top-left rotate-[-19.2deg] font-['Pretendard',Helvetica] ${item.className}`}>
                  {item.text}
                </p>
              ))}
              <div className="absolute left-[1438.1px] top-[287.04px] z-10 h-0 w-28 origin-top-left rotate-[-19.2deg] border-t-2 border-dashed border-black" />
              <FaWonSign className="absolute left-[1393.8px] top-[360.97px] z-10 h-6 w-6 origin-top-left rotate-[-19.2deg] text-black" />
              <Plane className="absolute left-[1559px] top-[232.32px] z-10 h-5 w-5 origin-top-left rotate-24 text-black" />
              <div className="absolute left-[1251.5px] top-[165.6px] z-20 h-16 w-55 origin-top-left rotate-[-10.05deg] rounded-[35px] border-[3px] border-black bg-white" />
              <div className="absolute left-[1267.6px] top-[172.4px] z-20 h-12 w-48 origin-top-left rotate-[-10.05deg] rounded-[35px] border-[3px] border-black bg-rose-600" />
              <p className="absolute left-[1306.4px] top-[173.67px] z-20 h-7 w-36 origin-top-left rotate-[-10.05deg] text-2xl font-semibold text-white font-['Pretendard',Helvetica]">예산 여유 9만</p>
              <Check className="absolute left-[1277.5px] top-[186.5px] z-20 h-5 w-7 origin-top-left rotate-[10.05deg] text-white" strokeWidth={3} />
              <div className="absolute left-[1566.55px] top-[163.33px] z-20 h-7 w-16 origin-top-left rotate-[17.68deg] rounded-[35px] border border-black bg-rose-600" />
              <p className="absolute left-[1585px] top-[160.89px] z-20 origin-top-left rotate-[17.68deg] text-base font-semibold text-white font-['Pretendard',Helvetica]">확정</p>
              <div className="absolute left-274.5 top-[365.54px] h-[241.78px] w-[510.18px] origin-top-left rotate-2 rounded-[20px] border-[3px] border-black bg-white shadow-[7px_9px_2px_0px_rgba(0,0,0,0.25)]" />
              <div className="absolute left-[1130.65px] top-[441.68px] h-26 w-26 origin-top-left rotate-[1.51deg] rounded-[15px] bg-linear-to-b from-yellow-400 to-orange-300" />
              <p className="absolute left-[1256.6px] top-[445.01px] origin-top-left rotate-[1.51deg] text-2xl font-bold text-zinc-500 font-['Pretendard',Helvetica]">숙소 • 후보 1/3</p>
              <p className="absolute left-[1255.75px] top-[477.5px] origin-top-left rotate-[1.51deg] text-3xl font-bold text-black font-['Pretendard',Helvetica]">코튼빌리지 프리미엄 호텔</p>
              {stayStarPositions.map((pos) => (
                <Star key={pos} className={`absolute h-6 w-6 origin-top-left rotate-[1.51deg] fill-black text-black ${pos}`} />
              ))}
              <p className="absolute left-[1331.33px] top-[532.01px] origin-top-left rotate-[1.51deg] text-2xl font-bold text-zinc-500 font-['Pretendard',Helvetica]">쇼핑가 도보 5 분</p>
            </section>

            <section aria-label="일정 카드">
              <div className="absolute left-[1157.31px] top-[585.5px] h-[241.78px] w-[488.18px] origin-top-left rotate-[6.37deg] rounded-[20px] border-[3px] border-black bg-white shadow-[7px_9px_2px_0px_rgba(0,0,0,0.25)]" />
              <p className="absolute left-[1193.22px] top-[621.3px] origin-top-left rotate-[6.52deg] text-2xl font-bold text-zinc-500 font-['Pretendard',Helvetica]">DAY 2</p>
              {itineraryPills.map((item) => (
                <div key={item.text}>
                  <div className={`absolute origin-top-left rotate-[6.54deg] rounded-[40px] border-[3px] border-black bg-orange-100 ${item.boxClassName}`} />
                  <p className={`absolute origin-top-left rotate-[6.52deg] text-2xl font-bold text-black font-['Pretendard',Helvetica] ${item.textClassName}`}>
                    {item.text}
                  </p>
                </div>
              ))}
              <div className="absolute left-[1164.7px] top-188 h-16 w-48 origin-top-left rotate-[6.52deg] rounded-[40px] border-4 border-dashed border-red-500 bg-white" />
              <Plus className="absolute left-[1188.1px] top-[774.89px] h-6 w-6 origin-top-left rotate-[6.52deg] text-red-500" strokeWidth={2.5} />
              <p className="absolute left-304.75 top-194 origin-top-left rotate-[6.52deg] text-2xl font-bold text-red-500 font-['Pretendard',Helvetica]">맛집 탐색...</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};