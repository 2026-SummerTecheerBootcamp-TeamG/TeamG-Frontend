import { useEffect, useRef, useState } from "react";
import type { PlanFlight, PlanHotel, PlanPayment } from "@/types/trip";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { formatWon } from "../lib/parseRequest";

/**
 * 항공/숙소 상세 모달 — 외부 링크 대신 서비스 안에서 정보를 소비한다.
 * 숙소: 사진 캐러셀(넘겨보기) + 미니 지도 + 구글 평점·리뷰·전화·웹사이트
 * 항공: 노선/시간/소요 정보
 * 하단에 결제 버튼 — 패널의 결제하기도 이 모달을 거친다 (정보 확인 → 결제 한 흐름)
 */

interface Props {
  target: "hotel" | "flight";
  hotel: PlanHotel | null;
  flight: PlanFlight | null;
  nights: number;
  pax: number | null;
  hotelPriceKrw: number;
  flightPriceKrw: number;
  payment: PlanPayment | null;         // 숙소 결제 완료 건
  flightPayment: PlanPayment | null;   // 항공 결제 완료 건
  issuedPnr: string | null;            // 발권 완료 PNR
  hotelConfirmation: string | null;    // 숙소 예약 확정 번호
  payingTarget: "hotel" | "flight" | null;
  payError: string | null;
  confirmed: boolean;                  // 확정된 계획에서만 결제 버튼 노출
  onPay: (target: "hotel" | "flight") => void;
  onClose: () => void;
}

