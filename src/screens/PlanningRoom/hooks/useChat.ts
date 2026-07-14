import { useCallback, useRef, useState } from "react";
import type { ChatMessage, TripRequest } from "@/types/trip";
import {
  buildExample,
  formatDate,
  formatWon,
  getMissingSlots,
  getNights,
  mergeRequest,
  toSlotChips,
} from "../lib/parseRequest";

const EMPTY_REQUEST: TripRequest = {
  city: null,
  start: null,
  end: null,
  pax: null,
  budget: null,
};

const GREETING =
  "가는 날짜, 인원, 목적지, 예산을 한 문장으로 적어주세요.\n예: “후쿠오카, 9/12~9/14, 2명, 100만원”";

/** 챗 대화와 요청 슬롯을 관리한다 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greet", role: "bot", text: GREETING },
  ]);
  const [request, setRequest] = useState<TripRequest>(EMPTY_REQUEST);
  const [isTyping, setIsTyping] = useState(false);
  /** 슬롯이 모두 채워졌는지 (계획 생성 단계로 넘어갈 조건) */
  const [isReady, setIsReady] = useState(false);

  const idRef = useRef(0);
  const nextId = () => `m${++idRef.current}`;

  const push = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (isTyping) return;

      push({ role: "user", text });
      setIsTyping(true);

      // TODO: POST /api/v1/agent/parse (또는 재질문이면 /parse/answer) 로 교체
      await new Promise((r) => setTimeout(r, 700));

      const next = mergeRequest(request, text);
      setRequest(next);

      const missing = getMissingSlots(next);
      const chips = toSlotChips(next);

      if (missing.length > 0) {
        push({
          role: "bot",
          text: `${missing.join("과 ")}만 더 알려주세요. 문장으로 적어주셔도 됩니다.\n예: “${buildExample(missing)}”`,
          slots: chips,
        });
      } else {
        const nights = getNights(next);
        push({
          role: "bot",
          text: `${next.city} ${nights}박 ${nights + 1}일, ${formatDate(next.start!)}~${formatDate(next.end!)}, ${next.pax}명, 예산 ${formatWon(next.budget!)}원으로 계획을 짭니다.`,
          slots: chips,
        });
        setIsReady(true);
      }

      setIsTyping(false);
    },
    [isTyping, push, request],
  );

  const reset = useCallback(() => {
    idRef.current = 0;
    setMessages([{ id: "greet", role: "bot", text: GREETING }]);
    setRequest(EMPTY_REQUEST);
    setIsReady(false);
    setIsTyping(false);
  }, []);

  return { messages, request, isTyping, isReady, send, reset };
}