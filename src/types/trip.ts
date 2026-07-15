/** 챗 말풍선 */
export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  slots?: { label: string; missing?: boolean }[];
}

/* ───────── 파싱 (POST /api/v1/agents/parse, /agents/parse/answer) ───────── */

export interface ParsedOrigin {
  city: string | null;
  iata: string | null;
}

export interface ParsedDestination {
  city: string;
  city_en?: string | null;
  country_code?: string | null;
  iata?: string | null;
  nights?: number | null;
}

export interface ParsedPax {
  adult: number;
  child: number;
}

export interface ParsedDates {
  start: string | null; // "YYYY-MM-DD"
  end: string | null;
}

export interface ParsedFields {
  origin: ParsedOrigin | null;
  destinations: ParsedDestination[];
  budget: number | null;
  pax: ParsedPax;
  themes: string[];
  dates: ParsedDates;
}

/** 파이프라인 게이트 대상 슬롯만 (agents/parser/slot_validator.py REQUIRED_SLOTS) */
export type MissingSlot = "destinations" | "budget" | "dates" | "pax";

/** POST /agents/parse, /agents/parse/answer 응답 (슬롯 완전/부족 두 형태를 합침) */
export interface ParseResult {
  parse_id: string;
  fields: ParsedFields;
  missing_slots: MissingSlot[];
  reask_message?: string;
  assumed_fields?: string[];
  filled_from_profile?: string[];
  warnings?: string[];
}

/* ───────── 실행 (POST /api/v1/agents/runs, GET /agents/runs/{id}) ───────── */

export interface RunCreateResponse {
  run_id: string;
  task_id: string;
  plan_id: number | null;
  status: "accepted";
}

export interface LocalEditResult {
  run_id: string;
  old_plan_id: number;
  new_plan_id: number;
  summary: string;
  dropped_names: string[];
}

export interface RunDetailResponse {
  run_id: string;
  status: "running" | "completed" | "failed";
  events: unknown[];
  result: LocalEditResult | Record<string, unknown> | null;
}

/* ───────── 예산 배분 (agents/budget.py allocate_budget) ───────── */

export interface AllocationBreakdown {
  flight_krw: number;
  hotel_krw: number;
  activity_krw: number;
}

export interface AllocationFit {
  status: "fit";
  total_budget: number;
  reserve: number;
  spendable: number;
  breakdown: AllocationBreakdown;
  total_cost: number;
  surplus: number;
  utility_total: number;
}

export interface AllocationInsufficient {
  status: "insufficient";
  total_budget: number;
  reserve: number;
  spendable: number;
  breakdown: AllocationBreakdown;
  total_cost: number;
  shortfall: number;
}

export interface AllocationNoCandidates {
  status: "no_flights" | "no_hotels";
  message: string;
}

export type Allocation = AllocationFit | AllocationInsufficient | AllocationNoCandidates;

/* ───────── 계획 상세 (GET /api/v1/trips/plans/{plan_id}) ───────── */

export interface PlanFlight {
  airline: string;
  price_krw: number;
  utility: number | null;
  booking_url: string | null;
}

export interface PlanHotel {
  liteapi_hotel_id: string;
  name: string;
  price_krw: number;
  utility: number | null;
  booking_url: string | null;
}

/** 구글 장소 enrichment 결과 - 형태가 느슨해서 필드 존재를 방어적으로 확인해야 함 */
export interface PlaceDetail {
  rating?: number;
  user_ratings?: number;
  address?: string;
  [key: string]: unknown;
}

export interface PlanItem {
  visit_order: number;
  place_name: string;
  latitude: number | null;
  longitude: number | null;
  place_detail: PlaceDetail | null;
  travel_min_to_next: number | null;
  travel_mode: string | null;
}

export interface PlanDay {
  day_number: number;
  city_name: string | null;
  date: string; // "YYYY-MM-DD"
  items: PlanItem[];
}

export interface PlanBooking {
  status: "confirmed" | "failed";
  booking_id: string | null;
  confirmation: string | null;
  guest_name: string;
  created_at: string;
}

export interface PlanDetail {
  plan_id: number;
  request_id: number;
  status: "processing" | "draft" | "confirmed";
  allocation: Allocation | null;
  narrative: string | null;
  flight: PlanFlight | null;
  hotel: PlanHotel | null;
  days: PlanDay[];
  bookings: PlanBooking[];
  created_at: string;
}

/* ───────── 여행 목록 (GET /api/v1/trips/) ───────── */

export interface TripSummary {
  request_id: number;
  departure: string;
  destinations: string[];
  start_date: string;
  end_date: string;
  total_budget: number;
  plan_id: number | null;
  status: "processing" | "draft" | "confirmed" | null;
  created_at: string;
}

/* ───────── 대화형 수정 (POST /api/v1/trips/plans/{plan_id}/edits) ───────── */

export interface PlanEditAccepted {
  category: string;
  reason: string;
  run_id: string;
  task_id: string;
  /** 재계획(category === "재계획")일 때만 즉시 내려옴 */
  plan_id?: number;
  status: "accepted";
}

export interface PlanEditUnsupported {
  category?: string;
  /** 백엔드 오탈자 케이스 (agents/edit_router가 "국소수정"이 아닌 값을 반환할 때) */
  caategory?: string;
  reason: string;
  supported: false;
  message: string;
}

export type PlanEditResponse = PlanEditAccepted | PlanEditUnsupported;

/** 화면 상태 (usePlan) */
export type PlanStatus = "idle" | "building" | "ready" | "confirmed" | "error";
