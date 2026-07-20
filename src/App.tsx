import { Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ScrollToTop from "@/components/layout/ScrollToTop";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import PaymentResult from "@/screens/PaymentResult";
import PlanningRoom from "@/screens/PlanningRoom";
import Login from "@/screens/login";
import Signup from "@/screens/signup";
import Onboarding from "@/screens/Onboarding";
import MyPage from "@/screens/MyPage";

export default function App() {
  return (
    <AuthProvider>
      {/* 경로 이동 시 항상 맨 위에서 시작 (온보딩→플래닝룸 이동이 중간부터 보이던 문제) */}
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          {/* 랜딩: 온보딩 페이지를 루트로 고정 */}
          <Route path="/" element={<Onboarding />} />

          {/* 로그인 / 회원가입 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 회원가입 직후에도 동일한 온보딩으로 연결 */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* 메인: 챗 + 계획서  (이슈 4·5) */}
          <Route path="/planningroom" element={<PlanningRoom />} />

          {/* 계획서 확정 화면  (이슈 5) */}
          {/* <Route path="/plan/:tripId" element={<PlanConfirm />} /> */}

          {/* 로그인해야 볼 수 있는 화면 */}
          <Route element={<ProtectedRoute />}>
            {/* 마이페이지  (이슈 7·8) */}
            <Route path="/mypage" element={<MyPage />} />

            {/* 토스 결제창 successUrl/failUrl 복귀 지점 */}
            <Route path="/payment/result" element={<PaymentResult />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}