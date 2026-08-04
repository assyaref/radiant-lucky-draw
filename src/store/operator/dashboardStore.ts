// ============================================================
// Enterprise Operator Dashboard Store
// ============================================================

import { create } from 'zustand';
import type {
  DashboardStats,
  Activity,
  OperatorUser,
  Sponsor,
  Announcement,
  AuditLog,
  Report,
  Notification,
  PaginationState,
  FilterState,
} from '@/types/operator';

// ─── Mock Data ───────────────────────────────────────────────────────

const mockActivities: Activity[] = [
  { id: '1', type: 'draw', message: 'Grand Prize Draw #42 completed', timestamp: new Date(Date.now() - 60000).toISOString(), userName: 'System' },
  { id: '2', type: 'winner', message: 'John Doe won a Samsung Galaxy S25', timestamp: new Date(Date.now() - 120000).toISOString(), userName: 'System' },
  { id: '3', type: 'registration', message: '15 new participants registered', timestamp: new Date(Date.now() - 300000).toISOString(), userName: 'System' },
  { id: '4', type: 'queue', message: 'Queue advanced to #042', timestamp: new Date(Date.now() - 600000).toISOString(), userName: 'Operator' },
  { id: '5', type: 'prize', message: 'Prize stock updated: 5x Apple Watch', timestamp: new Date(Date.now() - 900000).toISOString(), userName: 'Admin' },
  { id: '6', type: 'system', message: 'System health check passed', timestamp: new Date(Date.now() - 1800000).toISOString(), userName: 'System' },
  { id: '7', type: 'draw', message: 'Consolation Draw #41 completed', timestamp: new Date(Date.now() - 3600000).toISOString(), userName: 'System' },
  { id: '8', type: 'winner', message: 'Jane Smith won a Dyson Airwrap', timestamp: new Date(Date.now() - 7200000).toISOString(), userName: 'System' },
];

const mockUsers: OperatorUser[] = [
  { id: '1', name: 'Admin User', email: 'admin@radiant.com', role: 'admin', status: 'active', lastLogin: new Date().toISOString(), createdAt: '2025-01-01T00:00:00Z' },
  { id: '2', name: 'Operator One', email: 'op1@radiant.com', role: 'operator', status: 'active', lastLogin: new Date(Date.now() - 3600000).toISOString(), createdAt: '2025-02-15T00:00:00Z' },
  { id: '3', name: 'Operator Two', email: 'op2@radiant.com', role: 'operator', status: 'active', lastLogin: new Date(Date.now() - 86400000).toISOString(), createdAt: '2025-03-01T00:00:00Z' },
  { id: '4', name: 'Viewer One', email: 'viewer@radiant.com', role: 'viewer', status: 'inactive', lastLogin: new Date(Date.now() - 604800000).toISOString(), createdAt: '2025-04-01T00:00:00Z' },
  { id: '5', name: 'Suspended User', email: 'suspended@radiant.com', role: 'operator', status: 'suspended', lastLogin: new Date(Date.now() - 2592000000).toISOString(), createdAt: '2025-01-15T00:00:00Z' },
];

const mockSponsors: Sponsor[] = [
  { id: '1', name: 'TechCorp', logo: 'https://via.placeholder.com/48', tier: 'platinum', website: 'https://techcorp.com', isActive: true, sortOrder: 1 },
  { id: '2', name: 'MegaStore', logo: 'https://via.placeholder.com/48', tier: 'gold', website: 'https://megastore.com', isActive: true, sortOrder: 2 },
  { id: '3', name: 'FreshBrands', logo: 'https://via.placeholder.com/48', tier: 'silver', website: 'https://freshbrands.com', isActive: true, sortOrder: 3 },
  { id: '4', name: 'LocalBiz', logo: 'https://via.placeholder.com/48', tier: 'standard', website: 'https://localbiz.com', isActive: false, sortOrder: 4 },
];

const mockAnnouncements: Announcement[] = [
  { id: '1', title: 'System Maintenance', message: 'Scheduled maintenance tonight at 2 AM. System will be offline for 30 minutes.', type: 'warning', priority: 2, isActive: true, expiresAt: new Date(Date.now() + 86400000).toISOString(), createdBy: 'Admin', createdAt: new Date().toISOString() },
  { id: '2', title: 'Grand Prize Update', message: 'The grand prize has been upgraded to include a luxury vacation package!', type: 'success', priority: 1, isActive: true, expiresAt: null, createdBy: 'Admin', createdAt: new Date().toISOString() },
  { id: '3', title: 'Emergency Shutdown', message: 'Emergency maintenance due to database issue. Please stand by.', type: 'emergency', priority: 3, isActive: false, expiresAt: null, createdBy: 'System', createdAt: new Date().toISOString() },
];

