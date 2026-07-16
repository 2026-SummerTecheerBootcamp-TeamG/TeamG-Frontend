import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfileRequest } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/api";
import { nationLabel } from "../lib/options";

/** 마이페이지 프로필 카드 — 조회 + 수정 */
export default function ProfileCard() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 편집 중 입력값 (저장 전까지는 여기에만 담아둔다 — 취소하면 그대로 버림)
  const [form, setForm] = useState({
    nickname: "", email: "", nationality: "", city: "", iata: "",
  });

  if (!user) return null;

  const startEdit = () => {
    // 현재 프로필 값으로 폼을 채우고 편집 시작
    setForm({
      nickname: user.nickname,
      email: user.email,
      nationality: user.nationality,
      city: user.defaultDeparture.city,
      iata: user.defaultDeparture.iata,
    });
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfileRequest({
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        nationality: form.nationality.trim().toUpperCase(),
        default_departure: {
          city: form.city.trim(),
          iata: form.iata.trim().toUpperCase(),
        },
      });
      // 서버가 돌려준 최종값으로 전역 user 상태 갱신 (헤더/파서 프로필 채움에 즉시 반영)
      updateProfile({
        nickname: updated.nickname,
        email: updated.email,
        nationality: updated.nationality,
        defaultDeparture: {
          city: updated.default_departure.city,
          iata: updated.default_departure.iata ?? "",
        },
      });
      setEditing(false);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13.5px] outline-none transition-colors focus:border-cobalt";

  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">프로필</h3>
        {!editing && (
          <button
            onClick={startEdit}
            className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            수정
          </button>
        )}
      </div>

      <div className="px-[22px] pb-5 pt-2">
        {/* 아바타 */}
        <div className="my-4 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-gradient-to-br from-ink to-[#3b4a57] text-[19px] font-bold text-white">
          {(editing ? form.nickname : user.nickname).charAt(0) || "?"}
        </div>

        {editing ? (
          <>
            <Row label="닉네임">
              <input
                className={inputCls}
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              />
            </Row>
            <Row label="이메일">
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Row>
            <Row label="국적">
              <input
                className={inputCls}
                maxLength={2}
                placeholder="KR"
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              />
            </Row>
            <Row label="기본 출발지">
              <span className="flex gap-1.5">
                <input
                  className={inputCls}
                  placeholder="서울"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <input
                  className={`${inputCls} w-[74px] shrink-0`}
                  maxLength={3}
                  placeholder="ICN"
                  value={form.iata}
                  onChange={(e) => setForm({ ...form, iata: e.target.value })}
                />
              </span>
            </Row>

            {error && <p className="mt-2 text-[12px] text-stamp">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-field bg-cobalt py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#1c36c4] disabled:opacity-60"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-field border border-line px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
            <Row label="닉네임">{user.nickname}</Row>
            <Row label="이메일">{user.email}</Row>
            <Row label="국적">{nationLabel(user.nationality)}</Row>
            <Row label="기본 출발지">
              {user.defaultDeparture.city} ({user.defaultDeparture.iata})
            </Row>
          </>
        )}
      </div>
    </div>
  );
}

/** 라벨 + 값 한 줄 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-t border-line-soft py-[11px]">
      <span
        className="w-[88px] shrink-0 text-[11px] tracking-[0.06em] text-ink-3"
        style={{ fontFamily: "Pretendard, sans-serif" }}
      >
        {label}
      </span>
      <span className="flex-1 text-[14px] font-semibold tracking-[-0.015em]">
        {children}
      </span>
    </div>
  );
}
