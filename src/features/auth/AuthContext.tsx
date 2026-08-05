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
import { clearAccessToken } from '@api/tokenStore';
import { ApiClientError } from '@api/client';
import { env } from '@config/env';
import * as authApi from './api';
import {
  clearPersistedDevelopmentMockSession,
  developmentMockUser,
  hasDevelopmentCredentials,
  hasPersistedDevelopmentMockSession,
  persistDevelopmentMockSession,
} from './developmentMock';
import type { AuthUser, LoginCredentials, Permission, Role } from './types';

function isBackendAuthenticationUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.status === 0 || error.status === 404 || error.status >= 500)
  );
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isMockAuthentication: boolean;
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
  const [isMockAuthentication, setIsMockAuthentication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (env.IS_DEVELOPMENT && hasPersistedDevelopmentMockSession()) {
        if (!cancelled) {
          setUser(developmentMockUser);
          setIsMockAuthentication(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        // On a fresh page load the in-memory access token is gone, so we
        // restore the session via the refresh token cookie first, then
        // fetch the current user.
        await authApi.refresh();
        const me = await authApi.getMe();
        if (!cancelled) {
          setUser(me);
          setIsMockAuthentication(false);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setIsMockAuthentication(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const res = await authApi.login(credentials);
      clearPersistedDevelopmentMockSession();
      setIsMockAuthentication(false);
      setUser(res.user);
      return res.user;
    } catch (error) {
      if (
        env.IS_DEVELOPMENT &&
        hasDevelopmentCredentials(credentials) &&
        isBackendAuthenticationUnavailable(error)
      ) {
        clearAccessToken();
        persistDevelopmentMockSession();
        setIsMockAuthentication(true);
        setUser(developmentMockUser);
        return developmentMockUser;
      }

      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    clearPersistedDevelopmentMockSession();
    setIsMockAuthentication(false);

    if (isMockAuthentication) {
      clearAccessToken();
      setUser(null);
      return;
    }

    try {
      await authApi.logout();
    } catch {
      // Local sign-out must complete even when the auth service is unavailable.
    } finally {
      setUser(null);
    }
  }, [isMockAuthentication]);

  const refreshSession = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        if (isMockAuthentication) {
          setUser(developmentMockUser);
          return;
        }

        const res = await authApi.refresh();
        setUser(res.user);
        setIsMockAuthentication(false);
      } catch {
        setUser(null);
        setIsMockAuthentication(false);
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [isMockAuthentication]);

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);

  const hasPermission = useCallback(
    (permission: Permission) => user?.permissions?.includes(permission) ?? false,
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]) => permissions.some((p) => user?.permissions?.includes(p) ?? false),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isMockAuthentication,
      isLoading,
      login,
      logout,
      refreshSession,
      hasRole,
      hasPermission,
      hasAnyPermission,
    }),
    [
      user,
      isMockAuthentication,
      isLoading,
      login,
      logout,
      refreshSession,
      hasRole,
      hasPermission,
      hasAnyPermission,
    ],
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
