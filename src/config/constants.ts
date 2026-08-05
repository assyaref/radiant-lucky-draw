export const APP_NAME = 'Radiant Lucky Draw';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'A radiant lucky draw application';
export const COMPANY_NAME = 'Radiant';

export const DRAW_DEFAULTS = {
  MIN_TICKETS: 1,
  MAX_TICKETS: 10000,
  MIN_PRIZES: 1,
  MAX_PRIZES: 100,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
};

export const ANIMATION = {
  DURATION_FAST: 200,
  DURATION_NORMAL: 400,
  DURATION_SLOW: 600,
};

export const STORAGE_KEYS = {
  THEME: 'radiant-theme',
  AUTH: 'radiant-auth',
  SETTINGS: 'radiant-settings',
} as const;
