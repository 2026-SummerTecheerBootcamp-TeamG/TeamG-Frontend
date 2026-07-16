import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfileRequest } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/api";
import { nationLabel } from "../lib/options";
// 회원가입과 같은 목록으로 국적/출발지를 "선택"하게 한다 (자유 입력 금지 — 오타 방지)
import { COUNTRIES } from "@/screens/signup/countries";

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

  /** 현재 국적의 공항 목록 (국적을 바꾸면 출발지 선택지도 바뀜 — 회원가입과 동일 규칙) */
  const airports =
    COUNTRIES.find((c) => c.code === form.nationality)?.airports ?? [];

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

  /** 국적 변경: 출발지 선택지가 바뀌므로 그 나라 첫 공항으로 리셋 */
  const changeNation = (code: string) => {
    const first = COUNTRIES.find((c) => c.code === code)?.airports[0];
    setForm({
      ...form,
      nationality: code,
      city: first?.city ?? "",
      iata: first?.iata ?? "",
    });
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
              <select
                className={inputCls}
                value={form.nationality}
                onChange={(e) => changeNation(e.target.value)}
              >
                {/* 목록에 없는 기존 값도 보이게 (선택지 최상단에 유지) */}
                {!COUNTRIES.some((c) => c.code === form.nationality) && (
                  <option value={form.nationality}>{form.nationality}</option>
                )}
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="기본 출발지">
              <select
                className={inputCls}
                value={form.iata}
                onChange={(e) => {
                  const airport = airports.find((a) => a.iata === e.target.value);
                  if (airport) setForm({ ...form, city: airport.city, iata: airport.iata });
                }}
              >
                {airports.length === 0 && (
                  <option value={form.iata}>선택 가능한 공항 없음</option>
                )}
                {/* 현재 값이 이 나라 목록에 없으면(옛 데이터) 최상단에 유지 */}
                {form.iata && !airports.some((a) => a.iata === form.iata) && (
                  <option value={form.iata}>
                    {form.city} ({form.iata})
                  </option>
                )}
                {airports.map((a) => (
                  <option key={a.iata} value={a.iata}>
                    {a.city} ({a.iata})
                  </option>
                ))}
              </select>
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
