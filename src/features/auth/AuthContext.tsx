/**
 * Auth Context
 *
 * Provides authentication state and actions to the whole app.
 * On mount it attempts to restore the session via /auth/me.
 * Access tokens are kept in memory; refresh tokens live in an
 * httpOnly cookie managed by the server.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from './api';
import type { AuthUser, LoginCredentials, Permission, Role } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromise = useRef<Promise<void> | null>(null);

  const restoreSession = useCallback(async () => {
    try {
      // On a fresh page load the in-memory access token is gone, so we
      // restore the session via the refresh token cookie first, then
      // fetch the current user.
      await authApi.refresh();
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await authApi.login(credentials);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        const res = await authApi.refresh();
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, []);

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);

  const hasPermission = useCallback(
    (permission: Permission) => user?.permissions?.includes(permission) ?? false,
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]) =>
      permissions.some((p) => user?.permissions?.includes(p) ?? false),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshSession,
      hasRole,
      hasPermission,
      hasAnyPermission,
    }),
    [user, isLoading, login, logout, refreshSession, hasRole, hasPermission, hasAnyPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
