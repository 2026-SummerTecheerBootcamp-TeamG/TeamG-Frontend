import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// 정식 로고(TripCanvas 워드마크 SVG). 예전에 CSS로 그리던 Mark 컴포넌트를 대체한다.
import logo from "@/assets/img/logo.svg";

export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = () => {
    if (isLoggedIn) {
      logout();
      // 로그인이 필요한 화면(마이페이지/결제)에 있었다면 온보딩으로 내보내고,
      // 온보딩·플래닝룸 같은 공개 화면이면 그 자리에 그대로 둔다
      // (예전엔 무조건 /planningroom으로 보내서 온보딩에서 로그아웃하면 화면이 튀었음 — 피드백)
      if (
        location.pathname.startsWith("/mypage") ||
        location.pathname.startsWith("/payment")
      ) {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md backdrop-saturate-150">
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-7">
        {/* 로고 클릭 = 로그인 전: 온보딩(서비스 소개), 로그인 후: 플래닝룸 (버그 수정 — 로그인 상태에서도 항상 "/"로 가서 온보딩으로 튕기던 문제) */}
        <Link
          to={isLoggedIn ? "/planningroom" : "/"}
          className="flex items-center"
        >
          {/* 워드마크에 서비스명이 포함돼 있으므로 텍스트 없이 이미지 하나만 쓴다.
              높이만 지정하고 w-auto로 비율(약 4.5:1)을 유지 */}
          <img src={logo} alt="트립캔버스" className="h-7 w-auto" />
        </Link>

        <div className="flex items-center gap-1.5">
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