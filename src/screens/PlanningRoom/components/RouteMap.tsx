import { useEffect, useMemo, useRef, useState } from "react";
import type { PlanDay } from "@/types/trip";
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

interface HotelPin {
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  days: PlanDay[];
  /** 좌표가 있으면 숙소를 기준점으로 삼아 숙소→방문지→숙소 동선을 그린다 */
  hotel?: HotelPin | null;
}

/** 숙소 좌표가 있으면 그 지점을 기준으로, 없으면 방문지 순서만으로 동선을 그린다 */
export default function RouteMap({ days, hotel }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
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
    if (!map) return;

    // 이전에 그린 것 지우기
    drawnRef.current.forEach((item) => item.setMap(null));
    drawnRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    // 숙소 마커 (좌표가 있을 때만)
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

    targetDays.forEach(({ day, index }) => {
      const color = DAY_COLORS[index % DAY_COLORS.length];
      const points = day.items.filter((item) => item.latitude != null && item.longitude != null);
      const path: google.maps.LatLngLiteral[] = hotelPos ? [hotelPos] : [];

      points.forEach((item, i) => {
        const pos = { lat: item.latitude!, lng: item.longitude! };
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

      // 숙소 기준일 때만 다시 숙소로 돌아온다
      if (hotelPos) path.push(hotelPos);

      if (path.length < 2) return;

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

    if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
  }, [days, activeDay, isLoading, hotelPos, hotel?.name]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p
          className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3"
          style={{ fontFamily: "Pretendard, sans-serif" }}
        >
          동선 지도 {hotelPos ? "· 숙소에서 출발해 다시 숙소로" : "· 방문 순서대로"}
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
