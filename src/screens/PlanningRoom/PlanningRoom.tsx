import type { JSX } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Plane,
  Check,
  ChevronRight,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.jpg";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};


const messages: ChatMessage[] = [
  /*{ id: "1", role: "user", text: "후쿠오카 3박 4일로 여행 계획을 짜고 싶어요." },
  { id: "2", role: "assistant", text: "네! 항공 • 숙소 • 일정 • 예산을 한 번에 설계해드릴게요. 예산은 어느 정도로 생각하고 계신가요?" },
  { id: "3", role: "user", text: "100만원 정도로 생각하고 있어요." },
  { id: "4", role: "assistant", text: "좋아요, 100만원 기준으로 항공권과 숙소를 먼저 찾아볼게요." },
  { id: "5", role: "user", text: "쇼핑가 근처 숙소로 추천해주세요." },*/
];

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

export const PlanningRoom = (): JSX.Element => {
  const navigate = useNavigate();

  const scale = useResponsiveScale();
  const scaledHeight = DESIGN_HEIGHT * scale;

  return (
    <div className="m-0 h-screen w-full overflow-hidden bg-white p-0">
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
            {/* ===== 헤더 ===== */}
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

            {/* ===== 왼쪽: 여행 상세 정보 ===== */}
            <section aria-label="여행 상세 정보" className="absolute left-0 top-[90px] h-[900px] w-[1270px]">

              {/* 예산 사용 카드 */}
              <div className="absolute left-[16px] top-[279px] h-[160px] w-[1250px] rounded-[10px] border-2 border-black bg-white">
                <div className="absolute left-[40px] top-[26px] h-[20px] w-[20px] rounded-[5px] bg-green-200" />
                <p className="absolute left-[80px] top-[22.5px] text-xl font-bold text-black [font-family:'Inter',Helvetica]">
                  예산 사용
                </p>

                <div className="absolute left-[40px] top-[100px] h-[32px] w-[1165px] rounded-[10px] bg-zinc-300" />
              </div>

              {/* 항공 카드 */}
              <div className="absolute left-[16px] top-[447px] h-[182px] w-[615px] rounded-[10px] border-2 border-black bg-white">
                <div className="absolute left-[40px] top-[26px] h-[20px] w-[20px] rounded-[5px] bg-cyan-400" />
                <p className="absolute left-[80px] top-[22.5px] text-xl font-bold text-black [font-family:'Inter',Helvetica]">항공</p>
                <div className="absolute left-[533px] top-[12px] flex h-[26px] w-[64px] items-center justify-center rounded-full border border-black bg-yellow-50">
                  <span className="text-base font-semibold text-black [font-family:'Inter',Helvetica]"></span>
                </div>
                
                <div className="absolute left-[299px] top-[139px] flex h-7 w-28 items-center justify-center rounded-[40px] border-2 border-black bg-orange-50">
                  <span className="text-base font-semibold text-black [font-family:'Pretendard',Helvetica]"></span>
                </div>
                <div className="absolute left-[418px] top-[139px] flex h-7 w-28 items-center justify-center gap-1 rounded-[40px] border-2 border-black bg-pink-400">
                  <span className="text-base font-semibold text-black [font-family:'Pretendard',Helvetica]"></span>
                </div>
              </div>

              {/* 숙소 후보 카드 */}
              <div className="absolute left-[16px] top-[636px] h-[182px] w-[615px] rounded-[10px] border-2 border-black bg-white">
                <div className="absolute left-[40px] top-[26px] h-[20px] w-[20px] rounded-[5px] bg-amber-200" />
                <p className="absolute left-[80px] top-[22.5px] text-xl font-bold text-black [font-family:'Inter',Helvetica]">숙소</p>
                <div className="absolute left-[533px] top-[12px] flex h-[26px] w-[64px] items-center justify-center rounded-full border border-black bg-yellow-50">
                  <span className="text-base font-semibold text-black [font-family:'Inter',Helvetica]"></span>
                </div>

                

                <div className="absolute left-[299px] top-[139px] flex h-7 w-28 items-center justify-center rounded-[40px] border-2 border-black bg-orange-50">
                  <span className="text-base font-semibold text-black [font-family:'Pretendard',Helvetica]"></span>
                </div>
                <div className="absolute left-[418px] top-[139px] flex h-7 w-28 items-center justify-center gap-1 rounded-[40px] border-2 border-black bg-pink-400">
                  <span className="text-base font-semibold text-black [font-family:'Pretendard',Helvetica]"></span>
                </div>
              </div>

            </section>

            {/* ===== 가운데: 일정(타임라인) 패널 ===== */}
            <section
              aria-label="일정 타임라인"
              className="absolute left-[642px] top-[537px] h-[372px] w-[624px] rounded-[10px] border-2 border-black bg-white"
            >
              <div className="absolute left-[40px] top-[26px] h-5 w-5 rounded-[5px] bg-red-500" />
              <p className="absolute left-[80px] top-[22.5px] text-xl font-bold text-black [font-family:'Inter',Helvetica]">일정</p>
              <button
                type="button"
                className="absolute left-[420px] top-[22.5px] flex items-center gap-1 bg-transparent text-lg font-bold text-black hover:opacity-70 [font-family:'Inter',Helvetica]"
              >
                전체 일정표 보기 <ChevronRight className="h-4 w-4" />
              </button>

            </section>

            {/* ===== 오른쪽: AI 대화 패널 ===== */}
            <aside
              aria-label="AI 대화 패널"
              className="absolute left-[1296px] top-[-30px] z-10 h-[940px] w-[624px] border-l border-black bg-white"
            >
              <aside
                aria-label="구분선"
                className="absolute left-[5px] top-[165px] h-[1px] w-[1200px] bg-black"
              />
              <MessageCircle className="absolute left-[20px] top-[105px] h-10 w-10 text-black" />
              <p className="absolute left-[80px] top-[110px] text-2xl font-bold text-black [font-family:'Pretendard',Helvetica]">
                대화
              </p>
              <div className="absolute left-[280px] top-[108px] z-10 flex h-9 w-[300px] items-center px-4 rounded-[10px] border-[3px] border-black bg-white">
                <span className="text-lg font-bold text-black/70 [font-family:'Pretendard',Helvetica]">
                </span>
              </div>

              {/* 메시지 목록 */}
              <div className="absolute left-[24px] top-[250px] z-10 flex h-[700px] w-[576px] flex-col gap-6 overflow-y-auto pr-2">
                {/*여기에 메세지 목록이 들어감.*/}
              </div>

              {/* 여행 취향 입력창 */}
              <div className="absolute left-[30px] top-[852px] z-20 h-[68px] w-[557px] rounded-[20px] border border-black bg-white">
              <input
                type="text"
                placeholder="여행 취향을 적어주세요..."
                className="h-full w-full bg-transparent px-6 text-xl font-bold text-black outline-none placeholder:text-stone-300 [font-family:'Pretendard',Helvetica]"
              />
                <button
                  type="button"
                  aria-label="메시지 보내기"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>

              {/* 계획 확정 버튼 */}
              <button
                type="button"
                className="absolute left-[457.8px] top-[797px] z-10 h-10 w-32 rounded-[20px] shadow-[0px_2px_0px_0px_rgba(0,0,0,1.00)] border-2 border-black bg-pink-400 text-lg font-bold text-black transition-all hover:brightness-95 active:translate-y-[2px] active:translate-y-2.5 active:shadow-[0px_0px_2px_0px_rgba(0,0,0,1.00)] [font-family:'Pretendard',Helvetica]"
              >
                계획 확정
              </button>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
};