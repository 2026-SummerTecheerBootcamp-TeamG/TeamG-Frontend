import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * 로그인해야 볼 수 있는 화면을 감싼다.
 * 비로그인 상태로 /mypage 에 들어오면 /login 으로 보내고,
 * 로그인 성공 후 원래 가려던 곳으로 되돌린다.
 */
export default function ProtectedRoute() {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // 새로고침 직후: 저장된 토큰으로 로그인 상태를 복원하는 동안 기다린다.
  // 이 화면이 없으면 복원 전에 /login으로 잠깐 튕겼다 돌아온다.
  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-ink-3">
        불러오는 중...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}