import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfileRequest } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/api";
import { nationLabel } from "../lib/options";
import AvatarCropModal from "./AvatarCropModal";
// 회원가입과 같은 목록으로 국적/출발지를 "선택"하게 한다 (자유 입력 금지 — 오타 방지)
import { COUNTRIES } from "@/screens/signup/countries";

/** 마이페이지 프로필 카드 — 조회 + 수정 + 사진 변경(업로드→정사각형 크롭) */
export default function ProfileCard() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 편집 중 입력값 (저장 전까지는 여기에만 담아둔다 — 취소하면 그대로 버림)
  const [form, setForm] = useState({
    nickname: "", email: "", nationality: "", city: "", iata: "",
  });

  /* ── 프로필 사진 변경 (피드백 2회 반영) ─────────────────────────────
     "수정" 모드에서만 사진 변경 버튼이 보이고, 크롭까지 마쳐도 화면 미리보기만
     바뀐다 — 실제 서버 반영은 프로필 [저장]을 눌렀을 때 (취소하면 그대로 버림).
     흐름: 수정 → 사진 변경 → 파일 선택(이미지만) → 정사각형 크롭 → 미리보기 → 저장 */
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 크롭 모달에 띄울 원본 이미지 (null이면 모달 닫힘) */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  /** 크롭을 마친 "저장 대기" 사진 — null이면 사진 변경 없음 */
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (!user) return null;

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 change 이벤트가 다시 오게 초기화
    if (!file) return;
    // 이미지 포맷만 허용 — 아니면 경고 문구 (피드백 명세)
    if (!file.type.startsWith("image/")) {
      setPhotoError("이미지 파일만 선택할 수 있어요. (jpg, png 등)");
      return;
    }
    setPhotoError(null);
    // FileReader: 로컬 파일을 data URL 문자열로 읽는다 (서버 업로드 전 미리보기용 표준 방법)
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  /** 크롭 모달의 [변경] — 바로 저장하지 않고 미리보기로만 보관 (저장 버튼이 실제 반영) */
  const holdCroppedPhoto = (dataUrl: string) => {
    setCropSrc(null);
    setPendingPhoto(dataUrl);
  };

  /** 현재 국적의 공항 목록 (국적을 바꾸면 출발지 선택지도 바뀜 — 회원가입과 동일 규칙) */
  const airports =
    COUNTRIES.find((c) => c.code === form.nationality)?.airports ?? [];

  const startEdit = () => {
    // 현재 프로필 값으로 폼을 채우고 편집 시작 (사진 대기분·경고도 초기화)
    setForm({
      nickname: user.nickname,
      email: user.email,
      nationality: user.nationality,
      city: user.defaultDeparture.city,
      iata: user.defaultDeparture.iata,
    });
    setPendingPhoto(null);
    setPhotoError(null);
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
        // 크롭해 둔 사진이 있을 때만 함께 저장 (없으면 필드 자체를 안 보냄 = 기존 유지)
        ...(pendingPhoto !== null ? { profile_image: pendingPhoto } : {}),
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
        profileImage: updated.profile_image ?? user.profileImage,
      });
      setPendingPhoto(null);
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
        {/* 아바타 — 사진이 있으면 사진, 없으면 닉네임 첫 글자.
            편집 중이면 저장 대기 사진(pendingPhoto)을 미리보기로 우선 표시 */}
        <div className="my-4 flex flex-col items-start gap-2">
          {(editing && pendingPhoto) || user.profileImage ? (
            <img
              src={(editing && pendingPhoto) || user.profileImage}
              alt="프로필 사진"
              className="h-[96px] w-[96px] rounded-[20px] object-cover"
            />
          ) : (
            <div className="grid h-[96px] w-[96px] place-items-center rounded-[20px] bg-gradient-to-br from-ink to-[#3b4a57] text-[34px] font-bold text-white">
              {(editing ? form.nickname : user.nickname).charAt(0) || "?"}
            </div>
          )}

          {/* 사진 변경은 "수정" 모드에서만 노출 — 저장을 눌러야 실제 반영 (피드백) */}
          {editing && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="rounded-lg border border-line px-2.5 py-1 text-[12px] font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:opacity-60"
              >
                사진 변경
              </button>
              {/* 숨겨진 파일 입력 — 버튼이 대신 클릭해 준다. accept로 이미지만 필터 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilePick}
              />
              {pendingPhoto && (
                <p className="text-[11.5px] text-ink-3">
                  미리보기예요 — 아래 저장을 눌러야 적용됩니다.
                </p>
              )}
              {photoError && <p className="text-[12px] text-stamp">{photoError}</p>}
            </>
          )}
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
                onClick={() => {
                  // 취소 = 사진 대기분 포함 전부 폐기 (서버에 아무것도 안 감)
                  setPendingPhoto(null);
                  setPhotoError(null);
                  setEditing(false);
                }}
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

      {/* 사진 크롭 모달 — [변경]은 미리보기 보관까지만, 실제 반영은 프로필 [저장] */}
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onApply={holdCroppedPhoto}
        />
      )}
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
