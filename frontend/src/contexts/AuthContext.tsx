import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearAuth, getStoredUser, storeAuth } from '@/lib/authStorage';
import { authApi } from '@/services/authApi';
import type { AuthTokens, PublicUser } from '@/types/api';

interface AuthContextValue {
  user: PublicUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: PublicUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<PublicUser | null>(() => getStoredUser());

  const setUser = useCallback((next: PublicUser | null) => {
    setUserState(next);
    if (!next) {
      clearAuth();
      return;
    }
    const refresh = localStorage.getItem('drg_refresh_token');
    const access = localStorage.getItem('drg_access_token');
    if (access && refresh) {
      storeAuth(next, { accessToken: access, refreshToken: refresh } satisfies AuthTokens);
    } else {
      localStorage.setItem('drg_user', JSON.stringify(next));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    storeAuth(result.user, result.tokens);
    setUserState(result.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authApi.register(name, email, password);
    storeAuth(result.user, result.tokens);
    setUserState(result.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      setUser,
    }),
    [user, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
