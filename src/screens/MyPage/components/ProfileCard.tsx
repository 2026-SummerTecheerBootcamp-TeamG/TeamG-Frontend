import { useState } from "react";
import { updateProfileRequest } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { DEPARTURES, NATIONS, nationLabel } from "../lib/options";

/** 마이페이지 프로필 카드 */
export default function ProfileCard() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // 수정 폼 상태
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [nationality, setNationality] = useState(user?.nationality ?? "KR");
  const [departure, setDeparture] = useState(
    `${user?.defaultDeparture.city ?? "서울"}|${user?.defaultDeparture.iata ?? "ICN"}`,
  );

  if (!user) return null;

  const startEdit = () => {
    setNickname(user.nickname);
    setNationality(user.nationality);
    setDeparture(`${user.defaultDeparture.city}|${user.defaultDeparture.iata}`);
    setError("");
    setEditing(true);
  };

  const save = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");

    const [city, iata] = departure.split("|");

    try {
      const profile = await updateProfileRequest({
        nickname: nickname.trim(),
        nationality,
        default_departure: { city, iata },
      });
      // 서버가 돌려준 값으로 전역 상태 갱신
      updateProfile({
        nickname: profile.nickname,
        nationality: profile.nationality,
        defaultDeparture: {
          city: profile.default_departure.city,
          iata: profile.default_departure.iata ?? "",
        },
      });
      setEditing(false);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">프로필</h3>
        {!editing && (
          <button
            onClick={startEdit}
            className="font-mono text-[11px] font-semibold text-cobalt hover:underline"
          >
            수정
          </button>
        )}
        {done && (
          <span className="font-mono text-[11px] font-semibold text-teal">
            저장됨
          </span>
        )}
      </div>

      <div className="px-[22px] pb-5 pt-2">
        {/* 아바타 */}
        <div className="my-4 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-gradient-to-br from-ink to-[#3b4a57] text-[19px] font-bold text-white">
          {user.nickname.charAt(0)}
        </div>

        {editing ? (
          <>
            <Row label="닉네임">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13.5px] outline-none focus:border-ink"
              />
            </Row>
            <Row label="이메일">
              {/* 이메일은 수정 불가 */}
              <span className="text-[14px] text-ink-3">{user.email}</span>
            </Row>
            <Row label="국적">
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13.5px] outline-none focus:border-ink"
              >
                {NATIONS.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="기본 출발지">
              <select
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13.5px] outline-none focus:border-ink"
              >
                {DEPARTURES.map((d) => (
                  <option key={d.iata} value={`${d.city}|${d.iata}`}>
                    {d.city} ({d.iata})
                  </option>
                ))}
              </select>
            </Row>

            {error && (
              <p className="mt-3 text-[12px] text-stamp">{error}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-lg bg-ink py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#2a3138] disabled:opacity-50"
              >
                {saving ? "저장 중..." : "프로필 저장"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-lg border border-line px-4 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:border-ink-3"
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
            <Row label="닉네임">
              <span className="text-[14px] font-semibold tracking-[-0.015em]">
                {user.nickname}
              </span>
            </Row>
            <Row label="이메일">
              <span className="text-[14px] font-semibold tracking-[-0.015em]">
                {user.email}
              </span>
            </Row>
            <Row label="국적">
              <span className="text-[14px] font-semibold tracking-[-0.015em]">
                {nationLabel(user.nationality)}
              </span>
            </Row>
            <Row label="기본 출발지">
              <span className="text-[14px] font-semibold tracking-[-0.015em]">
                {user.defaultDeparture.city} ({user.defaultDeparture.iata})
              </span>
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
      <span className="w-[88px] shrink-0 font-mono text-[11px] tracking-[0.06em] text-ink-3">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}