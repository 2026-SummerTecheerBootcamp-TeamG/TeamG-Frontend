import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ParsedFields } from "@/types/trip";
import { parseAnswer, parseMessage } from "@/api/trips";
import { getApiErrorMessage } from "@/lib/api";
import { fieldsToChips, summarizeFields } from "../lib/parseRequest";

const GREETING =
  "가는 날짜, 인원, 목적지, 예산을 한 문장으로 적어주세요.\n예: “후쿠오카, 9/12~9/14, 2명, 100만원”";

interface Options {
  /** 슬롯이 다 찼을 때 (계획 생성) - 확정된 parse_id와 필드를 넘긴다 */
  onReady: (parseId: string, fields: ParsedFields) => void;
  /** 계획이 이미 있을 때 들어온 수정 요청 */
  onEdit: (text: string) => Promise<{ note: string }>;
  /** 계획이 이미 그려져 있는지 */
  hasPlan: boolean;
}

/** 챗 대화와 서버 파싱 세션을 관리한다 */
export function useChat({ onReady, onEdit, hasPlan }: Options) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greet", role: "bot", text: GREETING },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isReady, setIsReady] = useState(false);

  /** 재질문 대기 중인 parse_id (없으면 새 파싱) */
  const pendingParseIdRef = useRef<string | null>(null);

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

      try {
        if (hasPlan) {
          const { note } = await onEdit(text);
          push({ role: "bot", text: note });
          return;
        }

        const result = pendingParseIdRef.current
          ? await parseAnswer(pendingParseIdRef.current, text)
          : await parseMessage(text);

        // missing_slots는 완전한 응답에도 참고용으로 남아있을 수 있다.
        // 실제 게이트 통과 여부는 reask_message 존재로만 판단한다 (destinations/budget만 필수).
        if (result.reask_message) {
          pendingParseIdRef.current = result.parse_id;
          push({
            role: "bot",
            text: result.reask_message,
            slots: fieldsToChips(result.fields, result.missing_slots),
          });
          return;
        }

        pendingParseIdRef.current = null;
        push({ role: "bot", text: summarizeFields(result.fields), slots: fieldsToChips(result.fields, []) });
        setIsReady(true);
        onReady(result.parse_id, result.fields);
      } catch (e) {
        push({ role: "bot", text: getApiErrorMessage(e) });
      } finally {
        setIsTyping(false);
      }
    },
    [hasPlan, isTyping, onEdit, onReady, push],
  );

  /** 계획서 쪽에서 알려주는 안내 (완료/확정/실패 등) */
  const notify = useCallback(
    (text: string) => push({ role: "bot", text }),
    [push],
  );

  /** 저장된 대화 이력으로 챗을 통째로 복원 (마이페이지에서 계획을 다시 열 때) */
  const restore = useCallback(
    (history: { role: "user" | "bot"; text: string }[]) => {
      idRef.current = 0;
      setMessages(history.map((m) => ({ ...m, id: `r${++idRef.current}` })));
      setIsReady(true);   // 복원 = 이미 계획이 있는 상태이므로 예시 문장은 숨김
    },
    [],
  );

  const reset = useCallback(() => {
    idRef.current = 0;
    pendingParseIdRef.current = null;
    setMessages([{ id: "greet", role: "bot", text: GREETING }]);
    setIsReady(false);
    setIsTyping(false);
  }, []);

  return { messages, isTyping, isReady, send, notify, restore, reset };
}
