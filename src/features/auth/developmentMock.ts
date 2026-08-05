import { PERMISSIONS, ROLES, type AuthUser, type LoginCredentials } from './types';

const DEVELOPMENT_MOCK_SESSION_KEY = 'radiant-lucky-draw:development-mock-session';
const DEVELOPMENT_LOGIN_EMAIL = 'admin@radiantgroup.com';

export const DEVELOPMENT_LOGIN_CREDENTIALS = {
  email: DEVELOPMENT_LOGIN_EMAIL,
  password: 'Admin123!',
} as const;

export const developmentMockUser: AuthUser = {
  id: 'development-admin',
  username: 'Admin',
  email: DEVELOPMENT_LOGIN_EMAIL,
  role: ROLES.SUPER_ADMIN,
  permissions: Object.values(PERMISSIONS),
};

export function hasPersistedDevelopmentMockSession(): boolean {
  try {
    return window.localStorage.getItem(DEVELOPMENT_MOCK_SESSION_KEY) === 'enabled';
  } catch {
    return false;
  }
}

export function persistDevelopmentMockSession(): void {
  try {
    window.localStorage.setItem(DEVELOPMENT_MOCK_SESSION_KEY, 'enabled');
  } catch {
    // Development authentication remains available when storage is disabled.
  }
}

export function clearPersistedDevelopmentMockSession(): void {
  try {
    window.localStorage.removeItem(DEVELOPMENT_MOCK_SESSION_KEY);
  } catch {
    // There is no recoverable action when storage is disabled.
  }
}

export function hasDevelopmentCredentials({ email, password }: LoginCredentials): boolean {
  return (
    email.trim().toLowerCase() === DEVELOPMENT_LOGIN_EMAIL &&
    password === DEVELOPMENT_LOGIN_CREDENTIALS.password
  );
}
