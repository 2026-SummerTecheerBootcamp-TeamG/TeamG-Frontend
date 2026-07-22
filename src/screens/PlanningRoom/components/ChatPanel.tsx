import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ChatMessage } from "@/types/trip";
import { useSmoothProgress } from "./PlanProgress";

const EXAMPLES = [
  "후쿠오카, 9/12~9/14, 2명, 100만원",
  "오사카, 2월 3일~2월 6일, 성인 2명, 130만원으로",
  "10/3부터 5일간 다낭, 4명, 예산 350만",
];

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
  /** 슬롯이 다 차면 예시 문장을 감춘다 */
  hideExamples: boolean;
  onSend: (text: string) => void;
  /** "계획 새로 짜기" — 계획이 그려진 뒤에만 부모가 넘겨준다 (없으면 버튼 미표시) */
  onRestart?: () => void;
  /** 생성/수정이 돌아가는 중 — 새로 짜기 버튼 잠금 (실행 중 초기화로 인한 꼬임 예방) */
  restartDisabled?: boolean;
  /** 생성/수정이 돌아가는 중 — 입력창도 잠근다 (실행 중 새 요청이 겹치는 것 방지, 피드백) */
  inputDisabled?: boolean;
  /** 대화형 수정이 백그라운드에서 진행 중 — 입력창 위 미니 진행 바 표시 */
  busyEditing?: boolean;
}

/** 수정 진행 미니 바 — 계획 생성 바와 같은 rAF 스무딩(useSmoothProgress)을 재사용.
    목표 70: 90으로 하면 초반에 확 차오르고 끝에서 오래 멈춰 보였다(피드백) —
    낮은 목표에 빨리 닿은 뒤 크리프(초당 1.2%)가 수정이 끝날 때까지 계속
    전진하는 그림이 실제 소요 시간과 더 잘 맞는다. 회전 스피너가 "지금도
    돌아가는 중"을 항상 보여줘 바가 느려져도 멈춘 걸로 오해하지 않게 한다 */
function EditProgressBar() {
  const v = useSmoothProgress(70);
  return (
    <div className="px-[18px] pb-2">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-ink-3">
        {/* 돌아가며 잔상을 남기는 원 (피드백) — 위쪽만 진한 테두리가 회전 */}
        <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-cobalt/25 border-t-cobalt" />
        계획을 수정하는 중...
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-line-soft">
        <span
          className="block h-full rounded-full bg-cobalt"
          style={{ width: `${Math.max(4, v)}%` }} // 시작부터 살짝 차 있어야 "돌고 있다"가 보임
        />
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  isTyping,
  hideExamples,
  onSend,
  onRestart,
  restartDisabled,
  inputDisabled,
  busyEditing,
}: Props) {
  const [value, setValue] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /** 새 메시지가 오면 아래로 스크롤 */
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, isTyping]);

  const submit = () => {
    const text = value.trim();
    if (!text || isTyping || inputDisabled) return;
    onSend(text);
    setValue("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ fontFamily: "Pretendard, sans-serif" }} className="flex h-[620px] flex-col overflow-hidden rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04),0_18px_40px_-28px_rgba(15,20,24,.3)] lg:sticky lg:top-[88px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-line-soft px-[18px] py-3.5">
        <p className="text-sm font-bold tracking-[-0.02em]">
          계획 만들기{" "}
          <span className="font-medium text-ink-3">· 문장으로 적어주세요</span>
        </p>
        {onRestart && (
          // 생성/수정 실행 중에는 잠금 — 도는 중에 초기화하면 폴링 결과가
          // 초기화된 화면 위로 덮이는 등 꼬일 수 있어 미리 막는다 (피드백)
          <button
            onClick={onRestart}
            disabled={restartDisabled}
            className="whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#2a3138] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-ink"
          >
            계획 새로 짜기
          </button>
        )}
      </div>

      {/* 대화 */}
      <div
        ref={logRef}
        className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-[18px] py-5"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[88%] ${m.role === "user" ? "self-end" : "self-start"}`}
          >
            <div
              className={`whitespace-pre-wrap break-keep rounded-2xl px-3.5 py-2.5 text-[14.5px] ${
                m.role === "user"
                  ? "rounded-br-[5px] bg-ink text-white"
                  : "rounded-bl-[5px] border border-line-soft bg-[#f4f6f8]"
              }`}
            >
              {m.text}
            </div>

            {/* 파싱된 슬롯 칩 */}
            {m.slots && m.slots.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {m.slots.map((s) => (
                  <span
                    key={s.label}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                      s.missing
                        ? "bg-[#fef0ee] text-stamp"
                        : "bg-cobalt-soft text-cobalt"
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-[5px] bg-[#f4f6f8] px-3.5 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#b7bfc7]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 수정 진행 중 미니 바 (대화형 수정이 백그라운드에서 도는 동안) */}
      {busyEditing && <EditProgressBar />}

      {/* 입력 */}
      <div className="border-t border-line-soft p-3">
        <div className="flex items-end gap-2 rounded-field border-[1.5px] border-line bg-white py-2 pl-3.5 pr-2 transition-colors focus-within:border-ink">
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            disabled={inputDisabled}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
            }}
            onKeyDown={handleKeyDown}
            // 실행 중에는 입력 불가를 placeholder로도 알려준다
            placeholder={
              inputDisabled
                ? "계획을 만드는 중에는 입력할 수 없어요"
                : "예: 후쿠오카, 9/12~9/14, 2명, 100만원"
            }
            className="max-h-24 flex-1 resize-none bg-transparent py-1 text-[14.5px] outline-none placeholder:text-[#aeb6be] disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={isTyping || inputDisabled || !value.trim()}
            aria-label="보내기"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-ink text-white transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 13.5V2.5M8 2.5L3.5 7M8 2.5L12.5 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* 예시 문장: 클릭하면 입력창에 채워지기만 한다 (바로 보내지 않음) */}
        {!hideExamples && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] tracking-[0.08em] text-ink-3">
              이렇게
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setValue(ex);
                  inputRef.current?.focus();
                }}
                className="rounded-lg border border-dashed border-line px-2 py-1 text-[12.5px] text-ink-2 transition-colors hover:border-ink-3 hover:bg-[#fafbfc] hover:text-ink"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}