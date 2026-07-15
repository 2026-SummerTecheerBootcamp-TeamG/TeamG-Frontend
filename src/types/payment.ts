/** POST /api/v1/payments/prepare/ 응답 - client_key는 공개용 키라 노출돼도 안전함 */
export interface PaymentPrepareResponse {
  order_id: string;
  order_name: string;
  amount: number;
  client_key: string;
}

/** POST /api/v1/payments/confirm/ 응답 - 성공 시 예약(run_booking)이 자동 접수된다 */
export interface PaymentConfirmResponse {
  status: "DONE";
  run_id: string | null;
  task_id?: string;
  already_confirmed?: boolean;
}

/** agents/tasks.py::run_booking 의 반환값 (agents/runs/{id} 의 result) */
export interface BookingResult {
  run_id: string;
  booking_status: "confirmed" | "failed";
  booking_id: string | null;
  confirmation: string | null;
  summary: string;
}
