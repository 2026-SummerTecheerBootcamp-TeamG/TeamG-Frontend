import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPayment } from "@/api/payments";
import { getRun } from "@/api/trips";
import { getApiErrorMessage } from "@/lib/api";
import type { BookingResult } from "@/types/payment";

type Phase = "confirming" | "booking" | "done" | "failed" | "error";

const POLL_INTERVAL = 1500;
const POLL_TIMEOUT = 60_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 토스 결제창에서 successUrl/failUrl로 돌아오는 화면 - 승인 처리 후 예약 결과까지 보여준다 */
export default function PaymentResult() {
  const [params] = useSearchParams();
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = params.get("amount");
  const canConfirm = !params.get("fail") && !!paymentKey && !!orderId && !!amount;

  const [phase, setPhase] = useState<Phase>(() => {
    if (!paymentKey || params.get("fail")) return "failed";
    if (!orderId || !amount) return "error";
    return "confirming";
  });
  const [message, setMessage] = useState(() => {
    if (!paymentKey || params.get("fail")) return params.get("message") || "결제가 완료되지 않았습니다.";
    if (!orderId || !amount) return "결제 정보를 확인할 수 없습니다.";
    return "";
  });
  const [booking, setBooking] = useState<BookingResult | null>(null);

  const cancelledRef = useRef(false);
  useEffect(() => () => {
    cancelledRef.current = true;
  }, []);

  useEffect(() => {
    if (!canConfirm || !paymentKey || !orderId || !amount) return;

    (async () => {
      try {
        const confirmed = await confirmPayment(paymentKey, orderId, Number(amount));
        if (cancelledRef.current) return;

        if (!confirmed.run_id) {
          setPhase("done");
          return;
        }

        setPhase("booking");
        const started = Date.now();
        while (Date.now() - started < POLL_TIMEOUT) {
          if (cancelledRef.current) return;
          const run = await getRun(confirmed.run_id);
          if (run.status === "completed") {
            setBooking(run.result as BookingResult | null);
            setPhase("done");
            return;
          }
          if (run.status === "failed") {
            setPhase("error");
            setMessage("예약 처리에 실패했습니다. 마이페이지에서 다시 시도해 주세요.");
            return;
          }
          await sleep(POLL_INTERVAL);
        }
        setPhase("error");
        setMessage("예약 처리가 오래 걸리고 있습니다. 마이페이지에서 상태를 확인해 주세요.");
      } catch (e) {
        if (cancelledRef.current) return;
        setPhase("error");
        setMessage(getApiErrorMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-[480px] flex-col items-center justify-center px-6 text-center"
      style={{ fontFamily: "Pretendard, sans-serif" }}
    >
      {(phase === "confirming" || phase === "booking") && (
        <>
          <span className="mb-5 h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-cobalt" />
          <h1 className="text-lg font-bold tracking-[-0.02em]">
            {phase === "confirming" ? "결제를 확인하는 중입니다" : "숙소를 예약하는 중입니다"}
          </h1>
          <p className="mt-2 text-sm text-ink-3">잠시만 기다려 주세요.</p>
        </>
      )}

      {phase === "done" && (
        <>
          <p className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt-soft text-2xl text-cobalt">
            ✓
          </p>
          <h1 className="text-lg font-bold tracking-[-0.02em]">
            {booking?.booking_status === "failed" ? "결제는 완료됐지만 예약에 실패했습니다" : "예약이 완료됐습니다"}
          </h1>
          {booking?.summary && (
            <p className="mt-3 break-keep text-sm text-ink-2">{booking.summary}</p>
          )}
          {booking?.confirmation && (
            <p className="mt-2 text-xs text-ink-3">확인 코드 {booking.confirmation}</p>
          )}
          <Link
            to="/"
            className="mt-6 rounded-field bg-cobalt px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1c36c4]"
          >
            홈으로
          </Link>
        </>
      )}

      {(phase === "failed" || phase === "error") && (
        <>
          <p className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef0ee] text-2xl text-stamp">
            !
          </p>
          <h1 className="text-lg font-bold tracking-[-0.02em]">
            {phase === "failed" ? "결제가 취소됐습니다" : "문제가 발생했습니다"}
          </h1>
          <p className="mt-2 break-keep text-sm text-ink-3">{message}</p>
          <Link
            to="/"
            className="mt-6 rounded-field bg-cobalt px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1c36c4]"
          >
            홈으로
          </Link>
        </>
      )}
    </div>
  );
}
