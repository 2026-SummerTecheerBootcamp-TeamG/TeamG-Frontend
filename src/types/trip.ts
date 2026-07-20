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

/** 백엔드 trace 이벤트 한 건 (진행 상황 실시간 표시의 원천 데이터) */
export interface TraceEvent {
  t: number;                // 발생 시각 (unix)
  kind: string;             // user/agent/api/llm/data/db/rule/done
  actor: string;            // 누가 (claude, google, budget, orchestrator…)
  action: string;           // 무엇을 (예: "예산 배분 완료")
  detail?: string;
}

export interface RunDetailResponse {
  run_id: string;
  status: "running" | "completed" | "failed";
  events: TraceEvent[];
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
  /** 왕복 노선 "ICN → FUK" (요청의 출발/도착 공항 코드) */
  route?: string | null;
  /** "YYYY-MM-DD HH:MM" (SerpApi 원본 형식, 가는 편 기준) */
  departure_time: string | null;
  arrival_time: string | null;
  duration_min: number | null;
  stops: number | null;
}

export interface PlanHotel {
  liteapi_hotel_id: string;
  name: string;
  price_krw: number;
  utility: number | null;
  /** 만족도 근거 목록 (성급/테마 가점 등) — 상세 정보 펼침용 */
  utility_reasons?: string[] | null;
  booking_url: string | null;
  stars: number | null;
  latitude: number | null;
  longitude: number | null;
  /** LiteAPI 스냅샷에 있으면 내려옴 (없으면 null) */
  address?: string | null;
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
  /** hotel(숙소, LiteAPI 샌드박스) / flight(항공, 자체 mock 발권). 구응답 호환 위해 optional */
  kind?: "hotel" | "flight";
  status: "confirmed" | "failed";
  booking_id: string | null;
  confirmation: string | null;
  guest_name: string;
  created_at: string;
}

/** 결제 완료 건 (payments/confirm 승인 결과). 결제한 적 없으면 null */
export interface PlanPayment {
  status: "DONE";
  amount: number;
  method: string;
  order_name: string;
  approved_at: string;
}

export interface PlanDetail {
  plan_id: number;
  request_id: number;
  status: "processing" | "draft" | "confirmed";
  /** 여행 시작/종료일 — days 배열은 귀국일이 빠져 있어 길이로 기간을 셀 수 없다 (Bug#96) */
  start_date: string;
  end_date: string;
  allocation: Allocation | null;
  narrative: string | null;
  flight: PlanFlight | null;
  hotel: PlanHotel | null;
  days: PlanDay[];
  /** 숙소 결제 완료 건 (없으면 null) */
  payment: PlanPayment | null;
  /** 항공 결제 완료 건 (없으면 null) — 결제 승인 시 mock 발권으로 이어짐 */
  flight_payment?: PlanPayment | null;
  /** 저장 스냅샷으로 재구성한 대화 이력 (마이페이지에서 다시 열 때 챗 복원용) */
  conversation?: { role: "user" | "bot"; text: string }[];
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
