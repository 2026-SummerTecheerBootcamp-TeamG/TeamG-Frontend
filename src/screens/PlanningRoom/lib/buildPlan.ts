import type { Plan, PlanDay, TripRequest } from "@/types/trip";
import { CITIES } from "./cities";
import { getNights } from "./parseRequest";

/**
 * 계획 생성 (임시)
 * POST /api/v1/trips 연동 전까지 프론트에서 계산한다.
 * 연동 후에는 이 함수 대신 서버가 내려준 계획을 그대로 쓴다.
 */
export function buildPlan(req: TripRequest): Plan {
  const city = req.city!;
  const pax = req.pax!;
  const budget = req.budget!;
  const nights = getNights(req);
  const data = CITIES[city];

  const flightTotal = data.flight.price * pax;

  // 장소를 날짜별로 나눈다 (첫날·마지막 날은 2곳, 나머지는 3곳)
  const pool = [...data.places];
  const days: PlanDay[] = [];

  for (let i = 0; i <= nights; i++) {
    const date = new Date(req.start!);
    date.setDate(date.getDate() + i);

    const count = i === 0 || i === nights ? 2 : 3;
    const items = pool.splice(0, count);
    const fallback = items.length > 0 ? items : data.places.slice(0, count);

    days.push({
      date,
      items: fallback.map((item) => ({ ...item })),
      note: i === 0 ? "도착 후" : i === nights ? "출발 전" : undefined,
    });
  }

  const sumActivity = () =>
    days.reduce(
      (sum, day) => sum + day.items.reduce((s, item) => s + item.cost * pax, 0),
      0,
    );

  // 예산을 넘으면 숙소 등급을 낮춘다
  let hotel = data.hotels[0];
  let downgraded = false;
  let hotelTotal = hotel.pricePerNight * nights;
  let activityTotal = sumActivity();

  if (flightTotal + hotelTotal + activityTotal > budget) {
    hotel = data.hotels[1];
    downgraded = true;
    hotelTotal = hotel.pricePerNight * nights;
  }

  // 그래도 넘으면 비싼 일정 비용을 줄인다
  if (flightTotal + hotelTotal + activityTotal > budget) {
    days.forEach((day) =>
      day.items.forEach((item) => {
        if (item.cost > 18_000) {
          item.cost = Math.round((item.cost * 0.6) / 1000) * 1000;
        }
      }),
    );
    activityTotal = sumActivity();
  }

  const total = flightTotal + hotelTotal + activityTotal;

  return {
    city,
    country: data.country,
    iata: data.iata,
    nights,
    pax,
    flight: data.flight,
    hotel,
    days,
    allocation: {
      flight: flightTotal,
      hotel: hotelTotal,
      activity: activityTotal,
      total,
      remaining: budget - total,
    },
    downgraded,
  };
}

/** 문장으로 들어온 수정 요청을 반영한다 */
export function applyEdit(
  req: TripRequest,
  text: string,
): { request: TripRequest; note: string } {
  const next = { ...req };
  const data = CITIES[next.city!];

  // 숙소를 더 저렴하게
  if (/(싼|저렴|아끼|줄여|낮춰)/.test(text) && /(숙소|호텔)/.test(text)) {
    data.hotels.reverse();
    return { request: next, note: "숙소를 더 저렴한 곳으로 바꿨습니다." };
  }

  // 일정 하루 늘리기
  if (/(하루|더|늘려|길게)/.test(text) && /(일정|날|박)/.test(text)) {
    const end = new Date(next.end!);
    end.setDate(end.getDate() + 1);
    next.end = end;
    return { request: next, note: "일정을 하루 늘려 다시 짰습니다." };
  }

  // 그 외에는 동선 순서를 다시 배치
  data.places.push(data.places.shift()!);
  return { request: next, note: "요청하신 내용을 반영해 동선을 다시 배치했습니다." };
}