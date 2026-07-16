import { api } from "@/lib/api";
import type { PaymentConfirmResponse, PaymentPrepareResponse } from "@/types/payment";

/** POST /api/v1/payments/prepare/ - 서버가 플랜에서 금액을 계산해 주문을 만든다
    target: hotel(숙소 예약, 기본) / flight(항공 발권 — 결제 승인 시 mock 발권으로 이어짐) */
export const preparePayment = (planId: number, target: "hotel" | "flight" = "hotel") =>
  api
    .post<PaymentPrepareResponse>("/payments/prepare/", { plan_id: planId, target })
    .then((res) => res.data);

/** POST /api/v1/payments/confirm/ - 토스 결제창 완료 후 최종 승인 + 예약 자동 접수 */
export const confirmPayment = (paymentKey: string, orderId: string, amount: number) =>
  api
    .post<PaymentConfirmResponse>("/payments/confirm/", {
      payment_key: paymentKey,
      order_id: orderId,
      amount,
    })
    .then((res) => res.data);
