import type { JSX } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.jpg";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

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

export const MyPage = (): JSX.Element => {
  const scale = useResponsiveScale();
  const scaledHeight = DESIGN_HEIGHT * scale;
  const navigate = useNavigate();

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
            {/* ===== 헤더 (위치 유지) ===== */}
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

            {/* ===== 프로필 영역 (-70px) ===== */}
            <section aria-label="프로필">
              <div className="absolute left-[73px] top-[93.5px] h-[120px] w-[112px] bg-rose-200" />
              <h1 className="absolute left-[209px] top-[105px] text-5xl font-bold text-black [font-family:'Pretendard',Helvetica]">G팀의 여행 서랍</h1>
              <p className="absolute left-[210px] top-[171.5px] text-lg font-bold text-neutral-500 [font-family:'Pretendard',Helvetica]">123456@gmail.com</p>

              <div className="absolute left-[1476.5px] top-[93.5px] h-[120px] w-[144px] rounded-[25px] border-2 border-black bg-white">
                <p className="absolute left-[57px] top-[30.5px] z-10 text-5xl font-bold text-black [font-family:'Inter',Helvetica]">0</p>{/* 숫자 나중에 바뀌게 */}
                <div className="absolute left-[27px] top-[55px] h-[24px] w-[88px] bg-pink-300" />
                <p className="absolute left-[27px] top-[79px] text-lg font-semibold text-zinc-400 [font-family:'Pretendard',Helvetica]">완성된 계획</p>
              </div>

              <div className="absolute left-[1647px] top-[93.5px] h-[120px] w-[144px] rounded-[25px] border-2 border-black bg-white">
                <p className="absolute left-[57px] top-[30.5px] z-10 text-5xl font-bold text-black [font-family:'Inter',Helvetica]">0</p>{/* 숫자 나중에 바뀌게 */}
                <p className="absolute left-[26px] top-[74px] text-lg font-semibold text-zinc-400 [font-family:'Pretendard',Helvetica]">다녀온 계획</p>
              </div>
            </section>

            {/* 헤더 아래 구분선 */}
            <div className="absolute left-[31px] top-[232px] h-0 w-[1866.5px] border-t border-black" />

            {/* ===== 나의 여행 섹션 ===== */}
            <section aria-label="나의 여행">
              <h2 className="absolute left-[590.5px] top-[270.5px] text-3xl font-bold text-black [font-family:'Pretendard',Helvetica]">나의 여행</h2>
              <div className="absolute left-[585.5px] top-[307px] h-[8px] w-[128px] rounded-[20px] border-2 border-black bg-yellow-400" />
              <div className="absolute left-[585.5px] top-[313.5px] h-0 w-[1298.5px] border-t-[5px] border-black" />

              <button type="button" aria-label="새 여행 추가하기" className="absolute left-[585.5px] top-[396.5px] flex h-[266.5px] w-[232px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[15px] border-[2.5px] border-dashed border-red-300 bg-red-300/40 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-300 shadow-[0px_7.5px_2px_0px_rgba(0,0,0,1.00)]">
                  <Plus className="h-8 w-8 text-black" strokeWidth={3} />
                </div>
                <span className="text-lg font-bold text-black [font-family:'Pretendard',Helvetica]">새 여행 추가</span>
              </button>
            </section>

            {/* ===== 여행취향 섹션 ===== */}
            <section aria-label="여행취향">
              <h2 className="absolute left-[32px] top-[276.5px] text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">여행취향</h2>
              <div className="absolute left-[23.5px] top-[320px] h-[198px] w-[518px] rounded-[25px] border-2 border-black bg-white">
                <p className="absolute left-[32px] top-[29.5px] text-2xl font-semibold text-neutral-500 [font-family:'Pretendard',Helvetica]">기본 출발지</p>
                <p className="absolute left-[209.5px] top-[29.5px] text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">ICN 인천</p>
                <button type="button" className="absolute left-[437px] top-[29.5px] cursor-pointer bg-transparent text-2xl font-semibold text-black hover:opacity-70 [font-family:'Pretendard',Helvetica]">수정</button>
                <div className="absolute left-[23.5px] top-[76.5px] h-0 w-[468.5px] border-t-[1.5px] border-black" />
                <p className="absolute left-[55.5px] top-[100.5px] text-2xl font-semibold text-neutral-500 [font-family:'Pretendard',Helvetica]">국적</p>
                <p className="absolute left-[209.5px] top-[100.5px] text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">대한민국 • KR</p>
                <div className="absolute left-[23.5px] top-[147.5px] h-0 w-[468.5px] border-t-[1.5px] border-black" />
                <button type="button" className="absolute left-[437px] top-[100.5px] cursor-pointer bg-transparent text-2xl font-semibold text-black hover:opacity-70 [font-family:'Pretendard',Helvetica]">수정</button>
              </div>
            </section>

            {/* ===== 계정 섹션 ===== */}
            <section aria-label="계정">
              <h2 className="absolute left-[32px] top-[556.5px] text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">계정</h2>
              <div className="absolute left-[23.5px] top-[599.5px] h-[198px] w-[518px] rounded-[25px] border-2 border-black bg-white">
                <button type="button" className="absolute left-[-10px] top-0 flex h-[86px] w-full cursor-pointer items-center justify-between bg-transparent px-[44.5px] rounded-[25px]">
                  <span className="text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">알림 설정</span>
                  <ChevronRight className="h-5 w-5 text-black" />
                </button>
                <div className="absolute left-[23.5px] top-[76.5px] h-0 w-[468.5px] border-t-[1.5px] border-black" />
                <button type="button" className="absolute left-[-10px] top-[76.5px] flex h-[71px] w-full cursor-pointer items-center justify-between bg-transparent px-[44.5px] rounded-[25px]">
                  <span className="text-2xl font-semibold text-black [font-family:'Pretendard',Helvetica]">계정 및 보안</span>
                  <ChevronRight className="h-5 w-5 text-black" />
                </button>
                <div className="absolute left-[23.5px] top-[147.5px] h-0 w-[468.5px] border-t-[1.5px] border-black" />
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};