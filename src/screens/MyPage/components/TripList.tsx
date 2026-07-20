import { useState } from "react";
import type { TripSummary } from "@/types/trip";
import { formatWon } from "@/screens/PlanningRoom/lib/parseRequest";

const chipColors = ["from-cobalt to-[#4E6BFF]", "from-teal to-[#3FBFA5]", "from-amber to-[#F0B45E]"];

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

interface Props {
  /** null이면 로딩 중 */
  trips: TripSummary[] | null;
  onSelect: (planId: number) => void;
  /** 미확정 계획 삭제 (확인 모달에서 "삭제" 선택 시 호출) */
  onDelete: (requestId: number) => void;
  /** 계획 이름 수정 — 성공하면 null, 실패하면 에러 문구를 돌려준다 (인라인 표시용) */
  onRename: (requestId: number, title: string) => Promise<string | null>;
}

/** 상태 배지 — 목록에서 계획의 진행 단계를 한눈에 */
function StatusBadge({ status }: { status: TripSummary["status"] }) {
  if (status === "confirmed")
    return (
      <span className="rounded-md bg-teal/10 px-1.5 py-0.5 text-[10.5px] font-bold text-teal">
        확정
      </span>
    );
  if (status === "draft")
    return (
      <span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[10.5px] font-bold text-amber">
        임시저장 · 이어서 수정
      </span>
    );
  return (
    <span className="rounded-md bg-line-soft px-1.5 py-0.5 text-[10.5px] font-bold text-ink-3">
      생성 중
    </span>
  );
}

