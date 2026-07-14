import type { MissingSlot, TripRequest } from "@/types/trip";

/**
 * 자연어 파싱 (임시)
 * API(POST /api/v1/agent/parse) 연동 전까지 프론트에서 흉내 낸다.
 * 연동 후에는 이 파일 대신 서버 응답의 fields / missing_slots 를 쓴다.
 */

const YEAR = new Date().getFullYear();

/** 지원 도시 (별칭 → 정식 이름) */
const CITY_ALIAS: Record<string, string> = {
  후쿠오카: "후쿠오카",
  오사카: "오사카",
  도쿄: "도쿄",
  동경: "도쿄",
  다낭: "다낭",
  방콕: "방콕",
  타이베이: "타이베이",
  타이페이: "타이베이",
};

export function parseCity(text: string): string | null {
  const hit = Object.keys(CITY_ALIAS).find((k) => text.includes(k));
  return hit ? CITY_ALIAS[hit] : null;
}

export function parsePax(text: string): number | null {
  const m = text.match(/(\d+)\s*(명|인|사람)/);
  if (m) return Number(m[1]);
  if (/혼자/.test(text)) return 1;
  if (/커플|둘이/.test(text)) return 2;
  return null;
}

export function parseBudget(text: string): number | null {
  const man = text.match(/(\d+(?:\.\d+)?)\s*만원?/);
  if (man) return Math.round(parseFloat(man[1]) * 10_000);

  const won = text.replace(/,/g, "").match(/(\d{5,})\s*원?/);
  if (won) return Number(won[1]);

  return null;
}

export function parseDates(text: string): { start: Date; end: Date } | null {
  const s = text.replace(/\s/g, "");

  // 9/12~9/14, 9월12일~14일
  const range = s.match(
    /(\d{1,2})[/월.](\d{1,2})일?[~\-–]+(?:(\d{1,2})[/월.])?(\d{1,2})일?/,
  );
  if (range) {
    const startMonth = Number(range[1]);
    const endMonth = range[3] ? Number(range[3]) : startMonth;
    return {
      start: new Date(YEAR, startMonth - 1, Number(range[2])),
      end: new Date(YEAR, endMonth - 1, Number(range[4])),
    };
  }

  // 10/3부터 5일간
  const span = s.match(/(\d{1,2})[/월.](\d{1,2})일?부터(\d+)일간?/);
  if (span) {
    const start = new Date(YEAR, Number(span[1]) - 1, Number(span[2]));
    const end = new Date(start);
    end.setDate(end.getDate() + Number(span[3]) - 1);
    return { start, end };
  }

  return null;
}

/** 문장에서 뽑아낸 값을 기존 요청에 덮어쓴다 */
export function mergeRequest(prev: TripRequest, text: string): TripRequest {
  const next = { ...prev };

  const city = parseCity(text);
  if (city) next.city = city;

  const dates = parseDates(text);
  if (dates) {
    next.start = dates.start;
    next.end = dates.end;
  }

  const pax = parsePax(text);
  if (pax) next.pax = pax;

  const budget = parseBudget(text);
  if (budget) next.budget = budget;

  return next;
}

/** 아직 안 채워진 슬롯 */
export function getMissingSlots(req: TripRequest): MissingSlot[] {
  const missing: MissingSlot[] = [];
  if (!req.city) missing.push("목적지");
  if (!req.start) missing.push("날짜");
  if (!req.pax) missing.push("인원");
  if (!req.budget) missing.push("예산");
  return missing;
}

/* ─── 표시용 포맷 ─── */

export const formatWon = (n: number) => n.toLocaleString("ko-KR");

export const formatDate = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

/** 몇 박인지 */
export const getNights = (req: TripRequest) => {
  if (!req.start || !req.end) return 0;
  const diff = (req.end.getTime() - req.start.getTime()) / 86_400_000;
  return Math.max(1, Math.round(diff));
};

/** 채워진 슬롯을 칩 문구로 */
export function toSlotChips(req: TripRequest) {
  const nights = getNights(req);
  const chips: { label: string; missing?: boolean }[] = [];

  if (req.city) {
    chips.push({
      label: req.start ? `${req.city} ${nights}박 ${nights + 1}일` : req.city,
    });
  }
  if (req.start && req.end) {
    chips.push({ label: `${formatDate(req.start)}~${formatDate(req.end)}` });
  }
  if (req.pax) chips.push({ label: `${req.pax}인` });
  if (req.budget) chips.push({ label: `${formatWon(req.budget)}원` });

  getMissingSlots(req).forEach((slot) =>
    chips.push({ label: `${slot} 필요`, missing: true }),
  );

  return chips;
}

/** 재질문에 붙일 예시 문장 */
export function buildExample(missing: MissingSlot[]) {
  const sample: Record<MissingSlot, string> = {
    목적지: "후쿠오카로",
    날짜: "9/12~9/14",
    인원: "2명",
    예산: "100만원",
  };
  return `${missing.map((m) => sample[m]).join(", ")} 갈게요`;
}