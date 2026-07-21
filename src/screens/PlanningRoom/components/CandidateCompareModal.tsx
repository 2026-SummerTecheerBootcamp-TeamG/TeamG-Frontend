import { useEffect, useMemo, useRef, useState } from "react";
import type { FlightCandidate, HotelCandidate } from "@/types/trip";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { formatWon } from "../lib/parseRequest";

/**
 * 항공/숙소 후보 비교 모달 (멘토 피드백: 채팅 말고도 직접 고를 수 있는 UI)
 *
 * 검색 당시 저장해 둔 후보 스냅샷을 카드로 펼쳐 보여주고,
 * 정렬(추천순/가격순)·필터(직항만)를 거쳐 [변경]을 누르면
 * 서버가 재검색 없이 재배분해 새 버전을 만든다 (부모의 onPick이 담당).
 *
 * 카드마다 "상세 정보 펼치기"(밑줄 텍스트) — 누르면 카드가 아래로 확장되며
 * 숙소는 사진·미니 지도·구글 평점/리뷰/전화/웹, 항공은 항공권 비주얼이 나온다.
 * 펼친 상태에서는 [변경] 버튼이 카드 하단 전체 폭으로 이동한다. (피드백 반영)
 * 가격은 검색 시점 기준 — 하단 안내 문구로 명시한다.
 */

type SortKey = "recommend" | "price";

interface Props {
  kind: "flight" | "hotel";
  flights: FlightCandidate[];
  hotels: HotelCandidate[];
  /** "ICN → FUK" — 항공 후보들의 공통 노선 (요청 단위라 후보마다 같음) */
  route: string | null;
  /** 변경 가능 여부 — 확정된 계획(결제 진입 상태)에서는 보기만 */
  canChange: boolean;
  /** 변경 요청이 진행 중인 후보 index (버튼 로딩 표시) */
  pickingIndex: number | null;
  onPick: (index: number) => void;
  onClose: () => void;
}

