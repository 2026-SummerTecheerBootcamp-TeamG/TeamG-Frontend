/**
 * 토스페이먼츠 JS SDK(v2 standard) 로더
 * 여러 곳에서 동시에 불러도 스크립트를 한 번만 넣는다.
 */

export interface TossPaymentInstance {
  requestPayment: (options: {
    method: "CARD";
    amount: { currency: "KRW"; value: number };
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
  }) => Promise<void>;
}

interface TossPaymentsSdk {
  ANONYMOUS: string;
  payment: (options: { customerKey: string }) => TossPaymentInstance;
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsSdk;
  }
}

let loading: Promise<void> | null = null;

export function loadTossPayments(): Promise<void> {
  if (window.TossPayments) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("결제 모듈을 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return loading;
}
