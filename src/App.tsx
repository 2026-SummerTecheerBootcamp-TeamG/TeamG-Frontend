import { Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import PaymentResult from "@/screens/PaymentResult";
import PlanningRoom from "@/screens/PlanningRoom";
import Login from "@/screens/login";
import Signup from "@/screens/signup";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          {/* 메인: 랜딩 + 챗 + 계획서  (이슈 4·5) */}
          <Route path="/" element={<PlanningRoom />} />

          {/* 로그인 / 회원가입 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 계획서 확정 화면  (이슈 5) */}
          {/* <Route path="/plan/:tripId" element={<PlanConfirm />} /> */}

          {/* 로그인해야 볼 수 있는 화면 */}
          <Route element={<ProtectedRoute />}>
            {/* 마이페이지  (이슈 7·8) */}
            {/* <Route path="/mypage" element={<MyPage />} /> */}

            {/* 토스 결제창 successUrl/failUrl 복귀 지점 */}
            <Route path="/payment/result" element={<PaymentResult />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}