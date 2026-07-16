import { useEffect, useMemo, useRef, useState } from "react";
import type { PlanDay } from "@/types/trip";
import { loadGoogleMaps } from "@/lib/googleMaps";

/** DAY별 색 (일정 타임라인과 맞춘다) — 선명하게 */
const DAY_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
];

/** 핀 모양 마커 경로 (끝 0,0이 실제 위치, 원형 머리 중심은 0,-18) */
const PIN_PATH =
  "M 0,0 C -2,-2 -10,-10 -10,-18 A 10,10 0 1 1 10,-18 C 10,-10 2,-2 0,0 Z";
const PIN_LABEL_ORIGIN_Y = -18;

interface HotelPin {
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  days: PlanDay[];
  /** 좌표가 있으면 지도 위에 숙소 위치를 별도 마커로 표시한다 (동선에는 포함하지 않음) */
  hotel?: HotelPin | null;
}

/** 두 지점 이상을 실제 도보 경로로 잇는다. 경로를 찾지 못하면 직선을 그대로 반환한다 */
function fetchRoutePath(
  service: google.maps.DirectionsService,
  points: google.maps.LatLngLiteral[],
): Promise<google.maps.LatLngLiteral[]> {
  if (points.length < 2) return Promise.resolve(points);

  const origin = points[0];
  const destination = points[points.length - 1];
  const waypoints = points.slice(1, -1).map((location) => ({ location, stopover: true }));

  return new Promise((resolve) => {
    service.route(
      { origin, destination, waypoints, travelMode: google.maps.TravelMode.WALKING },
      (result, status) => {
        const overview = result?.routes[0]?.overview_path;
        if (status === google.maps.DirectionsStatus.OK && overview && overview.length > 0) {
          resolve(overview.map((p) => ({ lat: p.lat(), lng: p.lng() })));
        } else {
          resolve(points);
        }
      },
    );
  });
}