/** "2026-10-03 09:20" → "10/03" */
const datePart = (raw: string | null) => {
  if (!raw) return null;
  const d = raw.split(" ")[0]?.split("-");
  return d && d.length === 3 ? `${d[1]}/${d[2]}` : null;
};
const clockPart = (raw: string | null) => raw?.split(" ")[1] ?? null;

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간${m > 0 ? ` ${m}분` : ""}` : `${m}분`;
};

/** 라벨-값 한 줄 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-line-soft py-2.5 text-[13.5px]">
      <span className="w-[76px] shrink-0 pt-0.5 text-[11.5px] tracking-[0.04em] text-ink-3">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-keep font-semibold tracking-[-0.015em]">
        {children}
      </span>
    </div>
  );
}

/** 구글 Places에서 가져오는 부가 정보 묶음 */
interface GooglePlaceInfo {
  rating?: number;
  total?: number;
  phone?: string;
  website?: string;
  reviews: { author: string; rating?: number; text: string }[];
}

export default function PlanDetailModal({
  target, hotel, flight, nights, pax, hotelPriceKrw, flightPriceKrw,
  payment, flightPayment, issuedPnr, hotelConfirmation,
  payingTarget, payError, confirmed, onPay, onClose,
}: Props) {
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  /** 다음 사진이 아직 로딩 중인지 — 이전 사진 위에 스피너 오버레이 표시 */
  const [imgLoading, setImgLoading] = useState(true);
  /** 사진 목록을 구글에서 가져오는 중 — 자리 박스에 회전 스피너 표시.
      (이전엔 로딩 중 아무것도 없다가 사진이 불쑥 나타났음 — 피드백 반영) */
  const [photosLoading, setPhotosLoading] = useState(false);
  const [gInfo, setGInfo] = useState<GooglePlaceInfo | null>(null);

  /** 모달이 떠 있는 동안 배경 페이지 스크롤 잠금 (배경이 스크롤되던 현상 — 피드백) */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /** 사진 넘기기 — 로딩 표시를 켜고 인덱스 이동 (onLoad에서 꺼짐) */
  const goPhoto = (delta: number) => {
    setImgLoading(true);
    setPhotoIdx((i) => (i + delta + photos.length) % photos.length);
  };

  // 숙소 모달이 열리면: 미니 지도 + 구글 상세 정보(사진/평점/리뷰/전화/웹) 로드
  useEffect(() => {
    if (target !== "hotel" || !hotel) return;
    let cancelled = false;
    setPhotos([]);
    setPhotoIdx(0);
    setGInfo(null);
    setPhotosLoading(true);
    /** 어떤 경로로 끝나든(성공/결과 없음/실패) 스피너를 내리는 단일 종료점 */
    const donePhotos = () => {
      if (!cancelled) setPhotosLoading(false);
    };

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;

        // ① 미니 지도
        if (mapBoxRef.current && hotel.latitude != null && hotel.longitude != null) {
          const center = { lat: hotel.latitude, lng: hotel.longitude };
          const map = new google.maps.Map(mapBoxRef.current, {
            center, zoom: 15, disableDefaultUI: true, zoomControl: true,
            clickableIcons: false,
          });
          new google.maps.Marker({ map, position: center, title: hotel.name });
        }

        // ② 이름으로 장소를 찾고(place_id) → 상세 정보 조회 (사진 여러 장, 리뷰 등)
        const svc = new google.maps.places.PlacesService(document.createElement("div"));
        svc.textSearch(
          {
            query: hotel.name,
            location: hotel.latitude != null && hotel.longitude != null
              ? new google.maps.LatLng(hotel.latitude, hotel.longitude)
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
      .catch(() => {
        // 지도/사진을 못 불러와도 텍스트 정보만으로 모달은 유효
        donePhotos();
      });

    return () => {
      cancelled = true;
    };
  }, [target, hotel]);

  const isHotel = target === "hotel";
  const paid = isHotel ? payment : flightPayment;
  const priceKrw = isHotel ? hotelPriceKrw : flightPriceKrw;
  const externalUrl = isHotel ? hotel?.booking_url : flight?.booking_url;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-ink/45 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[680px] overflow-hidden rounded-card border border-line bg-white shadow-[0_24px_60px_-16px_rgba(15,20,24,.4)]"
        style={{ fontFamily: "Pretendard, sans-serif" }}
      >
      <div className="max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-white/95 px-7 pb-4 pt-5 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
              {isHotel ? "숙소 상세" : "항공 상세"}
            </p>
            <h3 className="mt-1 break-keep text-[21px] font-extrabold leading-snug tracking-[-0.03em]">
              {isHotel ? hotel?.name : flight?.airline}
            </h3>
            <p className="mt-0.5 flex items-center gap-2 text-[12.5px]">
              {isHotel && hotel?.stars != null && (
                <span className="tracking-[0.1em] text-amber">
                  {"★".repeat(hotel.stars)}
                  {"☆".repeat(Math.max(0, 5 - hotel.stars))}
                </span>
              )}
              {isHotel && gInfo?.rating != null && (
                <span className="text-ink-2">
                  구글 <b className="text-amber">★ {gInfo.rating}</b>
                  {gInfo.total != null && (
                    <span className="text-ink-3"> · 리뷰 {gInfo.total.toLocaleString()}</span>
                  )}
                </span>
              )}
              {!isHotel && flight?.route && (
                <span className="text-[13.5px] font-bold tracking-[0.04em] text-ink-2">
                  {flight.route} (왕복)
                </span>
              )}
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

        <div className="px-7 py-5">
          {isHotel && hotel && (
            <>
              {/* 사진 가져오는 중 — 같은 크기의 자리 박스에 회전 스피너 (레이아웃 점프 방지) */}
              {photosLoading && photos.length === 0 && (
                <div className="mb-4 grid h-[280px] place-items-center rounded-xl bg-line-soft">
                  <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-ink/15 border-t-ink/50" />
                </div>
              )}

              {/* 사진 캐러셀 — 좌우 버튼으로 넘겨보기 */}
              {photos.length > 0 && (
                <div className="relative mb-4 overflow-hidden rounded-xl bg-line-soft">
                  {/* key=photoIdx: 사진이 바뀔 때마다 새로 마운트 → 전환 애니메이션 재생 */}
                  <img
                    key={photoIdx}
                    src={photos[photoIdx]}
                    alt={`${hotel.name} 사진 ${photoIdx + 1}`}
                    onLoad={() => setImgLoading(false)}
                    className="photo-swap h-[280px] w-full object-cover"
                  />
                  {/* 다음 사진 로딩 중 오버레이 — 회색 반투명 + 흰 스피너 */}
                  {imgLoading && (
                    <div className="absolute inset-0 grid place-items-center bg-ink/30 backdrop-blur-[1px]">
                      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
                    </div>
                  )}
                  {photos.length > 1 && (
                    <>
                      {/* 화살표: SVG — 굵고 크게, 원 정중앙 정렬 */}
                      <button
                        onClick={() => goPhoto(-1)}
                        className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-ink/80"
                        aria-label="이전 사진"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => goPhoto(1)}
                        className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-ink/80"
                        aria-label="다음 사진"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <span className="absolute bottom-2.5 right-3 rounded-md bg-ink/60 px-2 py-1 text-[11px] font-semibold tabular-nums tracking-[0.06em] text-white backdrop-blur">
                        {photoIdx + 1} / {photos.length}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 미니 지도 */}
              {hotel.latitude != null && (
                <div ref={mapBoxRef} className="mb-4 h-48 w-full rounded-xl bg-line-soft" />
              )}

              {hotel.address && <Row label="주소">{hotel.address}</Row>}
              <Row label="숙박">
                {nights > 0 && `${nights}박`}
                {pax !== null && ` · 트윈 ${Math.ceil(pax / 2)}실 · ${pax}명`}
              </Row>
              {nights > 0 && (
                <Row label="1박 요금">{formatWon(Math.round(hotel.price_krw / nights))}원</Row>
              )}
              {gInfo?.phone && <Row label="전화">{gInfo.phone}</Row>}
              {gInfo?.website && (
                <Row label="웹사이트">
                  <a
                    href={gInfo.website}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-cobalt hover:underline"
                  >
                    {new URL(gInfo.website).hostname}
                  </a>
                </Row>
              )}

              {/* 구글 리뷰 맛보기 */}
              {(gInfo?.reviews.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-[11.5px] tracking-[0.04em] text-ink-3">방문자 리뷰</p>
                  <div className="space-y-2">
                    {gInfo!.reviews.map((r, i) => (
                      <blockquote
                        key={i}
                        className="rounded-lg bg-paper px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2"
                      >
                        {r.rating != null && <span className="mr-1 text-amber">★ {r.rating}</span>}
                        “{r.text}
                        {r.text.length >= 150 ? "…" : ""}”
                        <span className="ml-1 text-[11px] text-ink-3">— {r.author}</span>
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!isHotel && flight && (() => {
            // "ICN → DAD" 형태의 노선을 출발/도착 코드로 분리 (없으면 일반 표기)
            const [fromCode, toCode] = (flight.route ?? "")
              .split("→")
              .map((s) => s.trim());
            return (
              <>
                {/* 항공권 스타일 비주얼 — 표 대신 한눈에 보이는 구성 */}
                <div className="mb-3 rounded-xl bg-paper px-5 pb-7 pt-5">
                  {datePart(flight.departure_time) && (
                    <p className="mb-4 text-center text-[12.5px] font-semibold text-ink-3">
                      {datePart(flight.departure_time)} 출발
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 text-center">
                      <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
                        {clockPart(flight.departure_time) ?? "--:--"}
                      </p>
                      <p className="mt-1 text-[14px] font-extrabold tracking-[0.08em] text-ink-2">
                        {fromCode || "출발"}
                      </p>
                    </div>
                    {/* 가운데: 점선 항로 + 비행기 + 소요시간 */}
                    <div className="relative min-w-0 flex-1">
                      <div className="border-t-2 border-dashed border-line" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-2 text-[17px]">
                        ✈️
                      </span>
                      {flight.duration_min != null && (
                        <p className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-semibold text-ink-3">
                          {fmtDuration(flight.duration_min)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
                        {clockPart(flight.arrival_time) ?? "--:--"}
                      </p>
                      <p className="mt-1 text-[14px] font-extrabold tracking-[0.08em] text-ink-2">
                        {toCode || "도착"}
                      </p>
                    </div>
                  </div>
                  {/* 핵심 조건은 칩으로 */}
                  <div className="mt-7 flex flex-wrap justify-center gap-1.5">
                    {flight.stops != null && (
                      <span className="rounded-full bg-cobalt-soft px-3 py-1 text-[12px] font-bold text-cobalt">
                        {flight.stops === 0 ? "직항" : `경유 ${flight.stops}회`}
                      </span>
                    )}
                    <span className="rounded-full bg-cobalt-soft px-3 py-1 text-[12px] font-bold text-cobalt">
                      왕복
                    </span>
                    {pax !== null && (
                      <span className="rounded-full bg-cobalt-soft px-3 py-1 text-[12px] font-bold text-cobalt">
                        성인 {pax}명
                      </span>
                    )}
                  </div>
                </div>

                {/* 오는 편(귀국편) — 실제 조회에 성공했을 때만 표시 (구버전 플랜/조회
                    실패 시 둘 다 null이라 자연히 숨겨짐) */}
                {(flight.return_departure_time || flight.return_arrival_time) && (
                  <div className="mb-3 rounded-xl bg-paper px-5 pb-7 pt-5">
                    <p className="mb-4 text-center text-[12.5px] font-semibold text-ink-3">
                      귀국
                      {datePart(flight.return_departure_time) &&
                        ` · ${datePart(flight.return_departure_time)} 출발`}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 text-center">
                        <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
                          {clockPart(flight.return_departure_time) ?? "--:--"}
                        </p>
                        <p className="mt-1 text-[14px] font-extrabold tracking-[0.08em] text-ink-2">
                          {toCode || "출발"}
                        </p>
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <div className="border-t-2 border-dashed border-line" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-2 text-[17px]">
                          ✈️
                        </span>
                      </div>
                      <div className="shrink-0 text-center">
                        <p className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
                          {clockPart(flight.return_arrival_time) ?? "--:--"}
                        </p>
                        <p className="mt-1 text-[14px] font-extrabold tracking-[0.08em] text-ink-2">
                          {fromCode || "도착"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="rounded-lg bg-paper px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-3">
                  ✈️ 결제가 완료되면 발권이 자동으로 진행되고 예약번호(PNR)가 발급됩니다.
                </p>
              </>
            );
          })()}

          {/* 금액 + 결제 — 모달이 결제의 단일 입구 */}
          <div className="mt-4 flex items-center justify-between rounded-field bg-paper px-4 py-3.5">
            <span className="text-[13px] text-ink-2">총 금액</span>
            <span className="text-[22px] font-extrabold tracking-[-0.02em]">
              {formatWon(priceKrw)}원
            </span>
          </div>

          {confirmed && (
            <div className="mt-3">
              {paid ? (
                <div className="rounded-field bg-teal/5 px-4 py-3.5 text-[13.5px] leading-relaxed">
                  <p className="font-semibold text-teal">✓ 결제 완료</p>
                  {isHotel && hotelConfirmation && (
                    <p className="text-ink-2">예약 확정 · 확인번호 {hotelConfirmation}</p>
                  )}
                  {!isHotel && issuedPnr && (
                    <p className="text-ink-2">발권 완료 · 예약번호(PNR) {issuedPnr}</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onPay(target)}
                  disabled={payingTarget !== null}
                  className="w-full rounded-field bg-cobalt py-3.5 text-[15px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(39,67,224,.6)] transition-colors hover:bg-[#1c36c4] disabled:opacity-60"
                >
                  {payingTarget === target ? "결제창 여는 중..." : "결제하기"}
                </button>
              )}
              {payError && <p className="mt-2 text-[12.5px] text-stamp">{payError}</p>}
            </div>
          )}
          {!confirmed && (
            <p className="mt-3 text-center text-[12.5px] text-ink-3">
              계획을 확정하면 여기서 바로 결제할 수 있어요.
            </p>
          )}

          {/* 외부 링크는 보조 수단으로만 (작게) */}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block pb-1 text-center text-[11.5px] text-ink-3 hover:text-ink hover:underline"
            >
              구글에서도 보기 →
            </a>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
