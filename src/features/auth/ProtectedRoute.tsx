/**
 * ProtectedRoute
 *
 * Route guard that redirects unauthenticated users to /login and
 * enforces role/permission requirements for protected areas.
 */

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Permission, Role } from './types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
  permissions?: Permission[];
  /** Redirect target when not authenticated. Defaults to /login. */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  roles,
  permissions,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-center min-h-screen bg-dark-surface">
        <div className="text-sky-400 text-sm tracking-widest uppercase animate-pulse">
          Verifying session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (permissions && permissions.length > 0 && !permissions.every(hasPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
