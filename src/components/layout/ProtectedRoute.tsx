import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * 로그인해야 볼 수 있는 화면을 감싼다.
 * 비로그인 상태로 /mypage 에 들어오면 /login 으로 보내고,
 * 로그인 성공 후 원래 가려던 곳으로 되돌린다.
 */
export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}