/** "2026-09-15 09:20" → "09:20" / "09/15" */
const clock = (raw: string | null) => raw?.split(" ")[1] ?? null;
const datePart = (raw: string | null) => {
  if (!raw) return null;
  const d = raw.split(" ")[0]?.split("-");
  return d && d.length === 3 ? `${d[1]}/${d[2]}` : null;
};

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간${m > 0 ? ` ${m}분` : ""}` : `${m}분`;
};

/* ───────── 항공 상세 (펼침 영역): 항공권 스타일 비주얼 ───────── */

function FlightCandidateDetail({ f, route }: { f: FlightCandidate; route: string | null }) {
  const [fromCode, toCode] = (route ?? "").split("→").map((s) => s.trim());
  return (
    <div className="rounded-xl bg-paper px-5 pb-7 pt-5">
      {datePart(f.departure_time) && (
        <p className="mb-4 text-center text-[12.5px] font-semibold text-ink-3">
          {datePart(f.departure_time)} 출발
        </p>
      )}
      <div className="flex items-center gap-4">
        <div className="shrink-0 text-center">
          <p className="text-[24px] font-extrabold tabular-nums tracking-[-0.02em]">
            {clock(f.departure_time) ?? "--:--"}
          </p>
          <p className="mt-1 text-[13px] font-extrabold tracking-[0.08em] text-ink-2">
            {fromCode || "출발"}
          </p>
        </div>
        {/* 가운데: 점선 항로 + 비행기 + 소요시간 */}
        <div className="relative min-w-0 flex-1">
          <div className="border-t-2 border-dashed border-line" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-2 text-[16px]">
            ✈️
          </span>
          {f.duration_min != null && (
            <p className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-semibold text-ink-3">
              {fmtDuration(f.duration_min)}
            </p>
          )}
        </div>
        <div className="shrink-0 text-center">
          <p className="text-[24px] font-extrabold tabular-nums tracking-[-0.02em]">
            {clock(f.arrival_time) ?? "--:--"}
          </p>
          <p className="mt-1 text-[13px] font-extrabold tracking-[0.08em] text-ink-2">
            {toCode || "도착"}
          </p>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap justify-center gap-1.5">
        {f.stops != null && (
          <span className="rounded-full bg-cobalt-soft px-3 py-1 text-[12px] font-bold text-cobalt">
            {f.stops === 0 ? "직항" : `경유 ${f.stops}회`}
          </span>
        )}
        <span className="rounded-full bg-cobalt-soft px-3 py-1 text-[12px] font-bold text-cobalt">
          왕복
        </span>
      </div>
    </div>
  );
}

/* ───────── 숙소 상세 (펼침 영역): 사진·미니 지도·구글 정보 ───────── */

/** 구글 Places에서 가져오는 부가 정보 묶음 (PlanDetailModal과 같은 구성) */
interface GooglePlaceInfo {
  rating?: number;
  total?: number;
  phone?: string;
  website?: string;
  reviews: { author: string; rating?: number; text: string }[];
}

function HotelCandidateDetail({ h }: { h: HotelCandidate }) {
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [gInfo, setGInfo] = useState<GooglePlaceInfo | null>(null);

  const goPhoto = (delta: number) => {
    setImgLoading(true);
    setPhotoIdx((i) => (i + delta + photos.length) % photos.length);
  };

  // 펼치는 순간 로드: 미니 지도 + 이름 검색 → place_id → 상세(사진/평점/리뷰/전화/웹)
  useEffect(() => {
    let cancelled = false;
    const donePhotos = () => {
      if (!cancelled) setPhotosLoading(false);
    };

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;

        if (mapBoxRef.current && h.latitude != null && h.longitude != null) {
          const center = { lat: h.latitude, lng: h.longitude };
          const map = new google.maps.Map(mapBoxRef.current, {
            center, zoom: 15, disableDefaultUI: true, zoomControl: true,
            clickableIcons: false,
          });
          new google.maps.Marker({ map, position: center, title: h.name });
        }

        const svc = new google.maps.places.PlacesService(document.createElement("div"));
        svc.textSearch(
          {
            query: h.name,
            location: h.latitude != null && h.longitude != null
              ? new google.maps.LatLng(h.latitude, h.longitude)
              : undefined,
            radius: 3000,
          },
          (results, status) => {
            if (cancelled || status !== google.maps.places.PlacesServiceStatus.OK) return donePhotos();
            const placeId = results?.[0]?.place_id;
            if (!placeId) return donePhotos();
            svc.getDetails(
              {
                placeId,
                fields: ["photos", "rating", "user_ratings_total",
                         "formatted_phone_number", "website", "reviews"],
              },
              (place, dStatus) => {
                donePhotos();
                if (cancelled || dStatus !== google.maps.places.PlacesServiceStatus.OK || !place) return;
                setPhotos(
                  (place.photos ?? []).slice(0, 8).map((p) =>
                    p.getUrl({ maxWidth: 1200, maxHeight: 800 }),
                  ),
                );
                setGInfo({
                  rating: place.rating,
                  total: place.user_ratings_total,
                  phone: place.formatted_phone_number,
                  website: place.website,
                  reviews: (place.reviews ?? []).slice(0, 2).map((r) => ({
                    author: r.author_name,
                    rating: r.rating ?? undefined,
                    text: (r.text ?? "").slice(0, 150),
                  })),
                });
              },
            );
          },
        );
      })
      .catch(donePhotos); // 지도/사진 실패해도 텍스트 정보만으로 유효

    return () => {
      cancelled = true;
    };
  }, [h]);

  return (
    <div>
      {/* 사진 가져오는 중 — 같은 크기 자리 박스 + 회전 스피너 */}
      {photosLoading && photos.length === 0 && (
        <div className="mb-3 grid h-[200px] place-items-center rounded-xl bg-line-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink/15 border-t-ink/50" />
        </div>
      )}

      {/* 사진 캐러셀 */}
      {photos.length > 0 && (
        <div className="relative mb-3 overflow-hidden rounded-xl bg-line-soft">
          <img
            key={photoIdx}
            src={photos[photoIdx]}
            alt={`${h.name} 사진 ${photoIdx + 1}`}
            onLoad={() => setImgLoading(false)}
            className="photo-swap h-[200px] w-full object-cover"
          />
          {imgLoading && (
            <div className="absolute inset-0 grid place-items-center bg-ink/30 backdrop-blur-[1px]">
              <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => goPhoto(-1)}
                className="absolute left-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-ink/80"
                aria-label="이전 사진"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => goPhoto(1)}
                className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-ink/80"
                aria-label="다음 사진"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="absolute bottom-2 right-2.5 rounded-md bg-ink/60 px-2 py-1 text-[10.5px] font-semibold tabular-nums tracking-[0.06em] text-white backdrop-blur">
                {photoIdx + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
      )}

      {/* 미니 지도 */}
      {h.latitude != null && (
        <div ref={mapBoxRef} className="mb-3 h-40 w-full rounded-xl bg-line-soft" />
      )}

      {/* 구글 정보 줄 */}
      <div className="space-y-1 text-[12.5px] text-ink-2">
        {gInfo?.rating != null && (
          <p>
            구글 <b className="text-amber">★ {gInfo.rating}</b>
            {gInfo.total != null && (
              <span className="text-ink-3"> · 리뷰 {gInfo.total.toLocaleString()}</span>
            )}
          </p>
        )}
        {gInfo?.phone && <p>전화 {gInfo.phone}</p>}
        {gInfo?.website && (
          <p>
            <a
              href={gInfo.website}
              target="_blank"
              rel="noreferrer"
              className="break-all text-cobalt hover:underline"
            >
              {new URL(gInfo.website).hostname}
            </a>
          </p>
        )}
      </div>

      {/* 방문자 리뷰 맛보기 */}
      {(gInfo?.reviews.length ?? 0) > 0 && (
        <div className="mt-2.5 space-y-2">
          {gInfo!.reviews.map((r, i) => (
            <blockquote
              key={i}
              className="rounded-lg bg-paper px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-2"
            >
              {r.rating != null && <span className="mr-1 text-amber">★ {r.rating}</span>}
              “{r.text}
              {r.text.length >= 150 ? "…" : ""}”
              <span className="ml-1 text-[11px] text-ink-3">— {r.author}</span>
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── 모달 본체 ───────── */

export default function CandidateCompareModal({
  kind, flights, hotels, route, canChange, pickingIndex, onPick, onClose,
}: Props) {
  const isFlight = kind === "flight";
  const [sort, setSort] = useState<SortKey>("recommend");
  /** 직항만 보기 (항공 전용 필터) */
  const [directOnly, setDirectOnly] = useState(false);
  /** 상세가 펼쳐진 후보 index (한 번에 하나 — 다른 카드를 펼치면 이전 것은 접힘) */
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  /** 모달이 떠 있는 동안 배경 스크롤 잠금 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /** 정렬·필터 적용된 목록 — useMemo: 기준이 바뀔 때만 다시 계산.
      추천순은 내부 utility 점수 기준 (점수 자체는 화면에 노출하지 않음 — 피드백) */
  const rows = useMemo(() => {
    const base: (FlightCandidate | HotelCandidate)[] = isFlight
      ? flights.filter((f) => !directOnly || f.stops === 0)
      : hotels;
    const sorted = [...base];
    if (sort === "price") sorted.sort((a, b) => a.price_krw - b.price_krw);
    else sorted.sort((a, b) => (b.utility ?? 0) - (a.utility ?? 0));
    return sorted;
  }, [isFlight, flights, hotels, sort, directOnly]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-ink/45 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[86vh] w-full max-w-[640px] flex-col rounded-card border border-line bg-white shadow-[0_24px_60px_-16px_rgba(15,20,24,.4)]"
        style={{ fontFamily: "Pretendard, sans-serif" }}
      >
        {/* 헤더: 제목 + 정렬/필터 컨트롤 */}
        <div className="border-b border-line px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-extrabold tracking-[-0.03em]">
                {isFlight ? "항공편" : "숙소"} 후보 비교
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-3">
                검색 시점 가격 기준 · 마음에 드는 후보로 바로 바꿀 수 있어요
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[17px] text-ink-3 transition-colors hover:bg-line-soft hover:text-ink"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(
              [["recommend", "추천순"], ["price", "가격 낮은순"]] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                  sort === key
                    ? "bg-ink text-white"
                    : "border border-line text-ink-2 hover:border-ink-3"
                }`}
              >
                {label}
              </button>
            ))}
            {isFlight && (
              <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-ink-2">
                <input
                  type="checkbox"
                  checked={directOnly}
                  onChange={(e) => setDirectOnly(e.target.checked)}
                  className="accent-cobalt"
                />
                직항만
              </label>
            )}
            <span className="ml-auto text-[11.5px] text-ink-3">{rows.length}개</span>
          </div>
        </div>

        {/* 후보 목록 (스크롤 영역) */}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4">
          {rows.length === 0 && (
            <p className="py-8 text-center text-[13px] text-ink-3">
              조건에 맞는 후보가 없어요. 필터를 풀어보세요.
            </p>
          )}

          {rows.map((row) => {
            const f = isFlight ? (row as FlightCandidate) : null;
            const h = !isFlight ? (row as HotelCandidate) : null;
            const name = f ? f.airline : h!.name;
            const busy = pickingIndex === row.index;
            const expanded = expandedIndex === row.index;

            /** [변경] 버튼 — 접힘: 오른쪽 / 펼침: 카드 하단 전체 폭 (피드백) */
            const changeButton = canChange && !row.selected && (
              <button
                onClick={() => onPick(row.index)}
                disabled={pickingIndex !== null}
                className={`shrink-0 whitespace-nowrap rounded-field bg-cobalt text-[13px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(39,67,224,.5)] transition-all hover:-translate-y-px hover:bg-[#1c36c4] disabled:opacity-50 disabled:hover:translate-y-0 ${
                  expanded ? "mt-3 w-full py-3" : "px-4 py-2.5"
                }`}
              >
                {busy ? "변경 중..." : "변경"}
              </button>
            );

            return (
              <div
                key={row.index}
                className={`rounded-field border p-4 ${
                  row.selected ? "border-cobalt bg-cobalt-soft/30" : "border-line bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] font-bold tracking-[-0.02em]">
                        {name}
                      </span>
                      {row.selected && (
                        <span className="shrink-0 rounded-md bg-cobalt px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                          현재 선택
                        </span>
                      )}
                    </p>
                    {/* 핵심 조건 한 줄: 항공 = 시간·소요·직항 / 숙소 = 주소 */}
                    <p className="mt-1 text-[12px] text-ink-2">
                      {f && (
                        <>
                          {clock(f.departure_time) && (
                            <b className="tabular-nums">{clock(f.departure_time)}</b>
                          )}
                          {clock(f.arrival_time) && (
                            <> → <b className="tabular-nums">{clock(f.arrival_time)}</b></>
                          )}
                          {f.duration_min != null && ` · ${fmtDuration(f.duration_min)}`}
                          {f.stops != null &&
                            ` · ${f.stops === 0 ? "직항" : `경유 ${f.stops}회`}`}
                        </>
                      )}
                      {h?.address && <span className="text-ink-3">{h.address}</span>}
                    </p>
                    {/* 예산 초과 예고 — 변경은 막지 않되(사용자 자유) 결과를 미리 알림.
                        산식은 서버가 배분 엔진과 동일하게 계산한 over_budget 플래그 */}
                    {row.over_budget && !row.selected && (
                      <p className="mt-1 text-[11.5px] font-semibold text-stamp">
                        ⚠ 이 후보로 변경하면 예산을 초과해요
                      </p>
                    )}
                    {/* 상세 펼치기/접기 — 밑줄 텍스트 + 방향 화살표 (피드백 명세) */}
                    <button
                      onClick={() =>
                        setExpandedIndex(expanded ? null : row.index)
                      }
                      className="mt-1.5 text-[12px] font-semibold text-ink-3 underline underline-offset-2 transition-colors hover:text-ink"
                    >
                      {expanded ? "접기 ▲" : "상세 정보 펼치기 ▼"}
                    </button>
                  </div>

                  <p className="shrink-0 whitespace-nowrap text-right text-[16px] font-extrabold tracking-[-0.02em]">
                    {formatWon(row.price_krw)}원
                  </p>

                  {!expanded && changeButton}
                </div>

                {/* 펼침 영역 — 카드가 아래로 확장 */}
                {expanded && (
                  <div className="mt-3 border-t border-line-soft pt-3">
                    {f ? (
                      <FlightCandidateDetail f={f} route={route} />
                    ) : (
                      <HotelCandidateDetail h={h!} />
                    )}
                    {changeButton}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="border-t border-line-soft px-6 py-3 text-[11.5px] text-ink-3">
          가격·좌석은 검색 시점 기준이라 실제 결제 시점과 다를 수 있어요. 변경하면
          예산 배분이 자동으로 다시 계산됩니다.
        </p>
      </div>
    </div>
  );
}
