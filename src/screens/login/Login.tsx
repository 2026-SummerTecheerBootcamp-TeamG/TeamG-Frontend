import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard, Field, SubmitButton } from "@/components/auth/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { loginRequest } from "@/api/auth";
import { extractFieldErrors, firstError } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (e: FormEvent) => {
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
    setSubmitting(true);

    try {
      const { access_token, refresh_token } = await loginRequest({ email, password });
      await login(access_token, refresh_token);
      navigate(from, { replace: true });
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      setError(
        firstError(fieldErrors, "detail") ?? "이메일 또는 비밀번호가 올바르지 않습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="로그인" desc="계획을 확정하고 저장하려면 로그인이 필요합니다.">
      <form onSubmit={handleSubmit} noValidate style={{ fontFamily: "Pretendard, sans-serif" }}>
        <Field
          label="이메일"
          type="email"
          value={email}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={submitting}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="비밀번호"
          type="password"
          value={password}
          autoComplete="current-password"
          error={error}
          disabled={submitting}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </SubmitButton>
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