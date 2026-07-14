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

interface Options {
  /** 슬롯이 다 찼을 때 (계획 생성) */
  onReady: (req: TripRequest) => void;
  /** 계획이 이미 있을 때 들어온 수정 요청 */
  onEdit: (
    req: TripRequest,
    text: string,
  ) => { request: TripRequest; note: string };
  /** 계획이 이미 그려져 있는지 */
  hasPlan: boolean;
}

/** 챗 대화와 요청 슬롯을 관리한다 */
export function useChat({ onReady, onEdit, hasPlan }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greet", role: "bot", text: GREETING },
  ]);
  const [request, setRequest] = useState<TripRequest>(EMPTY_REQUEST);
  const [isTyping, setIsTyping] = useState(false);
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
      await new Promise((r) => setTimeout(r, 700));

      // 계획이 이미 있으면 수정 요청으로 본다
      if (hasPlan) {
        const merged = mergeRequest(request, text);
        const { request: edited, note } = onEdit(merged, text);
        setRequest(edited);
        push({ role: "bot", text: `${note} 계획서를 갱신했습니다.` });
        setIsTyping(false);
        return;
      }

      // TODO: POST /api/v1/agent/parse (재질문이면 /parse/answer) 로 교체
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
        onReady(next);
      }

      setIsTyping(false);
    },
    [hasPlan, isTyping, onEdit, onReady, push, request],
  );

  /** 계획서 쪽에서 알려주는 안내 (확정 완료 등) */
  const notify = useCallback(
    (text: string) => push({ role: "bot", text }),
    [push],
  );

  const reset = useCallback(() => {
    idRef.current = 0;
    setMessages([{ id: "greet", role: "bot", text: GREETING }]);
    setRequest(EMPTY_REQUEST);
    setIsReady(false);
    setIsTyping(false);
  }, []);

  return { messages, request, isTyping, isReady, send, notify, reset };
}