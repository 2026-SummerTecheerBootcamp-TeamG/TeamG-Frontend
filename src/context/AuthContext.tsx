import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      login: (u) => setUser(u),
      logout: () => setUser(null),
      updateProfile: (patch) =>
        setUser((prev) => (prev ? { ...prev, ...patch } : prev)),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}