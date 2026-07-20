import { useEffect, useMemo, useState } from "react";
import type { FlightCandidate, HotelCandidate } from "@/types/trip";
import { formatWon } from "../lib/parseRequest";

/**
 * 항공/숙소 후보 비교 모달 (멘토 피드백: 채팅 말고도 직접 고를 수 있는 UI)
 *
 * 검색 당시 저장해 둔 후보 스냅샷을 표로 펼쳐 보여주고,
 * 정렬(추천순/가격순)·필터(직항만)를 거쳐 [이걸로 변경]을 누르면
 * 서버가 재검색 없이 재배분해 새 버전을 만든다 (부모의 onPick이 담당).
 * 가격은 검색 시점 기준 — 하단 안내 문구로 명시한다.
 */

type SortKey = "recommend" | "price";

interface Props {
  kind: "flight" | "hotel";
  flights: FlightCandidate[];
  hotels: HotelCandidate[];
  /** 변경 가능 여부 — 확정된 계획(결제 진입 상태)에서는 보기만 */
  canChange: boolean;
  /** 변경 요청이 진행 중인 후보 index (버튼 로딩 표시) */
  pickingIndex: number | null;
  onPick: (index: number) => void;
  onClose: () => void;
}

/** "2026-09-15 09:20" → "09:20" */
const clock = (raw: string | null) => raw?.split(" ")[1] ?? null;

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간${m > 0 ? ` ${m}분` : ""}` : `${m}분`;
};

export default function CandidateCompareModal({
  kind, flights, hotels, canChange, pickingIndex, onPick, onClose,
}: Props) {
  const isFlight = kind === "flight";
  const [sort, setSort] = useState<SortKey>("recommend");
  /** 직항만 보기 (항공 전용 필터) */
  const [directOnly, setDirectOnly] = useState(false);

  /** 모달이 떠 있는 동안 배경 스크롤 잠금 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /** 정렬·필터 적용된 목록 — useMemo: 정렬 기준이 바뀔 때만 다시 계산 */
  const rows = useMemo(() => {
    const base: (FlightCandidate | HotelCandidate)[] = isFlight
      ? flights.filter((f) => !directOnly || f.stops === 0)
      : hotels;
    const sorted = [...base];
    if (sort === "price") sorted.sort((a, b) => a.price_krw - b.price_krw);
    else sorted.sort((a, b) => (b.utility ?? 0) - (a.utility ?? 0)); // 추천 = 만족도순
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
            {/* 정렬 토글 — 추천(만족도) / 가격 */}
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
            const reasons = row.utility_reasons ?? [];
            const busy = pickingIndex === row.index;

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
                    {/* 핵심 조건 한 줄: 항공 = 시간·소요·직항 / 숙소 = 성급·주소 */}
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
                      {h && (
                        <>
                          {h.stars != null && (
                            <span className="text-amber">{"★".repeat(h.stars)}</span>
                          )}
                          {h.address && (
                            <span className="text-ink-3"> {h.address}</span>
                          )}
                        </>
                      )}
                    </p>
                    {/* 만족도 근거 칩 — "왜 추천인지"를 눈으로 보여준다 */}
                    {reasons.length > 0 && (
                      <p className="mt-1.5 flex flex-wrap gap-1">
                        {reasons.slice(0, 4).map((r) => (
                          <span
                            key={r}
                            className="rounded-md bg-[#f4f6f8] px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-2"
                          >
                            {r}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="whitespace-nowrap text-[16px] font-extrabold tracking-[-0.02em]">
                      {formatWon(row.price_krw)}원
                    </p>
                    {row.utility != null && (
                      <p className="text-[11px] text-ink-3">만족도 {row.utility}</p>
                    )}
                  </div>

                  {canChange && !row.selected && (
                    <button
                      onClick={() => onPick(row.index)}
                      disabled={pickingIndex !== null}
                      className="shrink-0 whitespace-nowrap rounded-field bg-cobalt px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(39,67,224,.5)] transition-all hover:-translate-y-px hover:bg-[#1c36c4] disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {busy ? "변경 중..." : "이걸로 변경"}
                    </button>
                  )}
                </div>
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
