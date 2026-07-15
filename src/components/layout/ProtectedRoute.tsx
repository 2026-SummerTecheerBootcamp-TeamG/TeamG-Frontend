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

  // 세션 복원(저장된 토큰으로 프로필 조회) 중에는 아직 판단하지 않는다.
  // 안 그러면 정상 로그인 상태에서도 새로고침 직후 잠깐 /login으로 튕긴다.
  if (isLoading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}