const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '1', userName: 'Admin User', action: 'login', entity: 'user', entityId: '1', metadata: null, ipAddress: '192.168.1.1', createdAt: new Date().toISOString() },
  { id: '2', userId: '1', userName: 'Admin User', action: 'draw_start', entity: 'draw', entityId: '42', metadata: { prize: 'Grand Prize' }, ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: '3', userId: '2', userName: 'Operator One', action: 'update', entity: 'prize', entityId: '5', metadata: { field: 'quantity', old: '10', new: '8' }, ipAddress: '192.168.1.2', createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: '4', userId: '1', userName: 'Admin User', action: 'create', entity: 'user', entityId: '6', metadata: { role: 'operator' }, ipAddress: '192.168.1.1', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '5', userId: '3', userName: 'Operator Two', action: 'logout', entity: 'user', entityId: '3', metadata: null, ipAddress: '192.168.1.3', createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const mockReports: Report[] = [
  { id: '1', name: 'Daily Participants Report', type: 'participants', format: 'pdf', generatedAt: new Date().toISOString(), generatedBy: 'Admin', dateRange: { start: '2026-07-29', end: '2026-07-30' }, url: '#' },
  { id: '2', name: 'Weekly Draw Summary', type: 'draws', format: 'csv', generatedAt: new Date(Date.now() - 86400000).toISOString(), generatedBy: 'System', dateRange: { start: '2026-07-23', end: '2026-07-30' }, url: '#' },
  { id: '3', name: 'Winner List - July', type: 'winners', format: 'excel', generatedAt: new Date(Date.now() - 172800000).toISOString(), generatedBy: 'Admin', dateRange: { start: '2026-07-01', end: '2026-07-30' }, url: '#' },
  { id: '4', name: 'Prize Inventory', type: 'prizes', format: 'pdf', generatedAt: new Date(Date.now() - 259200000).toISOString(), generatedBy: 'Admin', dateRange: { start: '2026-01-01', end: '2026-07-30' }, url: '#' },
];

const mockNotifications: Notification[] = [
  { id: '1', type: 'info', title: 'Draw Complete', message: 'Grand Prize Draw #42 completed successfully', timestamp: new Date(Date.now() - 60000).toISOString(), read: false },
  { id: '2', type: 'success', title: 'New Winner', message: 'John Doe won Samsung Galaxy S25', timestamp: new Date(Date.now() - 120000).toISOString(), read: false },
  { id: '3', type: 'warning', title: 'Low Stock', message: 'Apple Watch stock is running low (3 remaining)', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: '4', type: 'error', title: 'Connection Issue', message: 'TV display disconnected briefly', timestamp: new Date(Date.now() - 7200000).toISOString(), read: true },
  { id: '5', type: 'info', title: 'Queue Update', message: 'Queue advanced to position #042', timestamp: new Date(Date.now() - 14400000).toISOString(), read: true },
];

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
    liveParticipants: 247,
    liveQueue: 42,
    remainingStock: 156,
    drawProgress: 68,
    connectionStatus: 'connected',
    tvStatus: 'online',
    todayWinners: 12,
    recentActivities: mockActivities,
  },
  loading: false,
  error: null,

  // Data
  users: mockUsers,
  sponsors: mockSponsors,
  announcements: mockAnnouncements,
  auditLogs: mockAuditLogs,
  reports: mockReports,
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.read).length,

  // Pagination
  userPagination: { page: 1, pageSize: 10, total: mockUsers.length, totalPages: 1 },
  sponsorPagination: { page: 1, pageSize: 10, total: mockSponsors.length, totalPages: 1 },
  announcementPagination: { page: 1, pageSize: 10, total: mockAnnouncements.length, totalPages: 1 },
  auditLogPagination: { page: 1, pageSize: 10, total: mockAuditLogs.length, totalPages: 1 },
  reportPagination: { page: 1, pageSize: 10, total: mockReports.length, totalPages: 1 },

  // Filters
  userFilters: { search: '' },
  sponsorFilters: { search: '' },
  announcementFilters: { search: '' },
  auditLogFilters: { search: '' },
  reportFilters: { search: '' },

  // Actions
  refreshStats: () => {
    set((state) => ({
      stats: {
        ...state.stats,
        liveParticipants: Math.floor(Math.random() * 100) + 200,
        liveQueue: Math.floor(Math.random() * 20) + 30,
        todayWinners: Math.floor(Math.random() * 5) + 10,
        drawProgress: Math.min(100, Math.floor(Math.random() * 20) + 60),
      },
    }));
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // User actions
  setUsers: (users) => set({ users }),
  setUserFilters: (filters) => set((state) => ({ userFilters: { ...state.userFilters, ...filters } })),
  setUserPagination: (pagination) => set((state) => ({ userPagination: { ...state.userPagination, ...pagination } })),

  // Sponsor actions
  setSponsors: (sponsors) => set({ sponsors }),
  setSponsorFilters: (filters) => set((state) => ({ sponsorFilters: { ...state.sponsorFilters, ...filters } })),
  setSponsorPagination: (pagination) => set((state) => ({ sponsorPagination: { ...state.sponsorPagination, ...pagination } })),

  // Announcement actions
  setAnnouncements: (announcements) => set({ announcements }),
  setAnnouncementFilters: (filters) => set((state) => ({ announcementFilters: { ...state.announcementFilters, ...filters } })),
  setAnnouncementPagination: (pagination) => set((state) => ({ announcementPagination: { ...state.announcementPagination, ...pagination } })),

  // Audit log actions
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAuditLogFilters: (filters) => set((state) => ({ auditLogFilters: { ...state.auditLogFilters, ...filters } })),
  setAuditLogPagination: (pagination) => set((state) => ({ auditLogPagination: { ...state.auditLogPagination, ...pagination } })),

  // Report actions
  setReports: (reports) => set({ reports }),
  setReportFilters: (filters) => set((state) => ({ reportFilters: { ...state.reportFilters, ...filters } })),
  setReportPagination: (pagination) => set((state) => ({ reportPagination: { ...state.reportPagination, ...pagination } })),

  // Notification actions
  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
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
