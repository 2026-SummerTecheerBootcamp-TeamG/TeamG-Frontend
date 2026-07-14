/** 자연어 파싱으로 채워지는 요청 슬롯 (POST /api/v1/agent/parse 의 fields) */
export interface TripRequest {
  city: string | null;
  start: Date | null;
  end: Date | null;
  pax: number | null;
  budget: number | null;
}

/** 아직 채워지지 않은 슬롯 이름 (missing_slots) */
export type MissingSlot = "목적지" | "날짜" | "인원" | "예산";

/** 챗 말풍선 */
export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  slots?: { label: string; missing?: boolean }[];
}

/* ───────── 계획서 ───────── */

/** 항공 (plan.flight) */
export interface Flight {
  airline: string;
  /** 1인 왕복가 */
  price: number;
  /** 편도 소요 시간 */
  duration: string;
  stops: number;
  /** 가는 편 [출발시각, 도착시각] */
  outbound: [string, string];
  /** 오는 편 [출발시각, 도착시각] */
  inbound: [string, string];
}

/** 숙소 (plan.hotel) */
export interface Hotel {
  name: string;
  /** 성급 */
  stars: number;
  /** 위치 설명 */
  area: string;
  /** 1박 요금 */
  pricePerNight: number;
  lat: number;
  lng: number;
}

/** 일정의 한 장소 (days[].items[]) */
export interface PlanItem {
  /** 도착 시각 */
  arriveAt: string;
  placeName: string;
  description: string;
  /** 머무는 시간(분) */
  stayMinutes: number;
  /** 이 장소까지의 이동 */
  transit: string;
  /** 1인 비용 (0이면 무료) */
  cost: number;
  /** 식사 여부 */
  isMeal?: boolean;
  lat: number;
  lng: number;
}

/** 하루 */
export interface PlanDay {
  date: Date;
  items: PlanItem[];
  /** '도착 후' / '출발 전' 같은 메모 */
  note?: string;
}

/** 예산 정산 (allocation) */
export interface Allocation {
  flight: number;
  hotel: number;
  activity: number;
  total: number;
  /** 남은 금액 (음수면 초과) */
  remaining: number;
}

/** 확정된 계획 한 벌 */
export interface Plan {
  city: string;
  country: string;
  iata: string;
  /** 몇 박 */
  nights: number;
  pax: number;
  flight: Flight;
  hotel: Hotel;
  days: PlanDay[];
  allocation: Allocation;
  /** 예산에 맞추려고 숙소 등급을 낮췄는지 */
  downgraded: boolean;
}

/** 계획서 진행 상태 */
export type PlanStatus = "idle" | "building" | "ready" | "confirmed";