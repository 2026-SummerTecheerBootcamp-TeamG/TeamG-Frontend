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
  // 응답이 없으면 서버 연결 실패가 원인 — "알 수 없는 오류" 대신 원인을 알려준다
  return { detail: "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요." };
};

/** 특정 필드의 첫 번째 에러 메시지만 뽑아쓰는 헬퍼 (폼 에러 표시용) */
export const firstError = (errors: ApiFieldErrors, field: string): string | undefined => {
  const value = errors[field];
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

/**
 * 에러 → 사용자가 "원인을 알 수 있는" 문장으로.
 *
 * 우선순위:
 *  1. 백엔드가 준 구체적 메시지 ({error: "..."} 또는 DRF {detail: "..."})
 *  2. 없으면 상태 코드/네트워크 상황별로 원인을 설명하는 기본 문구
 * ("알 수 없는 오류" 같은 막연한 문구는 쓰지 않는다 — 피드백 반영)
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // 1. 서버가 보낸 구체적 메시지가 있으면 그대로 (가장 정확한 원인)
    const data: unknown = error.response?.data;
    if (data && typeof data === "object") {
      const d = data as { error?: unknown; detail?: unknown };
      if (typeof d.error === "string" && d.error) return d.error;
      if (typeof d.detail === "string" && d.detail) return d.detail;
      if (Array.isArray(d.detail) && typeof d.detail[0] === "string") return d.detail[0];
    }

    // 2. 응답 자체가 없음 = 서버까지 도달 실패 (인터넷/서버 다운/타임아웃)
    if (!error.response) {
      if (error.code === "ECONNABORTED")
        return "서버 응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.";
      return "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.";
    }

    // 3. 상태 코드별 원인 안내
    const status = error.response.status;
    if (status === 401) return "로그인이 만료됐어요. 다시 로그인해 주세요.";
    if (status === 403) return "이 작업을 할 권한이 없어요. 본인 계정인지 확인해 주세요.";
    if (status === 404) return "요청한 정보를 찾을 수 없어요. 삭제됐거나 주소가 잘못됐을 수 있어요.";
    if (status === 409) return "이미 처리된 요청이에요. 화면을 새로고침해 확인해 주세요.";
    if (status === 429) return "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.";
    if (status >= 500) return "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요. 계속되면 팀에 알려주세요.";
    return `요청이 거절됐어요 (오류 코드 ${status}). 입력값을 확인하고 다시 시도해 주세요.`;
  }
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
};