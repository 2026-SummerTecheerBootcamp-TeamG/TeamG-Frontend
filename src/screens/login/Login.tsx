import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard, Field, SubmitButton } from "@/components/auth/AuthForm";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /** 로그인 전에 가려던 경로 (ProtectedRoute가 넘겨준다) */
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setError("이메일 형식이 올바르지 않습니다.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호를 확인해주세요.");
      return;
    }
    setError("");

    // TODO: POST /api/v1/auth/login 연동 후 응답값으로 교체
    login({
      userId: 1,
      nickname: email.split("@")[0],
      email,
      nationality: "대한민국",
      defaultDeparture: { city: "서울", iata: "ICN" },
    });

    navigate(from, { replace: true });
  };

  return (
    <AuthCard title="로그인" desc="계획을 확정하고 저장하려면 로그인이 필요합니다.">
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="이메일"
          type="email"
          value={email}
          placeholder="you@example.com"
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="비밀번호"
          type="password"
          value={password}
          autoComplete="current-password"
          error={error}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton>로그인</SubmitButton>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-3">
        아직 계정이 없으신가요?{" "}
        <Link to="/signup" className="font-semibold text-cobalt hover:underline">
          회원가입
        </Link>
      </p>
    </AuthCard>
  );
}