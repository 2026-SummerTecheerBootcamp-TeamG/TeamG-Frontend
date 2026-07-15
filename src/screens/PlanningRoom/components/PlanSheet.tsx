import RouteMap from "./RouteMap";
import type { Plan, PlanStatus } from "@/types/trip";
import { formatWon } from "../lib/parseRequest";

interface Props {
  plan: Plan;
  budget: number;
  version: number;
  status: PlanStatus;
  /** 로그인한 사용자의 기본 출발지 (없으면 ICN) */
  departureIata: string;
  onConfirm: () => void;
  /** 읽기 전용 (마이페이지 상세): 확정 버튼·도장을 숨긴다 */
  readOnly?: boolean;
}

const formatDay = (d: Date) =>
  `${d.getMonth() + 1}월 ${d.getDate()}일 (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`;

export default function PlanSheet({
  plan,
  budget,
  version,
  status,
  departureIata,
  onConfirm,
  readOnly = false,
}: Props) {
  const { allocation: al, flight, hotel } = plan;
  const confirmed = status === "confirmed";

  /** 예산 바에서 각 항목이 차지하는 비율 */
  const ratio = (value: number) =>
    Math.max(2, Math.round((value / Math.max(al.total, budget)) * 100));

  return (
    <div className="relative">
      {/* 확정 도장 (읽기 전용에서는 숨김) */}
      {confirmed && !readOnly && (
        <div className="absolute right-6 top-5 z-10 -rotate-[9deg] rounded-[10px] border-[2.5px] border-stamp px-3 py-2 text-center font-mono text-stamp opacity-90">
          <p className="text-[17px] font-extrabold tracking-[0.14em]">확정</p>
          <p className="mt-0.5 text-[9px] tracking-[0.08em]">
            {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 border-b border-line px-7 pb-5 pt-6">
        <div>
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            계획 완성
          </p>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.04em]">
            {plan.city} {plan.nights}박 {plan.nights + 1}일
          </h2>
          <p className="mt-1.5 font-mono text-xs text-ink-2">
            성인 {plan.pax}명 · {plan.country}
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-ink-3">
          v{version}
        </span>
      </div>

      {/* 예산 정산 */}
      <div className="border-b border-line bg-[#fcfdfd] px-7 py-5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-ink-2">확정 금액</span>
          <span className="font-mono text-[22px] font-bold tracking-[-0.02em]">
            {formatWon(al.total)}원{" "}
            <span className="text-[13px] font-medium text-ink-3">
              / {formatWon(budget)}원
            </span>
          </span>
        </div>

        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-md bg-[#edf0f3]">
          <span className="block rounded-sm bg-cobalt transition-[width] duration-700" style={{ width: `${ratio(al.flight)}%` }} />
          <span className="block rounded-sm bg-teal transition-[width] duration-700" style={{ width: `${ratio(al.hotel)}%` }} />
          <span className="block rounded-sm bg-amber transition-[width] duration-700" style={{ width: `${ratio(al.activity)}%` }} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-cobalt" />
            항공 <b className="font-mono text-ink">{formatWon(al.flight)}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-teal" />
            숙소 <b className="font-mono text-ink">{formatWon(al.hotel)}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-amber" />
            일정 <b className="font-mono text-ink">{formatWon(al.activity)}</b>
          </span>
          <span
            className={`ml-auto font-mono text-[12.5px] font-semibold ${al.remaining >= 0 ? "text-teal" : "text-stamp"}`}
          >
            {al.remaining >= 0
              ? `${formatWon(al.remaining)}원 남음`
              : `${formatWon(-al.remaining)}원 초과`}
          </span>
        </div>
      </div>

      {/* 항공 */}
      <div className="border-b border-line-soft px-7 py-5">
        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
          항공 · 왕복 확정
        </p>

        {[
          { from: departureIata, to: plan.iata, times: flight.outbound, price: flight.price, note: "1인 · 왕복" },
          { from: plan.iata, to: departureIata, times: flight.inbound, price: al.flight, note: `${plan.pax}인 합계` },
        ].map((leg, i) => (
          <div key={i} className={`flex items-center gap-2 ${i > 0 ? "mt-3.5" : ""}`}>
            <div className="flex flex-1 items-center gap-3.5">
              <div className="min-w-[78px]">
                <p className="font-mono text-xs tracking-[0.06em] text-ink-3">{leg.from}</p>
                <p className="text-lg font-bold tabular-nums tracking-[-0.03em]">{leg.times[0]}</p>
              </div>
              <div className="relative h-5 flex-1">
                <span className="absolute left-0 right-0 top-[9px] h-px bg-line" />
                <span className="absolute left-1/2 top-0.5 -translate-x-1/2 whitespace-nowrap bg-white px-2 font-mono text-[10.5px] text-ink-2">
                  {flight.duration} · {flight.stops === 0 ? "직항" : `경유 ${flight.stops}회`}
                </span>
              </div>
              <div className="min-w-[78px]">
                <p className="font-mono text-xs tracking-[0.06em] text-ink-3">{leg.to}</p>
                <p className="text-lg font-bold tabular-nums tracking-[-0.03em]">{leg.times[1]}</p>
              </div>
            </div>
            <div className="min-w-[92px] whitespace-nowrap text-right font-mono text-sm font-bold">
              {formatWon(leg.price)}원
              <span className="mt-0.5 block text-[11px] font-medium text-ink-3">{leg.note}</span>
            </div>
          </div>
        ))}

        <div className="mt-2.5 flex flex-wrap gap-2.5 text-[12.5px] text-ink-3">
          <span>{flight.airline}</span>
          <span>수하물 15kg 포함</span>
          <span>좌석 지정 완료</span>
        </div>
      </div>

      {/* 숙소 */}
      <div className="border-b border-line px-7 py-5">
        <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
          숙소 · {plan.nights}박 확정
        </p>
        <div className="flex items-center gap-4">
          <div className="h-[74px] w-[74px] shrink-0 rounded-xl bg-gradient-to-br from-[#20303f] to-[#3c5468]" />
          <div className="flex-1">
            <p className="text-base font-bold tracking-[-0.025em]">{hotel.name}</p>
            <p className="mt-1 text-[12.5px] text-ink-3">
              {hotel.area} · 트윈 {Math.ceil(plan.pax / 2)}실 · {plan.nights}박
            </p>
            <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-amber">
              {"★".repeat(hotel.stars)}
              {"☆".repeat(5 - hotel.stars)}
            </p>
          </div>
          <div className="min-w-[92px] whitespace-nowrap text-right font-mono text-sm font-bold">
            {formatWon(al.hotel)}원
            <span className="mt-0.5 block text-[11px] font-medium text-ink-3">
              1박 {formatWon(hotel.pricePerNight)}원
            </span>
          </div>
        </div>
      </div>

      {/* 동선 지도 */}
      <div className="border-b border-line px-7 py-5">
        <RouteMap plan={plan} />
      </div>

      {/* 일정 */}
      <div className="px-7 pb-6 pt-5">
        <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
          일정 · 시각 확정
        </p>

        {plan.days.map((day, i) => (
          <div key={i} className="border-t border-line-soft pt-5">
            <div className="mb-3.5 flex items-baseline gap-2.5">
              <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-[0.06em] text-white">
                DAY {i + 1}
              </span>
              <span className="font-mono text-xs text-ink-3">{formatDay(day.date)}</span>
              {day.note && (
                <span className="ml-auto text-[13px] text-ink-2">{day.note} 일정</span>
              )}
            </div>

            <div className="relative pl-[74px]">
              {/* 세로선 */}
              <span className="absolute bottom-4 left-[58px] top-1.5 w-px bg-line" />

              {day.items.map((item, j) => (
                <div key={j} className="relative pb-4">
                  <span className="absolute -left-[74px] top-0 w-11 text-right font-mono text-[12.5px] font-semibold tabular-nums">
                    {item.arriveAt}
                  </span>
                  <span
                    className={`absolute -left-[17px] top-[5px] h-2.5 w-2.5 rounded-full border-[1.5px] bg-white ${item.isMeal ? "border-amber" : "border-cobalt"}`}
                  />
                  <p className="text-[15px] font-semibold tracking-[-0.02em]">{item.placeName}</p>
                  <p className="mt-1 break-keep text-[12.5px] text-ink-3">{item.description}</p>
                  <span className="mt-2 inline-flex rounded-md bg-[#f4f6f8] px-2 py-0.5 font-mono text-[11px] text-ink-2">
                    {item.transit} · 머무는 시간 {item.stayMinutes}분
                  </span>
                  <p className="mt-1.5 font-mono text-[11.5px] text-ink-3">
                    {item.cost > 0
                      ? `1인 ${formatWon(item.cost)}원 · ${plan.pax}인 ${formatWon(item.cost * plan.pax)}원`
                      : "입장료 없음"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 확정 (읽기 전용이면 숨김) */}
      {!readOnly && (
      <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-white/90 px-7 py-3.5 backdrop-blur">
        <p className="text-[12.5px] text-ink-3">
          {confirmed
            ? "마이페이지에 저장했습니다."
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
      )}
    </div>
  );
}