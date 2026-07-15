import { api } from "@/lib/api";
 
export interface Departure {
  city: string;
  iata?: string;
}
 
/** POST /api/v1/auth/signup 요청 바디 — SignupSerializer.Meta.fields와 매칭 */
export interface SignupPayload {
  email: string;
  password: string;
  nickname: string;
  nationality: string; // ISO 3166-1 alpha-2, 예: "KR" (SignupSerializer.validate_nationality가 대문자로 정규화)
  default_departure: Departure;
}
 
/** SignupView는 생성된 유저 필드가 아니라 { user_id, message }만 응답함 (views.py 기준) */
export interface SignupResponse {
  user_id: number;
  message: string;
}
 
export const signupRequest = (payload: SignupPayload) =>
  api.post<SignupResponse>("/auth/signup", payload).then((res) => res.data);
 
/** POST /api/v1/auth/login 요청 바디 — LoginSerializer와 매칭 */
export interface LoginPayload {
  email: string;
  password: string;
}
 
/**
 * LoginSerializer.create()의 응답.
 * ⚠️ 현재 백엔드는 access_token만 내려주는데, urls.py에 TokenRefreshView(/auth/refresh)가
 * 등록돼 있어서 refresh_token도 함께 내려줘야 갱신이 가능해요.
 * LoginSerializer.create()에 "refresh_token": str(refresh) 한 줄 추가가 필요합니다.
 */
export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
}
 
export const loginRequest = (payload: LoginPayload) =>
  api.post<LoginResponse>("/auth/login", payload).then((res) => res.data);
 
/** GET /api/v1/users/me/profile 응답 — ProfileSerializer와 매칭 */
export interface Profile {
  user_id: number;
  nickname: string;
  email: string;
  nationality: string;
  default_departure: Departure;
}
 
export const fetchProfile = () =>
  api.get<Profile>("/users/me/profile").then((res) => res.data);

/** PATCH /api/v1/users/me/profile 요청 바디 (수정 가능한 필드만) */
export interface ProfileUpdatePayload {
  nickname?: string;
  nationality?: string; // ISO 3166-1 alpha-2, 예: "KR"
  default_departure?: Departure;
}

/** 프로필 수정 — 성공 시 갱신된 Profile을 반환 */
export const updateProfileRequest = (payload: ProfileUpdatePayload) =>
  api.patch<Profile>("/users/me/profile", payload).then((res) => res.data);