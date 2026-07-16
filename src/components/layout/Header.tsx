import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/** 서비스 로고 마크 */
function Mark() {
  return (
    <span className="relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-md bg-ink">
      <span className="absolute left-[3px] top-[12px] h-[2px] w-4 origin-left -rotate-[32deg] bg-white" />
      <span className="absolute right-[3px] top-[4px] h-[5px] w-[5px] rounded-full bg-cobalt ring-[3px] ring-cobalt/25" />
    </span>
  );
}

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuth = () => {
    if (isLoggedIn) {
      logout();
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md backdrop-saturate-150">
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-7">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.03em]"
        >
          <Mark />
          트립캔버스
        </Link>

        <div className="flex items-center gap-1.5">
          {/* 명시적인 "홈" 메뉴 — 로고 클릭만으로는 홈 이동이 비직관적이라는 피드백 반영 */}
          <Link
            to="/"
            className="rounded-lg px-3.5 py-2 text-[14.5px] font-semibold text-ink-2 transition-colors hover:bg-line-soft hover:text-ink"
          >
            홈
          </Link>

          <button
            onClick={handleAuth}
            className="rounded-lg px-3.5 py-2 text-[14.5px] font-semibold text-ink-2 transition-colors hover:bg-line-soft hover:text-ink"
          >
            {isLoggedIn ? "로그아웃" : "로그인"}
          </button>

          {/* 로그인 전에는 회원가입을, 로그인 후에는 마이페이지를 보여준다 */}
          {isLoggedIn ? (
            <Link
              to="/mypage"
              className="rounded-lg bg-ink px-3.5 py-2 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#2a3138]"
            >
              마이페이지
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-lg bg-ink px-3.5 py-2 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#2a3138]"
            >
              회원가입
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}