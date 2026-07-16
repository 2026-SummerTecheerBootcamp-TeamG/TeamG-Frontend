import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthCard,
  Field,
  SelectField,
  SubmitButton,
} from "@/components/auth/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { COUNTRIES, findCountry } from "@/screens/signup/countries";
import { signupRequest, loginRequest } from "@/api/auth";
import { extractFieldErrors, firstError } from "@/lib/api";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    nationalityCode: "KR", // 국적은 국가 코드로 관리 (표시명/공항 조회에 사용)
    departure: "서울|ICN",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 선택된 국적의 공항 목록 (국적이 바뀌면 자동으로 다시 계산됨)
  const availableAirports = useMemo(
    () => findCountry(form.nationalityCode)?.airports ?? [],
    [form.nationalityCode]
  );

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleNationalityChange = (code: string) => {
    const country = findCountry(code);
    const firstAirport = country?.airports[0];
    setForm((prev) => ({
      ...prev,
      nationalityCode: code,
      // 국적이 바뀌면 그 나라의 첫 번째 공항으로 출발지를 자동 갱신
      departure: firstAirport ? `${firstAirport.city}|${firstAirport.iata}` : "",
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!form.email.includes("@")) next.email = "이메일 형식이 올바르지 않습니다.";
    if (form.password.length < 8)
      next.password = "비밀번호는 8자 이상이어야 합니다.";
    if (form.password !== form.passwordConfirm)
      next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    if (!form.nickname.trim()) next.nickname = "닉네임을 입력해주세요.";
    if (!form.departure) next.departure = "출발 가능한 공항이 없는 국가입니다.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const [city, iata] = form.departure.split("|");

    setIsSubmitting(true);
    try {
      // 1) 회원가입 — SignupSerializer는 유저만 생성하고 토큰은 내려주지 않음
      await signupRequest({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        nationality: form.nationalityCode,
        default_departure: { city, iata },
      });

      // 2) 가입 직후 자동 로그인 — LoginSerializer가 access_token/refresh_token 발급
      const { access_token, refresh_token } = await loginRequest({
        email: form.email,
        password: form.password,
      });

      // 3) 발급받은 토큰으로 AuthContext에 로그인 처리
      //    (내부에서 토큰 저장 + /users/me/profile 조회까지 함께 수행됨)
      await login(access_token, refresh_token);

      navigate("/", { replace: true });
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      setErrors({
        email: firstError(fieldErrors, "email") ?? "",
        password: firstError(fieldErrors, "password") ?? "",
        nickname: firstError(fieldErrors, "nickname") ?? "",
        nationality: firstError(fieldErrors, "nationality") ?? "",
        form: firstError(fieldErrors, "detail") ?? "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard title="회원가입" desc="기본 출발지를 정해두면 계획을 짤 때 바로 반영됩니다.">
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="이메일"
          type="email"
          value={form.email}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Field
          label="비밀번호"
          type="password"
          value={form.password}
          placeholder="8자 이상"
          autoComplete="new-password"
          error={errors.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <Field
          label="비밀번호 확인"
          type="password"
          value={form.passwordConfirm}
          autoComplete="new-password"
          error={errors.passwordConfirm}
          onChange={(e) => set("passwordConfirm", e.target.value)}
        />
        <Field
          label="닉네임"
          value={form.nickname}
          placeholder="트립캔버스에서 쓸 이름"
          error={errors.nickname}
          onChange={(e) => set("nickname", e.target.value)}
        />
        <SelectField
          label="국적"
          value={form.nationalityCode}
          onChange={(e) => handleNationalityChange(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="기본 출발지"
          value={form.departure}
          error={errors.departure}
          disabled={availableAirports.length === 0}
          onChange={(e) => set("departure", e.target.value)}
        >
          {availableAirports.length === 0 ? (
            <option value="">선택 가능한 공항 없음</option>
          ) : (
            availableAirports.map((a) => (
              <option key={a.iata} value={`${a.city}|${a.iata}`}>
                {a.city} ({a.iata})
              </option>
            ))
          )}
        </SelectField>

        <SubmitButton disabled={isSubmitting}>
          {isSubmitting ? "가입 처리 중..." : "가입하기"}
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-3">
        이미 계정이 있으신가요?{" "}
        <Link to="/login" className="font-semibold text-cobalt hover:underline">
          로그인
        </Link>
      </p>
    </AuthCard>
  );
}