/** 저장한 계획 목록 — 만든 계획 전부 (미확정 계획도 언제든 다시 열어 수정/확정) */
export default function TripList({ trips, onSelect, onDelete, onRename }: Props) {
  /** 삭제 확인 모달이 열려 있는 대상 (null이면 닫힘) */
  const [pendingDelete, setPendingDelete] = useState<TripSummary | null>(null);

  /** 이름 편집 중인 행 (연필 버튼) — 저장 전까지는 draft에만 담아둔다 */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const startRename = (trip: TripSummary) => {
    setEditingId(trip.request_id);
    // 현재 보이는 이름으로 시작 (이름이 없으면 목적지 표기 그대로)
    setTitleDraft(trip.title || trip.destinations.join(" · "));
    setRenameError(null);
  };

  const submitRename = async () => {
    if (editingId === null || savingTitle) return;
    setSavingTitle(true);
    const err = await onRename(editingId, titleDraft.trim());
    setSavingTitle(false);
    if (err) {
      setRenameError(err);      // 실패: 편집 상태 유지 + 인라인 안내
    } else {
      setEditingId(null);       // 성공: 편집 종료 (목록은 부모가 갱신)
      setRenameError(null);
    }
  };
  // plan이 아직 없는 요청(접수 직후 등)만 제외하고 전부 보여준다.
  // 예전엔 확정본만 노출했는데, "미확정 계획을 다시 불러 수정/확정할 수 없다"는
  // 피드백으로 전체 노출 + 상태 배지 방식으로 변경.
  const visibleTrips =
    trips === null ? null : trips.filter((t) => t.plan_id !== null);

  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">내 계획</h3>
        <span className="font-mono text-[11px] text-ink-3">{visibleTrips?.length ?? "-"}건</span>
      </div>
      {visibleTrips === null ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">불러오는 중...</div>
      ) : visibleTrips.length === 0 ? (
        <div className="px-[22px] py-11 text-center text-sm text-ink-3">
          아직 만든 계획이 없습니다.
          <br />
          홈에서 문장 한 줄로 시작해 보세요.
        </div>
      ) : (
        <ul className="px-3 py-2">
          {visibleTrips.map((trip, i) => (
            <li
              key={trip.request_id}
              className="flex items-center gap-3 border-b border-line-soft last:border-b-0"
            >
              {editingId === trip.request_id ? (
                /* ── 이름 편집 모드: 행 전체가 편집 폼으로 바뀐다 (행 클릭 이동은 잠시 꺼짐) ── */
                <div className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-4">
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${chipColors[i % 3]} text-[13px] font-bold text-white`}
                  >
                    {trip.destinations[0]?.slice(0, 2) ?? "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <input
                      autoFocus
                      value={titleDraft}
                      maxLength={60}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      placeholder="계획 이름 (비우면 목적지로 표시)"
                      className="w-full rounded-lg border-[1.5px] border-cobalt bg-white px-2.5 py-1.5 text-[14.5px] font-semibold outline-none"
                    />
                    {renameError && (
                      <span className="mt-1 block text-[12px] text-stamp">{renameError}</span>
                    )}
                  </span>
                  <button
                    onClick={submitRename}
                    disabled={savingTitle}
                    className="shrink-0 rounded-field bg-cobalt px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#1c36c4] disabled:opacity-60"
                  >
                    {savingTitle ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={savingTitle}
                    className="shrink-0 rounded-field border border-line px-3 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                  >
                    취소
                  </button>
                </div>
              ) : (
              /* 왼쪽 콘텐츠 = 하나의 클릭 영역 (확정: 상세로 / 미확정: 홈에서 이어서 수정) */
              <button
                onClick={() => trip.plan_id !== null && onSelect(trip.plan_id)}
                disabled={trip.status === "processing"}
                className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-4 text-left transition-colors hover:bg-[#f7f9fa] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${chipColors[i % 3]} text-[13px] font-bold text-white`}
                >
                  {trip.destinations[0]?.slice(0, 2) ?? "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {/* 연필 = 이름 수정 (피드백). 행 버튼 안이라 <button> 중첩이 불가 →
                        role="button" span + stopPropagation으로 행 클릭(상세 이동)과 분리 */}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="계획 이름 수정"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startRename(trip);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          e.preventDefault();
                          startRename(trip);
                        }
                      }}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-line-soft hover:text-ink"
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M11.3 1.7a1.7 1.7 0 0 1 2.4 2.4l-8.2 8.2-3.2.8.8-3.2 8.2-8.2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="truncate text-base font-bold tracking-[-0.03em]">
                      {/* 사용자가 붙인 이름 우선, 없으면 목적지 자동 표기 */}
                      {trip.title || trip.destinations.join(" · ") || "목적지 미정"}
                    </span>
                    <StatusBadge status={trip.status} />
                  </span>
                  {/* 날짜·출발지가 잘 안 보인다는 피드백 → 크기·굵기 업 + 본문 폰트 */}
                  <span className="mt-1 block text-[13.5px] font-semibold tabular-nums tracking-[-0.01em] text-ink-2">
                    {fmt(trip.start_date)} – {fmt(trip.end_date)} · {trip.departure} 출발
                  </span>
                </span>

                {/* 오른쪽 끝: 가격만 — 버튼은 행 밖의 공통 슬롯으로 (가격↔버튼 간격 통일) */}
                <span className="shrink-0 whitespace-nowrap font-mono text-[16px] font-extrabold tracking-[-0.02em]">
                  {formatWon(trip.total_budget)}원
                </span>
              </button>
              )}

              {/* 오른쪽 공통 버튼 슬롯 — 확정: 예약·결제(파랑, 행 클릭과 같은 동작) /
                  미확정: 삭제(빨강, 확인 모달). 같은 자리·같은 크기(112px)라
                  어느 행이든 가격과 버튼 사이 간격이 항상 동일 */}
              {trip.status === "confirmed" && trip.plan_id !== null && (
                <button
                  onClick={() => onSelect(trip.plan_id!)}
                  className="mr-3 w-[112px] shrink-0 whitespace-nowrap rounded-field bg-cobalt py-3 text-center text-[13px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(39,67,224,.5)] transition-all hover:-translate-y-px hover:bg-[#1c36c4]"
                >
                  예약·결제 →
                </button>
              )}
              {/* processing도 삭제 허용 — 수정 실패로 '생성 중'에 멈춘 좀비 정리용
                  (정상 생성 중에 지우면 그 실행은 실패하지만, 사용자가 선택한 일) */}
              {(trip.status === "draft" || trip.status === "processing") && (
                <button
                  onClick={() => setPendingDelete(trip)}
                  className="mr-3 w-[112px] shrink-0 whitespace-nowrap rounded-field bg-stamp py-3 text-center text-[13px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(216,64,47,.5)] transition-all hover:-translate-y-px hover:bg-[#b93325]"
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 삭제 확인 모달 */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 px-5 backdrop-blur-[2px]"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-card border border-line bg-white p-6 text-center shadow-[0_24px_60px_-16px_rgba(15,20,24,.4)]"
            style={{ fontFamily: "Pretendard, sans-serif" }}
          >
            <h3 className="text-[17px] font-extrabold tracking-[-0.03em]">
              계획을 삭제하시겠습니까?
            </h3>
            <p className="mt-2 break-keep text-[13px] text-ink-2">
              {pendingDelete.destinations.join(" · ")} (
              {fmt(pendingDelete.start_date)} – {fmt(pendingDelete.end_date)})
              <br />
              삭제하면 되돌릴 수 없습니다.
            </p>
            {/* 취소 왼쪽 / 삭제 오른쪽 — 파괴적 동작은 오른쪽에 두는 관례 (피드백 반영) */}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-field border border-line py-2.5 text-[14px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onDelete(pendingDelete.request_id);
                  setPendingDelete(null);
                }}
                className="flex-1 rounded-field bg-stamp py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#b93325]"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}