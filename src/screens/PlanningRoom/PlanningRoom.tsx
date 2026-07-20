import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ChatPanel from "./components/ChatPanel";
import IntroCards from "./components/IntroCards";
import PlanProgress from "./components/PlanProgress";
import PlanSheet from "./components/PlanSheet";
import { useChat } from "./hooks/useChat";
import { usePlan } from "./hooks/usePlan";
import { getApiErrorMessage } from "@/lib/api";
import { formatWon } from "./lib/parseRequest";

export default function PlanningRoom() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const { plan, request, status, step, progress, version, error, editing, start, loadExisting, editWithMessage, selectCandidate, confirm, resetPlan } =
    usePlan();

  const chat = useChat({
    hasPlan: status === "ready" || status === "confirmed",
    onReady: start,
    onEdit: editWithMessage,
  });

  /** 마이페이지에서 "?plan=8"로 넘어온 경우: 저장된 계획을 불러와 수정 모드로 시작 */
  const [searchParams, setSearchParams] = useSearchParams();
  const loadedPlanRef = useRef(false);      // 같은 실행 사이클 안의 중복 요청 방지
  const restoredPlanRef = useRef<number | null>(null); // 대화 복원/안내는 계획당 1번만
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (!planParam || loadedPlanRef.current) return;
    loadedPlanRef.current = true;
    loadExisting(Number(planParam))
      .then((detail) => {
        if (!detail) return; // 언마운트로 취소된 경우 (조용히 종료가 정상)
        // StrictMode(개발 모드)는 effect가 2번 돌아 응답도 2번 올 수 있다 —
        // 복원·안내가 두 번 찍히지 않게 계획 ID 기준으로 1번만
        if (restoredPlanRef.current === detail.plan_id) return;
        restoredPlanRef.current = detail.plan_id;
        // 저장 스냅샷으로 재구성된 대화가 있으면 챗에 통째로 복원
        if (detail.conversation?.length) {
          chat.restore(detail.conversation);
        }
        chat.notify(
          "저장된 계획을 불러왔습니다. 이어서 수정 요청을 적어주세요.\n예: “2일차는 좀 여유롭게 해줘”",
        );
      })
      .catch((e) => {
        // 실제 원인을 문구에 포함 — "왜" 실패했는지 사용자가 알 수 있게
        console.error("계획 불러오기 실패:", e);
        chat.notify(`계획을 불러오지 못했습니다. (${getApiErrorMessage(e)})`);
      })
      .finally(() => {
        // 주소를 "/"로 정리 - 이후 새 계획을 만들 때 옛 plan 파라미터가 남지 않게
        setSearchParams({}, { replace: true });
      });
    // ⭐ StrictMode 대응: 개발 모드는 effect를 실행→정리→재실행한다.
    // 정리 때 usePlan의 cancelled 플래그가 켜져 1차 응답이 버려지므로,
    // 가드도 함께 풀어서 2차 실행이 처음부터 다시 불러오게 한다.
    // (이게 없으면 로컬에서만 "아무 일도 안 일어나는" 유령 실패가 남 —
    //  실서비스 빌드는 effect가 1번만 돌아서 애초에 문제없음)
    return () => {
      loadedPlanRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** 수정 완료(버전 증가) 시 계획서를 맨 위로 스크롤 — 바뀐 내용의 시작부터 보이게 */
  const sheetRef = useRef<HTMLDivElement>(null);
  const prevVersionRef = useRef(version);
  useEffect(() => {
    if (version > prevVersionRef.current) {
      sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevVersionRef.current = version;
  }, [version]);

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

  /**
   * "계획 새로 짜기": 챗과 오른쪽 화면을 초기 상태로.
   * 짜던 계획은 이미 draft로 저장돼 있어 마이페이지 목록에 그대로 남는다.
   */
  const handleRestart = () => {
    chat.reset();
    resetPlan();
    notifiedStatusRef.current = null;   // 다음 계획의 완료 안내가 다시 뜨도록
    restoredPlanRef.current = null;     // 다음 불러오기의 대화 복원이 다시 되도록
    chat.notify("새 계획을 시작합니다. 이전 계획은 마이페이지에 저장되어 있어요.");
  };

  /** 후보 비교에서 항공/숙소 교체 — 성공 요약은 챗으로, 실패는 다시 던져 모달 유지 */
  const handleSelectCandidate = async (kind: "flight" | "hotel", index: number) => {
    try {
      const summary = await selectCandidate(kind, index);
      if (summary) chat.notify(summary);
    } catch (e) {
      chat.notify(`후보를 변경하지 못했습니다. (${getApiErrorMessage(e)})`);
      throw e; // PlanSheet가 모달을 닫지 않고 다시 고를 수 있게
    }
  };

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
          backgroundImage: "url('/ex9.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 67%",
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
            // 초기 화면에서는 다시 짤 것이 없으므로 버튼 숨김
            onRestart={status !== "idle" ? handleRestart : undefined}
            // 생성 중(building)·수정 중(editing)에는 새로 짜기 버튼과 입력창을 모두 잠근다
            restartDisabled={status === "building" || editing}
            inputDisabled={status === "building" || editing}
            busyEditing={editing}
          />

          <div
            ref={sheetRef}
            className="min-h-[620px] scroll-mt-20 overflow-hidden rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04),0_18px_40px_-28px_rgba(15,20,24,.3)]"
          >
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

            {status === "building" && <PlanProgress current={step} progress={progress} />}

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
                onRestart={handleRestart}
                onSelectCandidate={handleSelectCandidate}
              />
            )}
          </div>
        </section>

        <IntroCards />
      </div>
    </div>
  );
}