// ============================================================
// Enterprise Operator Dashboard Store
// ============================================================

import { create } from 'zustand';
import type {
  DashboardStats,
  OperatorUser,
  Sponsor,
  Announcement,
  AuditLog,
  Report,
  Notification,
  PaginationState,
  FilterState,
} from '@/types/operator';

// Lists start empty and are filled from the API by the pages that use them.

// ─── Store ───────────────────────────────────────────────────────────

interface DashboardStore {
  // Stats
  stats: DashboardStats;
  loading: boolean;
  error: string | null;

  // Data
  users: OperatorUser[];
  sponsors: Sponsor[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  reports: Report[];
  notifications: Notification[];
  unreadCount: number;

  // Pagination
  userPagination: PaginationState;
  sponsorPagination: PaginationState;
  announcementPagination: PaginationState;
  auditLogPagination: PaginationState;
  reportPagination: PaginationState;

  // Filters
  userFilters: FilterState;
  sponsorFilters: FilterState;
  announcementFilters: FilterState;
  auditLogFilters: FilterState;
  reportFilters: FilterState;

  // Actions
  refreshStats: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User actions
  setUsers: (users: OperatorUser[]) => void;
  setUserFilters: (filters: Partial<FilterState>) => void;
  setUserPagination: (pagination: Partial<PaginationState>) => void;

  // Sponsor actions
  setSponsors: (sponsors: Sponsor[]) => void;
  setSponsorFilters: (filters: Partial<FilterState>) => void;
  setSponsorPagination: (pagination: Partial<PaginationState>) => void;

  // Announcement actions
  setAnnouncements: (announcements: Announcement[]) => void;
  setAnnouncementFilters: (filters: Partial<FilterState>) => void;
  setAnnouncementPagination: (pagination: Partial<PaginationState>) => void;

  // Audit log actions
  setAuditLogs: (logs: AuditLog[]) => void;
  setAuditLogFilters: (filters: Partial<FilterState>) => void;
  setAuditLogPagination: (pagination: Partial<PaginationState>) => void;

  // Report actions
  setReports: (reports: Report[]) => void;
  setReportFilters: (filters: Partial<FilterState>) => void;
  setReportPagination: (pagination: Partial<PaginationState>) => void;

  // Notification actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, _get) => ({
  // Initial Stats
  stats: {
    liveParticipants: 0,
    liveQueue: 0,
    remainingStock: 0,
    drawProgress: 0,
    connectionStatus: 'disconnected',
    tvStatus: 'offline',
    todayWinners: 0,
    recentActivities: [],
  },
  loading: false,
  error: null,

  // Data
  users: [],
  sponsors: [],
  announcements: [],
  auditLogs: [],
  reports: [],
  notifications: [],
  unreadCount: 0,

  // Pagination
  userPagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  sponsorPagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  announcementPagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  auditLogPagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
  reportPagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },

  // Filters
  userFilters: { search: '' },
  sponsorFilters: { search: '' },
  announcementFilters: { search: '' },
  auditLogFilters: { search: '' },
  reportFilters: { search: '' },

  // Actions
  // Stats come from the API; there is nothing to fabricate locally.
  refreshStats: () => {},

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // User actions
  setUsers: (users) => set({ users }),
  setUserFilters: (filters) =>
    set((state) => ({ userFilters: { ...state.userFilters, ...filters } })),
  setUserPagination: (pagination) =>
    set((state) => ({ userPagination: { ...state.userPagination, ...pagination } })),

  // Sponsor actions
  setSponsors: (sponsors) => set({ sponsors }),
  setSponsorFilters: (filters) =>
    set((state) => ({ sponsorFilters: { ...state.sponsorFilters, ...filters } })),
  setSponsorPagination: (pagination) =>
    set((state) => ({ sponsorPagination: { ...state.sponsorPagination, ...pagination } })),

  // Announcement actions
  setAnnouncements: (announcements) => set({ announcements }),
  setAnnouncementFilters: (filters) =>
    set((state) => ({ announcementFilters: { ...state.announcementFilters, ...filters } })),
  setAnnouncementPagination: (pagination) =>
    set((state) => ({
      announcementPagination: { ...state.announcementPagination, ...pagination },
    })),

  // Audit log actions
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAuditLogFilters: (filters) =>
    set((state) => ({ auditLogFilters: { ...state.auditLogFilters, ...filters } })),
  setAuditLogPagination: (pagination) =>
    set((state) => ({ auditLogPagination: { ...state.auditLogPagination, ...pagination } })),

  // Report actions
  setReports: (reports) => set({ reports }),
  setReportFilters: (filters) =>
    set((state) => ({ reportFilters: { ...state.reportFilters, ...filters } })),
  setReportPagination: (pagination) =>
    set((state) => ({ reportPagination: { ...state.reportPagination, ...pagination } })),

  // Notification actions
  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
