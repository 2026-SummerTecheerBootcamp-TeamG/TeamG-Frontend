import { api } from "@/lib/api";
import type {
  ParseResult,
  ParsedFields,
  RunCreateResponse,
  RunDetailResponse,
  PlanDetail,
  PlanEditResponse,
  TripSummary,
} from "@/types/trip";

/** GET /api/v1/trips/ - 내 여행 요청/플랜 목록 (trips 앱 루트라 trailing slash 필요) */
export const listTrips = () =>
  api.get<{ trips: TripSummary[] }>("/trips/").then((res) => res.data.trips);

/** POST /api/v1/agents/parse - 자연어 → 구조화 슬롯 */
export const parseMessage = (message: string) =>
  api.post<ParseResult>("/agents/parse", { message }).then((res) => res.data);

/** POST /api/v1/agents/parse/answer - 재질문 답변 병합 재파싱. session_id는 이전 응답의 parse_id */
export const parseAnswer = (session_id: string, answer: string) =>
  api
    .post<ParseResult>("/agents/parse/answer", { session_id, answer })
    .then((res) => res.data);

interface ParseConfirmResponse {
  parse_id: string;
  status: "confirmed";
  fields: ParsedFields;
}

/** POST /api/v1/agents/parse/{parse_id}/confirm - 파이프라인 실행 게이트 */
export const confirmParse = (parseId: string) =>
  api
    .post<ParseConfirmResponse>(`/agents/parse/${parseId}/confirm`)
    .then((res) => res.data);

/** POST /api/v1/agents/runs - 확정된 parse_id로 풀 파이프라인 실행 접수 */
export const createRun = (parseId: string) =>
  api
    .post<RunCreateResponse>("/agents/runs", { parse_id: parseId })
    .then((res) => res.data);

/** GET /api/v1/agents/runs/{run_id} - 실행 상태/결과 폴링 */
export const getRun = (runId: string) =>
  api.get<RunDetailResponse>(`/agents/runs/${runId}`).then((res) => res.data);

/** POST /api/v1/trips/plans/{plan_id}/ticket - 항공 발권 접수 (자체 mock 공급자) */
export const ticketFlight = (planId: number) =>
  api
    .post<{ run_id: string; task_id: string; status: "accepted" }>(
      `/trips/plans/${planId}/ticket`,
      {},
    )
    .then((res) => res.data);

/** GET /api/v1/trips/plans/{plan_id} - 저장된 플랜 스냅샷 */
export const getPlan = (planId: number) =>
  api.get<PlanDetail>(`/trips/plans/${planId}`).then((res) => res.data);

interface PlanConfirmResponse {
  plan_id: number;
  status: "confirmed";
}

/** POST /api/v1/trips/plans/{plan_id}/confirm - draft -> confirmed */
export const confirmPlan = (planId: number) =>
  api
    .post<PlanConfirmResponse>(`/trips/plans/${planId}/confirm`)
    .then((res) => res.data);

/** POST /api/v1/trips/plans/{plan_id}/edits - 자연어 수정 요청 접수 */
export const editPlan = (planId: number, message: string) =>
  api
    .post<PlanEditResponse>(`/trips/plans/${planId}/edits`, { message })
    .then((res) => res.data);
