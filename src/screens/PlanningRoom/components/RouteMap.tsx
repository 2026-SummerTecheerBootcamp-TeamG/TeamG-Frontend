import { useEffect, useRef, useState } from "react";
import type { Plan } from "@/types/trip";
import { loadGoogleMaps } from "@/lib/googleMaps";

/** DAY별 색 (일정 타임라인과 맞춘다) */
const DAY_COLORS = [
  "#2743E0",
  "#0E9A82",
  "#E29327",
  "#7A5AF0",
  "#D8402F",
  "#1F8FD8",
];

interface Props {
  plan: Plan;
}

/** 숙소에서 출발해 방문지를 돌고 다시 숙소로 오는 하루 동선 */
export default function RouteMap({ plan }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  /** 지도에 올린 마커·선을 지우려고 들고 있는다 */
  const drawnRef = useRef<(google.maps.Marker | google.maps.Polyline)[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  /** null이면 전체 보기 */
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 지도 초기화
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !boxRef.current) return;

        mapRef.current = new google.maps.Map(boxRef.current, {
          center: { lat: plan.hotel.lat, lng: plan.hotel.lng },
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        infoRef.current = new google.maps.InfoWindow();
        setIsLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [plan.hotel.lat, plan.hotel.lng]);

  // 마커·경로 그리기 (날짜 필터가 바뀔 때마다 다시 그린다)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 이전에 그린 것 지우기
    drawnRef.current.forEach((item) => item.setMap(null));
    drawnRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const hotelPos = { lat: plan.hotel.lat, lng: plan.hotel.lng };
    bounds.extend(hotelPos);

    // 숙소 마커
    const hotelMarker = new google.maps.Marker({
      position: hotelPos,
      map,
      title: plan.hotel.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#0F1418",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
      zIndex: 100,
    });
    hotelMarker.addListener("click", () => {
      infoRef.current?.setContent(
        `<div style="font-family:Pretendard,sans-serif;padding:2px 4px">
          <strong style="font-size:13px">${plan.hotel.name}</strong>
          <p style="margin:4px 0 0;font-size:12px;color:#57626C">숙소 · ${plan.hotel.area}</p>
        </div>`,
      );
      infoRef.current?.open(map, hotelMarker);
    });
    drawnRef.current.push(hotelMarker);

    // 보여줄 날짜만 고른다
    const targetDays = plan.days
      .map((day, index) => ({ day, index }))
      .filter(({ index }) => activeDay === null || index === activeDay);

    targetDays.forEach(({ day, index }) => {
      const color = DAY_COLORS[index % DAY_COLORS.length];
      const path: google.maps.LatLngLiteral[] = [hotelPos];

      day.items.forEach((item, i) => {
        const pos = { lat: item.lat, lng: item.lng };
        path.push(pos);
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map,
          label: {
            text: String(i + 1),
            color,
            fontSize: "11px",
            fontWeight: "700",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FFFFFF",
            fillOpacity: 1,
            strokeColor: color,
            strokeWeight: 2,
          },
        });

        marker.addListener("click", () => {
          infoRef.current?.setContent(
            `<div style="font-family:Pretendard,sans-serif;padding:2px 4px">
              <strong style="font-size:13px">${item.placeName}</strong>
              <p style="margin:4px 0 0;font-size:12px;color:#57626C">
                DAY ${index + 1} · ${item.arriveAt} 도착 · ${item.stayMinutes}분
              </p>
            </div>`,
          );
          infoRef.current?.open(map, marker);
        });

        drawnRef.current.push(marker);
      });

      // 다시 숙소로 돌아온다
      path.push(hotelPos);

      const line = new google.maps.Polyline({
        path,
        map,
        strokeColor: color,
        strokeOpacity: 0,
        // 점선
        icons: [
          {
            icon: {
              path: "M 0,-1 0,1",
              strokeOpacity: activeDay === null ? 0.75 : 1,
              strokeWeight: 2,
              scale: 2,
            },
            offset: "0",
            repeat: "10px",
          },
        ],
      });
      drawnRef.current.push(line);
    });

    map.fitBounds(bounds, 48);
  }, [plan, activeDay, isLoading]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
          동선 지도 · 숙소에서 출발해 다시 숙소로
        </p>

        <div className="ml-auto flex flex-wrap gap-1.5">
          {[null, ...plan.days.map((_, i) => i)].map((d) => (
            <button
              key={d ?? "all"}
              onClick={() => setActiveDay(d)}
              className={`rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold transition-colors ${
                activeDay === d
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-2 hover:border-ink-3"
              }`}
            >
              {d === null ? "전체" : `DAY ${d + 1}`}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[320px] overflow-hidden rounded-xl border border-line bg-[#f2f5f7]">
        <div ref={boxRef} className="h-full w-full" />

        {(isLoading || error) && (
          <div className="absolute inset-0 grid place-items-center bg-[#f2f5f7] px-6 text-center text-[13px] text-ink-3">
            {error ? (
              <div>
                <p className="mb-1 font-semibold text-stamp">
                  지도를 불러오지 못했습니다
                </p>
                <p>{error}</p>
              </div>
            ) : (
              "지도를 불러오는 중..."
            )}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-ink-3">
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-ink" />
          숙소
        </span>
        {plan.days.map((_, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <i
              className="h-2 w-2 rounded-full"
              style={{ background: DAY_COLORS[i % DAY_COLORS.length] }}
            />
            DAY {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}