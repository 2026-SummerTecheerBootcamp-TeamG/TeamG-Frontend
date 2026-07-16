import type { MissingSlot, ParsedFields } from "@/types/trip";

export const formatWon = (n: number) => n.toLocaleString("ko-KR");

/** ISO 날짜 문자열("YYYY-MM-DD")을 "MM/DD"로 */
export const formatDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

/** 시작~종료 날짜로 몇 박인지 (없으면 null) */
export function getNightsFromDates(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000;
  return Math.max(1, Math.round(diff));
}

/** 슬롯이 다 찼을 때 확인 문장 */
export function summarizeFields(fields: ParsedFields): string {
  const cities = fields.destinations.map((d) => d.city).join(", ") || "목적지 미정";
  const nights = getNightsFromDates(fields.dates.start, fields.dates.end);
  const pax = fields.pax.adult + fields.pax.child;

  const parts = [cities];
  if (nights !== null && fields.dates.start && fields.dates.end) {
    parts.push(
      `${nights}박 ${nights + 1}일 (${formatDateStr(fields.dates.start)}~${formatDateStr(fields.dates.end)})`,
    );
  }
  if (pax) parts.push(`${pax}명`);
  if (fields.budget) parts.push(`예산 ${formatWon(fields.budget)}원`);

  return `${parts.join(", ")}(으)로 계획을 짭니다.`;
}

const MISSING_LABEL: Record<MissingSlot, string> = {
  destinations: "목적지",
  budget: "예산",
  dates: "날짜",
  pax: "인원",
};

/** 파싱된 필드를 슬롯 칩으로 (채워진 것 + 누락된 것) */
export function fieldsToChips(fields: ParsedFields, missing: MissingSlot[]) {
  const chips: { label: string; missing?: boolean }[] = [];
  const nights = getNightsFromDates(fields.dates.start, fields.dates.end);

  if (fields.destinations.length > 0) {
    chips.push({ label: fields.destinations.map((d) => d.city).join(", ") });
  }
  if (fields.dates.start && fields.dates.end) {
    chips.push({
      label:
        nights !== null
          ? `${nights}박 ${nights + 1}일`
          : `${formatDateStr(fields.dates.start)}~${formatDateStr(fields.dates.end)}`,
    });
  }
  const pax = fields.pax.adult + fields.pax.child;
  if (pax) chips.push({ label: `${pax}인` });
  if (fields.budget) chips.push({ label: `${formatWon(fields.budget)}원` });

  missing.forEach((slot) => chips.push({ label: `${MISSING_LABEL[slot]} 필요`, missing: true }));

  return chips;
}
