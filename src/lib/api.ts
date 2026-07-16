import axios from "axios";

/**
 * Django REST Framework 백엔드용 API 클라이언트
 *
 * - baseURL은 .env의 VITE_API_BASE_URL로 환경별(local/dev/prod) 분리
 * - 인증은 쿠키가 아니라 순수 JWT Bearer 헤더 방식이라 withCredentials는 사용하지 않음
 *   (덕분에 백엔드 CORS 설정도 CORS_ALLOW_CREDENTIALS 없이 CORS_ALLOWED_ORIGINS만으로 충분)
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

const ACCESS_TOKEN_KEY = "tripcanvas_access_token";
const REFRESH_TOKEN_KEY = "tripcanvas_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  /** refresh는 없으면 기존 값을 그대로 둔다 (refresh-only 갱신 시 access만 바뀌는 경우 대응) */
  set: (access: string, refresh?: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// 요청마다 access_token을 Authorization 헤더에 자동 첨부
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 동시에 여러 요청이 401을 맞아도 /auth/refresh는 한 번만 호출되도록 하는 큐.
 * 갱신이 끝나면 대기 중이던 요청들에 새 access_token을 꽂아 재실행한다.
 */
let isRefreshing = false;
let waiters: Array<(accessToken: string) => void> = [];

const requestNewAccessToken = async (): Promise<string> => {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("저장된 refresh 토큰이 없습니다.");

  // SimpleJWT 기본 TokenRefreshView 응답 형태: { access: "...", refresh?: "..." } (ROTATE_REFRESH_TOKENS 설정 시 refresh도 갱신됨)
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refresh }
  );
  tokenStorage.set(data.access, data.refresh);
  return data.access;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const original = error.config as typeof error.config & { _retry?: boolean };

    // refresh 엔드포인트 자체가 401이거나 이미 한 번 재시도한 요청이면 더 시도하지 않는다
    if (original._retry || original.url?.includes("/auth/refresh")) {
      tokenStorage.clear();
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      // 이미 갱신 중이면 끝날 때까지 대기했다가 새 토큰으로 원래 요청을 재실행
      return new Promise((resolve, reject) => {
        waiters.push((accessToken) => {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${accessToken}`;
          api(original).then(resolve, reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const newAccessToken = await requestNewAccessToken();
      waiters.forEach((resume) => resume(newAccessToken));
      waiters = [];
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshError) {
      waiters = [];
      tokenStorage.clear();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * DRF 에러 응답 형태
 * - Serializer validation error: { "email": ["이미 가입된 이메일입니다."] }
 * - 인증 실패 등 non_field_error: { "detail": "..." }
 */
export type ApiFieldErrors = Record<string, string[] | string>;

export const extractFieldErrors = (error: unknown): ApiFieldErrors => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (typeof data === "object" && data !== null) {
      return data as ApiFieldErrors;
    }
  }
  return { detail: "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
};

/** 특정 필드의 첫 번째 에러 메시지만 뽑아쓰는 헬퍼 (폼 에러 표시용) */
export const firstError = (errors: ApiFieldErrors, field: string): string | undefined => {
  const value = errors[field];
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

/**
 * agents/trips/payments 계열 뷰는 필드 에러가 아니라 { "error": "..." } 하나만 내려준다.
 * 그 문자열만 뽑아쓰는 헬퍼 (챗/토스트 표시용).
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string") {
      return (data as { error: string }).error;
    }
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
};