import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ChatPanel from "./components/ChatPanel";
import IntroCards from "./components/IntroCards";
import PlanProgress from "./components/PlanProgress";
import PlanSheet from "./components/PlanSheet";
import { useChat } from "./hooks/useChat";
import { usePlan } from "./hooks/usePlan";
import { formatWon } from "./lib/parseRequest";

export default function PlanningRoom() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { plan, request, status, step, version, error, start, loadExisting, editWithMessage, confirm } =
    usePlan();

  const chat = useChat({
    hasPlan: status === "ready" || status === "confirmed",
    onReady: start,
    onEdit: editWithMessage,
  });

  /** 마이페이지에서 "?plan=8"로 넘어온 경우: 저장된 계획을 불러와 수정 모드로 시작 */
  const [searchParams, setSearchParams] = useSearchParams();
  const loadedPlanRef = useRef(false); // StrictMode 이중 실행/재렌더 시 중복 로드 방지
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (!planParam || loadedPlanRef.current) return;
    loadedPlanRef.current = true;
    loadExisting(Number(planParam)).then((ok) => {
      chat.notify(
        ok
          ? "저장된 계획을 불러왔습니다. 원하는 수정을 문장으로 적어주세요.\n예: “2일차는 좀 여유롭게 해줘”"
          : "계획을 불러오지 못했습니다. 마이페이지에서 다시 시도해 주세요.",
      );
      // 주소를 "/"로 정리 - 이후 새 계획을 만들 때 옛 plan 파라미터가 남지 않게
      setSearchParams({}, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** 계획 생성/실패를 챗 쪽에 알린다 */
  const notifiedStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (status === "ready" && plan && notifiedStatusRef.current !== `ready:${version}`) {
      notifiedStatusRef.current = `ready:${version}`;
      const al = plan.allocation;
      const totalText =
        al && "total_cost" in al ? `총 ${formatWon(al.total_cost)}원` : "";
      chat.notify(`계획서를 완성했습니다. ${totalText} 오른쪽에서 확인해 주세요.`.trim());
    }
    if (status === "error" && error && notifiedStatusRef.current !== `error:${error}`) {
      notifiedStatusRef.current = `error:${error}`;
      chat.notify(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, version, error]);

  /** 계획 생성: 로그인 안 했으면 로그인 화면으로 보낸다 */
  const handleSend = (text: string) => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/" } });
      return;
    }
    chat.send(text);
  };

  /** 확정: 로그인 안 했으면 로그인 화면으로 보낸다 */
  const handleConfirm = async () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/" } });
      return;
    }
    if (!plan) return;
    const ok = await confirm();
    if (ok) {
      chat.notify("계획을 확정했습니다.\n마이페이지에서 다시 볼 수 있어요.");
    } else {
      chat.notify("계획을 확정하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div style={{ fontFamily: "Pretendard, sans-serif" }}>
      {/* 배경 이미지 섹션 — 전체 너비 */}
      <section
        className="relative pb-5 pt-10 md:pt-14"
        style={{
          backgroundImage: "url('/ex6.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 90%",
        }}
      >
        <div className="absolute inset-0 bg-white/0" />

        <div className="relative mx-auto max-w-[1240px] px-5 md:px-7">
          <p className="mb-4 flex items-center gap-2.5 text-[13.5px] font-bold uppercase tracking-[0.14em] text-white">
            검색 없이 → 바로 계획
            <span className="h-px w-[120px] bg-line" />
          </p>
          <h1 className="text-[clamp(32px,4.4vw,52px)] font-extrabold leading-[1.12] tracking-[-0.045em] text-white">
            고르는 대신, 적어보세요.
          </h1>
          <p className="mt-4 max-w-[46ch] text-[16.5px] text-white">
            가는 날짜, 인원, 목적지, 예산을 입력하면
            <br />
            여행 계획이 완성됩니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 md:px-7">
        {/* 워크벤치: 왼쪽 챗 + 오른쪽 계획서 */}
        <section className="grid grid-cols-1 items-start gap-5 pb-20 pt-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <ChatPanel
            messages={chat.messages}
            isTyping={chat.isTyping}
            hideExamples={chat.isReady}
            onSend={handleSend}
            onReset={chat.reset}
          />

          <div className="min-h-[620px] overflow-hidden rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04),0_18px_40px_-28px_rgba(15,20,24,.3)]">
            {status === "idle" && (
              <div className="grid h-[620px] place-items-center px-8 text-center">
                <div className="max-w-[330px]">
                  <span className="mx-auto mb-3 block h-0 w-px bg-[repeating-linear-gradient(180deg,var(--color-line)_0_5px,transparent_5px_11px)]" />
                  <h3 className="mb-2 text-[19px] font-bold tracking-[-0.03em]">
                    여기에 계획이 그려집니다
                  </h3>
                  <p className="break-keep text-sm text-ink-3">
                    왼쪽에 문장을 적으면 항공편, 숙소, 날짜별 동선과 예산 정산이
                    한 장으로 채워집니다.
                  </p>
                </div>
              </div>
            )}

            {status === "building" && <PlanProgress current={step} />}

            {status === "error" && (
              <div className="grid h-[620px] place-items-center px-8 text-center">
                <div className="max-w-[330px]">
                  <h3 className="mb-2 text-[17px] font-bold tracking-[-0.03em] text-stamp">
                    계획을 만들지 못했습니다
                  </h3>
                  <p className="break-keep text-sm text-ink-3">
                    {error ?? "잠시 후 다시 시도해 주세요."}
                  </p>
                </div>
              </div>
            )}

            {(status === "ready" || status === "confirmed") && plan && (
              <PlanSheet
                plan={plan}
                request={request}
                version={version}
                status={status}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        </section>

        <IntroCards />
      </div>
    </div>
  );
}