/** 숙소는 별도 지점으로 표시하고, 방문지끼리는 실제 도보 경로를 따라 잇는다 */
export default function RouteMap({ days, hotel }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  /** 지도에 올린 마커·선을 지우려고 들고 있는다 */
  const drawnRef = useRef<(google.maps.Marker | google.maps.Polyline)[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  /** null이면 전체 보기 */
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const hotelLat = hotel?.latitude ?? null;
  const hotelLng = hotel?.longitude ?? null;
  const hotelPos = useMemo(
    () => (hotelLat != null && hotelLng != null ? { lat: hotelLat, lng: hotelLng } : null),
    [hotelLat, hotelLng],
  );

  const allPoints = [
    ...(hotelPos ? [hotelPos] : []),
    ...days.flatMap((day) =>
      day.items
        .filter((item) => item.latitude != null && item.longitude != null)
        .map((item) => ({ lat: item.latitude!, lng: item.longitude! })),
    ),
  ];

  // 지도 초기화
  useEffect(() => {
    let cancelled = false;
    if (allPoints.length === 0) return;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !boxRef.current) return;

        mapRef.current = new google.maps.Map(boxRef.current, {
          center: allPoints[0],
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        infoRef.current = new google.maps.InfoWindow();
        directionsServiceRef.current = new google.maps.DirectionsService();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마커·경로 그리기 (날짜 필터가 바뀔 때마다 다시 그린다)
  useEffect(() => {
    const map = mapRef.current;
    const directionsService = directionsServiceRef.current;
    if (!map || !directionsService) return;

    let cancelled = false;

    const draw = async () => {
      // 이전에 그린 것 지우기
      drawnRef.current.forEach((item) => item.setMap(null));
      drawnRef.current = [];

      const bounds = new google.maps.LatLngBounds();

      // 숙소 마커 (좌표가 있을 때만) — 동선에는 포함하지 않고 위치만 표시
      if (hotelPos) {
        bounds.extend(hotelPos);
        const hotelMarker = new google.maps.Marker({
          position: hotelPos,
          map,
          title: hotel?.name,
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
              <strong style="font-size:13px">${hotel?.name ?? "숙소"}</strong>
              <p style="margin:4px 0 0;font-size:12px;color:#57626C">숙소</p>
            </div>`,
          );
          infoRef.current?.open(map, hotelMarker);
        });
        drawnRef.current.push(hotelMarker);
      }

      // 보여줄 날짜만 고른다
      const targetDays = days
        .map((day, index) => ({ day, index }))
        .filter(({ index }) => activeDay === null || index === activeDay);

      for (const { day, index } of targetDays) {
        const color = DAY_COLORS[index % DAY_COLORS.length];
        const points = day.items.filter((item) => item.latitude != null && item.longitude != null);

        points.forEach((item, i) => {
          const pos = { lat: item.latitude!, lng: item.longitude! };
          bounds.extend(pos);

          const marker = new google.maps.Marker({
            position: pos,
            map,
            zIndex: 50,
            label: {
              text: String(i + 1),
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "700",
            },
            icon: {
              path: PIN_PATH,
              scale: 1.7,
              anchor: new google.maps.Point(0, 0),
              labelOrigin: new google.maps.Point(0, PIN_LABEL_ORIGIN_Y),
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          });

          marker.addListener("click", () => {
            const transit =
              item.travel_min_to_next != null
                ? `다음 장소까지 ${item.travel_min_to_next}분`
                : "";
            infoRef.current?.setContent(
              `<div style="font-family:Pretendard,sans-serif;padding:2px 4px">
                <strong style="font-size:13px">${item.place_name}</strong>
                <p style="margin:4px 0 0;font-size:12px;color:#57626C">
                  DAY ${index + 1} · 방문 순서 ${item.visit_order}${transit ? ` · ${transit}` : ""}
                </p>
              </div>`,
            );
            infoRef.current?.open(map, marker);
          });

          drawnRef.current.push(marker);
        });

        if (points.length < 2) continue;

        // 방문지끼리만 실제 도보 경로로 잇는다 (숙소는 별도 지점)
        const straight = points.map((item) => ({ lat: item.latitude!, lng: item.longitude! }));
        const routedPath = await fetchRoutePath(directionsService, straight);
        if (cancelled) return;

        const line = new google.maps.Polyline({
          path: routedPath,
          map,
          strokeColor: color,
          strokeOpacity: activeDay === null ? 0.85 : 1,
          strokeWeight: 5,
        });
        drawnRef.current.push(line);
      }

      if (!cancelled && !bounds.isEmpty()) map.fitBounds(bounds, 48);
    };

    draw();

    return () => {
      cancelled = true;
    };
  }, [days, activeDay, isLoading, hotelPos, hotel?.name]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p
          className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3"
          style={{ fontFamily: "Pretendard, sans-serif" }}
        >
          동선 지도 · 실제 이동 경로 기준
        </p>

        <div className="ml-auto flex flex-wrap gap-1.5">
          {[null, ...days.map((_, i) => i)].map((d) => (
            <button
              key={d ?? "all"}
              onClick={() => setActiveDay(d)}
              style={{ fontFamily: "Pretendard, sans-serif" }}
              className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
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

        {(isLoading || error || allPoints.length === 0) && (
          <div className="absolute inset-0 grid place-items-center bg-[#f2f5f7] px-6 text-center text-[13px] text-ink-3">
            {error ? (
              <div>
                <p className="mb-1 font-semibold text-stamp">
                  지도를 불러오지 못했습니다
                </p>
                <p>{error}</p>
              </div>
            ) : allPoints.length === 0 ? (
              "위치 정보가 있는 일정이 없습니다"
            ) : (
              "지도를 불러오는 중..."
            )}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-ink-3">
        {hotelPos && (
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-ink" />
            숙소
          </span>
        )}
        {days.map((_, i) => (
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
