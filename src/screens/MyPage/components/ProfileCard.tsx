import { useAuth } from "@/context/AuthContext";
import { nationLabel } from "../lib/options";

/** 마이페이지 프로필 카드 (조회 전용) */
export default function ProfileCard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="rounded-card border border-line bg-paper shadow-[0_1px_2px_rgba(15,20,24,.04)]">
      <div className="flex items-center justify-between border-b border-line-soft px-[22px] py-[18px]">
        <h3 className="text-[15px] font-bold tracking-[-0.025em]">프로필</h3>
      </div>

      <div className="px-[22px] pb-5 pt-2">
        {/* 아바타 */}
        <div className="my-4 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-gradient-to-br from-ink to-[#3b4a57] text-[19px] font-bold text-white">
          {user.nickname.charAt(0)}
        </div>

        <Row label="닉네임">{user.nickname}</Row>
        <Row label="이메일">{user.email}</Row>
        <Row label="국적">{nationLabel(user.nationality)}</Row>
        <Row label="기본 출발지">
          {user.defaultDeparture.city} ({user.defaultDeparture.iata})
        </Row>
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
      <span className="flex-1 text-[14px] font-semibold tracking-[-0.015em]">
        {children}
      </span>
    </div>
  );
}