import { useState } from "react";
import RouteMap from "./RouteMap";
import type { ParsedFields, PlanDetail, PlanStatus } from "@/types/trip";
import { preparePayment } from "@/api/payments";
import { getApiErrorMessage } from "@/lib/api";
import { loadTossPayments } from "@/lib/tossPayments";
import { formatWon } from "../lib/parseRequest";

interface Props {
  plan: PlanDetail;
  request: ParsedFields | null;
  version: number;
  status: PlanStatus;
  onConfirm: () => void;
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

const formatDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;
};

export default function PlanSheet({ plan, request, version, status, onConfirm }: Props) {
  const { allocation: al, flight, hotel, days } = plan;
  const confirmed = status === "confirmed";

  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  /** 확정된 플랜 결제: 서버가 금액을 정하고(prepare) 토스 결제창을 연다 */
  const handlePay = async () => {
    setIsPaying(true);
    setPayError(null);
    try {
      const [order] = await Promise.all([preparePayment(plan.plan_id), loadTossPayments()]);
      const toss = window.TossPayments!(order.client_key);
      const payment = toss.payment({ customerKey: "ANONYMOUS" });
      const backHere = `${window.location.origin}/payment/result`;
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: order.amount },
        orderId: order.order_id,
        orderName: order.order_name,
        successUrl: backHere,
        failUrl: `${backHere}?fail=1`,
      });
      // 성공하면 브라우저가 토스 결제창으로 이동하므로 이 아래는 보통 실행되지 않는다
    } catch (e) {
      setPayError(getApiErrorMessage(e));
      setIsPaying(false);
    }
  };

  const cities = days.length > 0
    ? Array.from(new Set(days.map((d) => d.city_name).filter(Boolean))).join(" · ")
    : request?.destinations.map((d) => d.city).join(" · ");
  const nights = Math.max(0, days.length - 1);
  const pax = request ? request.pax.adult + request.pax.child : null;

  const budgetAl = al && (al.status === "fit" || al.status === "insufficient") ? al : null;
  /** 예산 바 전체 길이 - 총예산과 실비용 중 큰 쪽 (초과 시에도 막대가 넘치지 않게) */
  const barDenom = budgetAl ? Math.max(budgetAl.total_budget, budgetAl.total_cost) : 0;
  /** 예산 중 안 쓴 만큼 (fit일 때만) */
  const remaining =
    budgetAl?.status === "fit" ? Math.max(0, budgetAl.total_budget - budgetAl.total_cost) : 0;
  /** 예산 바에서 각 항목이 차지하는 비율 */
  const ratio = (value: number, denom: number) =>
    Math.max(2, Math.round((value / Math.max(denom, 1)) * 100));

  return (
    <div className="relative" style={{ fontFamily: "Pretendard, sans-serif" }}>
      {/* 확정 도장 */}
      {confirmed && (
        <div className="absolute right-6 top-5 z-10 -rotate-[9deg] rounded-[10px] border-[2.5px] border-stamp px-3 py-2 text-center text-stamp opacity-90">
          <p className="text-[17px] font-extrabold tracking-[0.14em]">확정</p>
          <p className="mt-0.5 text-[9px] tracking-[0.08em]">
            {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 border-b border-line px-7 pb-5 pt-6">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            계획 완성
          </p>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.04em]">
            {cities || "여행"} {nights > 0 && `${nights}박 ${nights + 1}일`}
          </h2>
          {pax !== null && (
            <p className="mt-1.5 text-xs text-ink-2">인원 {pax}명</p>
          )}
        </div>
        <span className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-ink-3">
          v{version}
        </span>
      </div>

      {/* 설명문 */}
      {plan.narrative && (
        <div className="border-b border-line-soft bg-[#fcfdfd] px-7 py-4 text-[13px] leading-relaxed text-ink-2">
          {plan.narrative}
        </div>
      )}

      {/* 예산 정산 */}
      <div className="border-b border-line bg-[#fcfdfd] px-7 py-5">
        {al === null && (
          <p className="text-[13px] text-ink-3">예산 정산 정보가 없습니다.</p>
        )}

        {al?.status === "no_flights" || al?.status === "no_hotels" ? (
          <p className="text-[13px] text-stamp">{al.message}</p>
        ) : null}

        {budgetAl && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-ink-2">
                {budgetAl.status === "fit" ? "확정 금액" : "최소 필요 금액"}
              </span>
              <span className=" text-[22px] font-bold tracking-[-0.02em]">
                {formatWon(budgetAl.total_cost)}원{" "}
                <span className="text-[13px] font-medium text-ink-3">
                  / {formatWon(budgetAl.total_budget)}원
                </span>
              </span>
            </div>

            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-md bg-[#edf0f3]">
              <span
                className="block rounded-sm bg-cobalt transition-[width] duration-700"
                style={{ width: `${ratio(budgetAl.breakdown.flight_krw, barDenom)}%` }}
              />
              <span
                className="block rounded-sm bg-teal transition-[width] duration-700"
                style={{ width: `${ratio(budgetAl.breakdown.hotel_krw, barDenom)}%` }}
              />
              <span
                className="block rounded-sm bg-amber transition-[width] duration-700"
                style={{ width: `${ratio(budgetAl.breakdown.activity_krw, barDenom)}%` }}
              />
              {budgetAl.status === "fit" && remaining > 0 && (
                <span
                  className="block rounded-sm bg-[#d7dce1] transition-[width] duration-700"
                  style={{ width: `${ratio(remaining, barDenom)}%` }}
                />
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12.5px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-sm bg-cobalt" />
                항공 <b className=" text-ink">{formatWon(budgetAl.breakdown.flight_krw)}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-sm bg-teal" />
                숙소 <b className=" text-ink">{formatWon(budgetAl.breakdown.hotel_krw)}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-sm bg-amber" />
                일정 <b className=" text-ink">{formatWon(budgetAl.breakdown.activity_krw)}</b>
              </span>
              {budgetAl.status === "fit" ? (
                <span className="ml-auto text-[12.5px] font-semibold text-teal">
                  <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#d7dce1]" />
                  {formatWon(remaining)}원 남음
                </span>
              ) : (
                <span className="ml-auto text-[12.5px] font-semibold text-stamp">
                  {formatWon(budgetAl.shortfall)}원 부족
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* 항공 */}
      {flight && (
        <div className="border-b border-line-soft px-7 py-5">
          <p className="mb-3 text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            항공
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-base font-bold tracking-[-0.025em]">{flight.airline}</p>
              {flight.utility !== null && (
                <p className="mt-1 text-[12.5px] text-ink-3">만족도 점수 {flight.utility}</p>
              )}
            </div>
            <div className="min-w-[92px] whitespace-nowrap text-right text-sm font-bold">
              {formatWon(budgetAl ? budgetAl.breakdown.flight_krw : flight.price_krw)}원
            </div>
          </div>
          {flight.booking_url && (
            <a
              href={flight.booking_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-[12.5px] font-semibold text-cobalt hover:underline"
            >
              항공권 확인하러 가기 →
            </a>
          )}
        </div>
      )}

      {/* 숙소 */}
      {hotel && (
        <div className="border-b border-line px-7 py-5">
          <p className="mb-3 text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            숙소{nights > 0 && ` · ${nights}박`}
          </p>
          <div className="flex items-center gap-4">
            <div className="h-[74px] w-[74px] shrink-0 rounded-xl bg-gradient-to-br from-[#20303f] to-[#3c5468]" />
            <div className="flex-1">
              <p className="text-base font-bold tracking-[-0.025em]">{hotel.name}</p>
              {pax !== null && (
                <p className="mt-1 text-[12.5px] text-ink-3">
                  트윈 {Math.ceil(pax / 2)}실{nights > 0 && ` · ${nights}박`}
                </p>
              )}
              {hotel.utility !== null && (
                <p className="mt-1 text-[12.5px] text-ink-3">만족도 점수 {hotel.utility}</p>
              )}
            </div>
            <div className="min-w-[92px] whitespace-nowrap text-right text-sm font-bold">
              {formatWon(budgetAl ? budgetAl.breakdown.hotel_krw : hotel.price_krw)}원
              {nights > 0 && (
                <span className="mt-0.5 block text-[11px] font-medium text-ink-3">
                  1박 {formatWon(Math.round(hotel.price_krw / nights))}원
                </span>
              )}
            </div>
          </div>
          {hotel.booking_url && (
            <a
              href={hotel.booking_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-[12.5px] font-semibold text-cobalt hover:underline"
            >
              숙소 확인하러 가기 →
            </a>
          )}
        </div>
      )}

      {/* 동선 지도 */}
      {days.length > 0 && (
        <div className="border-b border-line px-7 py-5">
          <RouteMap days={days} />
        </div>
      )}

      {/* 일정 */}
      <div className="px-7 pb-6 pt-5">
        <p className="mb-1 text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
          일정
        </p>

        {days.map((day, i) => (
          <div key={i} className="border-t border-line-soft pt-5">
            <div className="mb-3.5 flex items-baseline gap-2.5">
              <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-bold tracking-[0.06em] text-white">
                DAY {i + 1}
              </span>
              <span className="text-xs text-ink-3">{formatDay(day.date)}</span>
              {day.city_name && (
                <span className="ml-auto text-[13px] text-ink-2">{day.city_name}</span>
              )}
            </div>

            <div className="relative pl-[34px]">
              {/* 세로선 */}
              <span className="absolute bottom-4 left-[18px] top-1.5 w-px bg-line" />

              {day.items.map((item, j) => (
                <div key={j} className="relative pb-4">
                  <span className="absolute -left-[34px] top-0 w-7 text-right text-[12.5px] font-semibold tabular-nums">
                    {item.visit_order}
                  </span>
                  <span className="absolute -left-[17px] top-[5px] h-2.5 w-2.5 rounded-full border-[1.5px] border-cobalt bg-white" />
                  <p className="text-[15px] font-semibold tracking-[-0.02em]">{item.place_name}</p>
                  {item.place_detail?.address && (
                    <p className="mt-1 break-keep text-[12.5px] text-ink-3">
                      {item.place_detail.address}
                    </p>
                  )}
                  {item.place_detail?.rating != null && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-amber">
                      ★ {item.place_detail.rating}
                      {item.place_detail.user_ratings != null && (
                        <span className="text-ink-3">
                          ({item.place_detail.user_ratings})
                        </span>
                      )}
                    </span>
                  )}
                  {item.travel_min_to_next != null && (
                    <span className="mt-2 inline-flex rounded-md bg-[#f4f6f8] px-2 py-0.5 text-[11px] text-ink-2">
                      다음 장소까지 {item.travel_mode ? `${item.travel_mode} · ` : ""}
                      {item.travel_min_to_next}분
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 확정 / 결제 */}
      <div className="sticky bottom-0 border-t border-line bg-white/90 px-7 py-3.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <p className="text-[12.5px] text-ink-3">
            {confirmed
              ? hotel
                ? "숙소를 결제하면 자동으로 예약까지 진행됩니다."
                : "마이페이지에 저장했습니다."
              : "고칠 곳이 있으면 왼쪽에 문장으로 적어주세요."}
          </p>

          {confirmed && hotel ? (
            <button
              onClick={handlePay}
              disabled={isPaying}
              className="ml-auto whitespace-nowrap rounded-field bg-cobalt px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-px hover:bg-[#1c36c4] disabled:cursor-default disabled:opacity-60"
            >
              {isPaying ? "결제창 여는 중..." : "숙소 결제하기"}
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={confirmed}
              className={`ml-auto whitespace-nowrap rounded-field px-5 py-2.5 text-sm font-bold text-white transition-all ${
                confirmed
                  ? "cursor-default bg-teal"
                  : "bg-cobalt hover:-translate-y-px hover:bg-[#1c36c4]"
              }`}
            >
              {confirmed ? "확정됨" : "이 계획으로 확정"}
            </button>
          )}
        </div>
        {payError && <p className="mt-2 text-[12px] text-stamp">{payError}</p>}
      </div>
    </div>
  );
}
