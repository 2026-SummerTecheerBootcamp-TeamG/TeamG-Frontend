import { useEffect, useMemo, useRef, useState } from "react";
import RouteMap from "./RouteMap";
import type { ParsedFields, PlanDetail, PlanStatus } from "@/types/trip";
import { preparePayment } from "@/api/payments";
import { getRun, ticketFlight } from "@/api/trips";
import { getApiErrorMessage } from "@/lib/api";
import { loadTossPayments } from "@/lib/tossPayments";
import { formatWon } from "../lib/parseRequest";

interface Props {
  plan: PlanDetail;
  request: ParsedFields | null;
  version: number;
  status: PlanStatus;
  onConfirm: () => void;
  /** 읽기 전용 (마이페이지 상세): 확정 버튼·도장을 숨긴다 */
  readOnly?: boolean;
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

const formatDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;
};

/** "2026-09-15 09:20" -> "09:20" */
const formatClock = (raw: string) => raw.split(" ")[1] ?? raw;

/** "2026-07-16T14:32:10+09:00" -> "2026-07-16 14:32" */
const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 175(분) -> "2시간 55분" */
const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간${m > 0 ? ` ${m}분` : ""}` : `${m}분`;
};

/** narrative(마크다운)를 "## Day N" 헤더 기준으로 잘라 DAY별 설명 텍스트만 뽑아낸다 */
function splitNarrativeByDay(narrative: string): Map<number, string> {
  const result = new Map<number, string>();
  const headerRe = /##\s*Day\s*(\d+)[^\n]*\n/g;
  const matches = [...narrative.matchAll(headerRe)];

  matches.forEach((m, idx) => {
    const dayNumber = Number(m[1]);
    const start = m.index! + m[0].length;
    const end = idx + 1 < matches.length ? matches[idx + 1].index! : narrative.length;
    const text = narrative.slice(start, end).replace(/^-+\s*$/gm, "").trim();
    if (text) result.set(dayNumber, text);
  });

  return result;
}

/** "**text**" 마크다운 굵게 표시만 최소 처리해서 렌더링한다 (마크다운 라이브러리 없이) */
function renderBoldText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      chunk
    ),
  );
}

export default function PlanSheet({ plan, request, version, status, onConfirm, readOnly = false }: Props) {
  const { allocation: al, flight, hotel, days, payment, bookings } = plan;
  /** 재시도 이력까지 시간순으로 들어있으니 종류별 마지막(최근) 건 기준으로 표시
      kind가 없는 옛 데이터는 전부 숙소 예약이므로 "flight가 아닌 것" = 숙소 */
  const hotelBookings = bookings.filter((b) => b.kind !== "flight");
  const lastBooking = hotelBookings.length > 0 ? hotelBookings[hotelBookings.length - 1] : null;
  const flightBookings = bookings.filter((b) => b.kind === "flight");
  const lastTicket = flightBookings.length > 0 ? flightBookings[flightBookings.length - 1] : null;

  const confirmed = status === "confirmed";

  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  /**
   * 확정 축하 모달 — "확정했는데 그 다음이 없다"는 피드백 대응.
   * 확정되는 "순간"(ready -> confirmed 전환)에만 열린다.
   * prevRef와 비교하는 이유: 마이페이지에서 이미 확정된 계획을 열 때는
   * 처음부터 confirmed라 전환이 없음 -> 모달이 안 뜸 (의도된 동작)
   */
  const [modalOpen, setModalOpen] = useState(false);
  const prevConfirmedRef = useRef(confirmed);
  useEffect(() => {
    if (!prevConfirmedRef.current && confirmed && !readOnly) setModalOpen(true);
    prevConfirmedRef.current = confirmed;
  }, [confirmed, readOnly]);

  /** 예약·결제 패널에서 정보가 펼쳐진 항목 (항공/숙소 중 하나만, 다시 누르면 접힘) */
  const [openInfo, setOpenInfo] = useState<"flight" | "hotel" | null>(null);

  /** 모달의 "예약·결제하러 가기": 모달을 닫고 예약 패널 위치로 부드럽게 스크롤 */
  const goToBookingPanel = () => {
    setModalOpen(false);
    // setState 반영 후 스크롤되도록 다음 프레임으로 미룸
    requestAnimationFrame(() => {
      document.getElementById("booking-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  /** DAY별 설명 접기/펼치기 */
  const narrativeByDay = useMemo(
    () => (plan.narrative ? splitNarrativeByDay(plan.narrative) : new Map<number, string>()),
    [plan.narrative],
  );
  const [openDays, setOpenDays] = useState<Set<number>>(new Set());
  const toggleDay = (dayNumber: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

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

  /** 항공 발권 (자체 mock 공급자): 접수 -> 에이전트가 운임확인→좌석점유→발권 -> PNR */
  const [ticket, setTicket] = useState<{ pnr: string } | null>(null);
  const [isTicketing, setIsTicketing] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  /** 화면에 보여줄 PNR — 방금 발권한 것(ticket) 또는 저장된 발권 이력(lastTicket) */
  const issuedPnr =
    ticket?.pnr ?? (lastTicket?.status === "confirmed" ? lastTicket.booking_id : null);

  const handleTicket = async () => {
    setIsTicketing(true);
    setTicketError(null);
    try {
      const accepted = await ticketFlight(plan.plan_id);
      // 발권은 워커의 에이전트가 수행 — 완료될 때까지 폴링 (결제창과 달리 페이지 이동 없음)
      const started = Date.now();
      while (Date.now() - started < 90_000) {
        const run = await getRun(accepted.run_id);
        if (run.status === "completed") {
          const r = run.result as { pnr?: string | null } | null;
          if (r?.pnr) {
            setTicket({ pnr: r.pnr });
            return;
          }
          throw new Error("발권에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
        if (run.status === "failed") {
          throw new Error("발권에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      throw new Error("발권이 시간 초과되었습니다. 다시 시도해 주세요.");
    } catch (e) {
      setTicketError(e instanceof Error ? e.message : getApiErrorMessage(e));
    } finally {
      setIsTicketing(false);
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
    <div className="relative">
      {/* 확정 도장 (읽기 전용에서는 숨김) */}
      {confirmed && !readOnly && (
        <div
          className="absolute right-6 top-5 z-10 -rotate-[9deg] rounded-[10px] border-[2.5px] border-stamp px-3 py-2 text-center text-stamp opacity-90"
          style={{ fontFamily: "Pretendard, sans-serif" }}
        >
          <p className="text-[17px] font-extrabold tracking-[0.14em]">확정</p>
          <p className="mt-0.5 text-[9px] tracking-[0.08em]">
            {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 border-b border-line px-7 pb-5 pt-6">
        <div>
          <p
            className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-teal"
            style={{ fontFamily: "Pretendard, sans-serif" }}
          >
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
        <span
          className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10.5px] text-ink-3"
          style={{ fontFamily: "Pretendard, sans-serif" }}
        >
          v{version}
        </span>
      </div>

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
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
                {budgetAl.status === "fit" ? (
                  "확정 금액"
                ) : (
                  <>
                    {/* 예산 초과는 한눈에 보여야 함 - 빨간 배지 + 빨간 금액 */}
                    <span className="rounded-md bg-stamp px-2 py-0.5 text-[11.5px] font-bold text-white">
                      예산 초과
                    </span>
                    최소 필요 금액
                  </>
                )}
              </span>
              <span
                className={`text-[22px] font-bold tracking-[-0.02em] ${
                  budgetAl.status === "insufficient" ? "text-stamp" : ""
                }`}
              >
                {formatWon(budgetAl.total_cost)}원{" "}
                <span className="text-[13px] font-medium text-ink-3">
                  / 예산 {formatWon(budgetAl.total_budget)}원
                </span>
              </span>
            </div>

            {budgetAl.status === "insufficient" && (
              <p className="mb-3 rounded-field border border-stamp/30 bg-stamp/5 px-3 py-2 text-[12.5px] font-semibold text-stamp">
                예산을 {formatWon(budgetAl.shortfall)}원 초과했어요. 아래는 가장
                저렴한 조합 기준이에요 — 예산을 늘리거나, 왼쪽 채팅으로 날짜·조건을
                바꿔보세요.
              </p>
            )}

            {budgetAl.reserve > 0 && (
              <p className="mb-3 text-[11.5px] text-ink-3">
                예비비 {formatWon(budgetAl.reserve)}원(5%)을 제외하면{" "}
                {formatWon(budgetAl.spendable)}원까지 사용할 수 있어요.
              </p>
            )}

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

      {/* ── 예약 · 결제 패널 ──────────────────────────────────────────
          확정된 계획에서만 등장. 예약해야 하는 항목(항공/숙소)을 목록으로 보여주고
          이름을 누르면 정보가 펼쳐지며, 옆의 버튼으로 결제(토스)/예매(딥링크)로 간다.
          마이페이지(readOnly)에서도 그대로 동작 — 결제는 어디서든 가능해야 하므로 */}
      {confirmed && (flight || hotel) && (
        <div id="booking-panel" className="border-b border-line bg-[#fcfdfd] px-7 py-5">
          <p className="mb-1 text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            예약 · 결제
          </p>
          <p className="mb-3.5 text-[12.5px] text-ink-2">
            아래 항목을 예약하면 여행 준비가 끝나요. 이름을 누르면 상세 정보를 볼 수 있어요.
          </p>

          <div className="space-y-2.5">
            {/* 숙소: 토스 결제 → 승인되면 예약까지 자동 진행 */}
            {hotel && (
              <div className="rounded-field border border-line bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal/10 text-[15px]">
                    🏨
                  </span>
                  <button
                    onClick={() => setOpenInfo(openInfo === "hotel" ? null : "hotel")}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[14.5px] font-bold tracking-[-0.02em]">
                      {hotel.name}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ink-3">
                      숙소{nights > 0 && ` · ${nights}박`} · 정보 보기{" "}
                      {openInfo === "hotel" ? "▲" : "▼"}
                    </p>
                  </button>
                  <span className="whitespace-nowrap text-[13.5px] font-bold">
                    {formatWon(budgetAl ? budgetAl.breakdown.hotel_krw : hotel.price_krw)}원
                  </span>
                  {payment ? (
                    <span className="whitespace-nowrap rounded-field bg-teal/10 px-3 py-1.5 text-[11.5px] font-bold text-teal">
                      ✓ 결제 완료
                    </span>
                  ) : (
                    <button
                      onClick={handlePay}
                      disabled={isPaying}
                      className="whitespace-nowrap rounded-field bg-cobalt px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#1c36c4] disabled:opacity-60"
                    >
                      {isPaying ? "결제창 여는 중..." : "결제하기"}
                    </button>
                  )}
                </div>

                {openInfo === "hotel" && (
                  <div className="mt-3 rounded-lg bg-[#f4f6f8] px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-2">
                    {hotel.stars !== null && (
                      <p>
                        등급:{" "}
                        <span className="text-amber">
                          {"★".repeat(hotel.stars)}
                          {"☆".repeat(Math.max(0, 5 - hotel.stars))}
                        </span>
                      </p>
                    )}
                    {pax !== null && <p>객실: 트윈 {Math.ceil(pax / 2)}실{nights > 0 && ` · ${nights}박`}</p>}
                    {nights > 0 && <p>1박 요금: {formatWon(Math.round(hotel.price_krw / nights))}원</p>}
                    {hotel.utility !== null && <p>만족도 점수: {hotel.utility}</p>}
                    <p className="mt-1 text-ink-3">
                      결제는 토스페이먼츠로 진행되고, 승인되면 예약까지 자동으로 이어집니다.
                    </p>
                  </div>
                )}

                {(payment || lastBooking) && (
                  <div className="mt-3 rounded-lg bg-teal/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
                    {payment && (
                      <p>
                        ✓ {formatWon(payment.amount)}원 · {payment.method} ·{" "}
                        {formatDateTime(payment.approved_at)} 결제 완료
                      </p>
                    )}
                    {lastBooking && (
                      <p className={lastBooking.status === "confirmed" ? "font-semibold text-teal" : "font-semibold text-stamp"}>
                        {lastBooking.status === "confirmed"
                          ? `✓ 예약 확정${lastBooking.confirmation ? ` · 확인번호 ${lastBooking.confirmation}` : ""}`
                          : "예약에 실패했어요. 잠시 후 다시 시도해 주세요."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 항공: 발권 규제로 직접 결제 대신 항공사/예매처 딥링크로 안내 */}
            {flight && (
              <div className="rounded-field border border-line bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cobalt-soft text-[15px]">
                    ✈️
                  </span>
                  <button
                    onClick={() => setOpenInfo(openInfo === "flight" ? null : "flight")}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-[14.5px] font-bold tracking-[-0.02em]">
                      {flight.airline}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ink-3">
                      항공 · 정보 보기 {openInfo === "flight" ? "▲" : "▼"}
                    </p>
                  </button>
                  <span className="whitespace-nowrap text-[13.5px] font-bold">
                    {formatWon(budgetAl ? budgetAl.breakdown.flight_krw : flight.price_krw)}원
                  </span>
                  {issuedPnr ? (
                    <span className="whitespace-nowrap rounded-field bg-teal/10 px-3 py-1.5 text-[11.5px] font-bold text-teal">
                      ✓ 발권 완료
                    </span>
                  ) : (
                    <button
                      onClick={handleTicket}
                      disabled={isTicketing}
                      className="whitespace-nowrap rounded-field bg-cobalt px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#1c36c4] disabled:opacity-60"
                    >
                      {isTicketing ? "발권 중..." : "발권하기"}
                    </button>
                  )}
                </div>

                {openInfo === "flight" && (
                  <div className="mt-3 rounded-lg bg-[#f4f6f8] px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-2">
                    {(flight.departure_time || flight.arrival_time) && (
                      <p>
                        시간: {flight.departure_time && formatClock(flight.departure_time)}
                        {flight.arrival_time && ` → ${formatClock(flight.arrival_time)}`}
                      </p>
                    )}
                    {flight.duration_min != null && <p>소요: {formatDuration(flight.duration_min)}</p>}
                    {flight.stops != null && (
                      <p>경유: {flight.stops === 0 ? "직항" : `${flight.stops}회`}</p>
                    )}
                    {flight.utility !== null && <p>만족도 점수: {flight.utility}</p>}
                    <p className="mt-1 text-ink-3">
                      발권은 자체 mock 공급자로 진행되는 시뮬레이션입니다 (실제 결제
                      없음). 운임 재확인 → 좌석 점유 → 발권 순서로 에이전트가
                      수행하고 PNR(예약번호)을 발급받아요.
                    </p>
                    {flight.booking_url && (
                      <a
                        href={flight.booking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex text-[12px] font-semibold text-cobalt hover:underline"
                      >
                        실제 예매처에서 직접 예매하기 →
                      </a>
                    )}
                  </div>
                )}

                {(issuedPnr || ticketError) && (
                  <div className="mt-3 rounded-lg bg-teal/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed">
                    {issuedPnr && (
                      <p className="font-semibold text-teal">
                        ✓ 발권 완료 · PNR {issuedPnr}
                        <span className="ml-1.5 font-normal text-ink-3">
                          (mock 공급자 시뮬레이션 — 실제 결제 없음)
                        </span>
                      </p>
                    )}
                    {ticketError && <p className="font-semibold text-stamp">{ticketError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {payError && <p className="mt-2.5 text-[12px] text-stamp">{payError}</p>}
        </div>
      )}

      {/* 항공 */}
      {flight && (
        <div className="border-b border-line-soft px-7 py-5">
          {/* 항공권 결제는 백엔드에 아직 없음 (payment_prepare가 숙소 금액만 계산함) - 지원되면 여기에 결제 버튼 추가 */}
          <p className="mb-3 text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            항공
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-base font-bold tracking-[-0.025em]">{flight.airline}</p>
              {(flight.departure_time || flight.arrival_time) && (
                <div className="mt-1.5 flex items-center gap-2">
                  {flight.departure_time && (
                    <span className="text-[15px] font-bold tabular-nums">
                      {formatClock(flight.departure_time)}
                    </span>
                  )}
                  {(flight.duration_min != null || flight.stops != null) && (
                    <span className="text-[11px] text-ink-3">
                      {flight.duration_min != null && formatDuration(flight.duration_min)}
                      {flight.stops != null &&
                        ` · ${flight.stops === 0 ? "직항" : `경유 ${flight.stops}회`}`}
                    </span>
                  )}
                  {flight.arrival_time && (
                    <span className="text-[15px] font-bold tabular-nums">
                      {formatClock(flight.arrival_time)}
                    </span>
                  )}
                </div>
              )}
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
          {/* 결제 버튼/이력은 위의 "예약 · 결제" 패널로 일원화 (버튼이 두 군데면 헷갈림) */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
              숙소{nights > 0 && ` · ${nights}박`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-[74px] w-[74px] shrink-0 rounded-xl bg-gradient-to-br from-[#20303f] to-[#3c5468]" />
            <div className="flex-1">
              <p className="text-base font-bold tracking-[-0.025em]">{hotel.name}</p>
              {hotel.stars !== null && (
                <p className="mt-1 text-[11.5px] tracking-[0.1em] text-amber">
                  {"★".repeat(hotel.stars)}
                  {"☆".repeat(Math.max(0, 5 - hotel.stars))}
                </p>
              )}
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
          <RouteMap days={days} hotel={hotel} />
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
              <span
                className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-bold tracking-[0.06em] text-white"
                style={{ fontFamily: "Pretendard, sans-serif" }}
              >
                DAY {i + 1}
              </span>

              <span className="text-xs text-ink-3">{formatDay(day.date)}</span>
              {day.city_name && (
                <span className="ml-auto text-[13px] text-ink-2">{day.city_name}</span>

              )}
            </div>

            {narrativeByDay.has(day.day_number) && (
              <div className="mb-3.5">
                <button
                  onClick={() => toggleDay(day.day_number)}
                  className="flex w-full items-center gap-1.5 rounded-lg border border-line-soft bg-[#fcfdfd] px-3 py-2 text-left text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-ink-3"
                >
                  <span
                    className={`inline-block text-[10px] text-ink-3 transition-transform ${
                      openDays.has(day.day_number) ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                  일정 설명 {openDays.has(day.day_number) ? "접기" : "펼쳐보기"}
                </button>
                {openDays.has(day.day_number) && (
                  <div className="mt-2 whitespace-pre-line rounded-lg bg-[#fcfdfd] px-3.5 py-3 text-[13px] leading-relaxed text-ink-2">
                    {renderBoldText(narrativeByDay.get(day.day_number)!)}
                  </div>
                )}
              </div>
            )}

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

      {/* 확정 (읽기 전용이면 숨김) */}
      {!readOnly && (
        <div className="sticky bottom-0 border-t border-line bg-white/90 px-7 py-3.5 backdrop-blur">
          <div className="flex items-center gap-3">
            <p className="text-[12.5px] text-ink-3">
              {confirmed
                ? hotel || flight
                  ? "위 예약 · 결제 섹션에서 항공 예매와 숙소 결제를 진행할 수 있어요."
                  : "마이페이지에 저장했습니다."
                : "고칠 곳이 있으면 왼쪽에 문장으로 적어주세요."}
            </p>

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
          </div>
          {payError && <p className="mt-2 text-[12px] text-stamp">{payError}</p>}
        </div>
      )}

      {/* ── 확정 축하 모달: 예약/결제로 이어지는 출구 ─────────────────────
          여행 예약 서비스처럼 확정 직후 숙소/항공 정보를 다시 보여주고
          결제(토스)와 항공권 예매(딥링크)로 바로 보낸다 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 px-5 backdrop-blur-[2px]"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()} // 카드 안 클릭이 배경 닫기로 번지지 않게
            className="w-full max-w-[460px] rounded-card border border-line bg-white shadow-[0_24px_60px_-16px_rgba(15,20,24,.4)]"
            style={{ fontFamily: "Pretendard, sans-serif" }}
          >
            {/* 모달 헤더 */}
            <div className="border-b border-line px-6 pb-4 pt-6 text-center">
              <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-teal/10 text-[22px]">
                🎉
              </span>
              <h3 className="text-[19px] font-extrabold tracking-[-0.03em]">
                계획이 확정됐어요
              </h3>
              <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-ink-2">
                이제 예약과 결제를 진행할 수 있어요. 진행 상황은 결제 완료 화면과
                마이페이지에서 언제든 확인할 수 있습니다.
              </p>
            </div>

            <div className="px-6 py-5">
              {/* 예약할 항목 요약 한 줄 + 패널로 보내는 단일 CTA
                  (상세 정보/결제 버튼은 아래 "예약 · 결제" 패널에 일원화 — 모달은 축하와 안내만) */}
              {hotel || flight ? (
                <>
                  <p className="mb-3 text-center text-[13px] text-ink-2">
                    예약할 항목:{" "}
                    {[flight && "✈️ 항공", hotel && "🏨 숙소"].filter(Boolean).join(" · ")}
                  </p>
                  <button
                    onClick={goToBookingPanel}
                    className="w-full rounded-field bg-cobalt py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-[#1c36c4]"
                  >
                    예약·결제하러 가기
                  </button>
                </>
              ) : (
                <p className="py-2 text-center text-[13px] text-ink-3">
                  계획이 마이페이지에 저장됐습니다.
                </p>
              )}
            </div>

            <div className="border-t border-line-soft px-6 py-3.5">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-field py-2 text-[13px] font-semibold text-ink-3 transition-colors hover:bg-line-soft hover:text-ink"
              >
                나중에 할게요 — 계획서에서 언제든 결제할 수 있어요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
