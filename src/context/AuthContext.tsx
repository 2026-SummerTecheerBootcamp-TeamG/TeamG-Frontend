import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchProfile, type Profile } from "@/api/auth";
import { tokenStorage } from "@/lib/api";

/** 로그인한 사용자 (프로필 조회 API 응답 기준) */
export interface User {
  userId: number;
  nickname: string;
  email: string;
  nationality: string;
  defaultDeparture: { city: string; iata: string };
}

interface AuthValue {
  user: User | null;
  isLoggedIn: boolean;
  /** 새로고침 직후, 저장된 토큰으로 세션 복원을 시도하는 동안 true */
  isLoading: boolean;
  /** access_token(+refresh_token)을 받아 저장하고, 프로필을 조회해 user를 채운다 */
  login: (accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const toUser = (profile: Profile): User => ({
  userId: profile.user_id,
  nickname: profile.nickname,
  email: profile.email,
  nationality: profile.nationality,
  defaultDeparture: {
    city: profile.default_departure.city,
    iata: profile.default_departure.iata ?? "",
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 새로고침 시 저장된 access_token이 있으면 프로필을 다시 조회해 로그인 상태를 복원
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchProfile()
      .then((profile) => setUser(toUser(profile)))
      .catch(() => {
        // 토큰 만료/무효 → 토큰과 user를 모두 비워 확실히 로그아웃 상태로 만든다
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (accessToken: string, refreshToken?: string) => {
    tokenStorage.set(accessToken, refreshToken);
    const profile = await fetchProfile();
    setUser(toUser(profile));
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      isLoading,
      login,
      logout,
      updateProfile: (patch) =>
        setUser((prev) => (prev ? { ...prev, ...patch } : prev)),
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}