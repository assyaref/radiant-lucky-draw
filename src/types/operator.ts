// ============================================================
// Enterprise Operator Dashboard Types
// ============================================================

export interface DashboardStats {
  liveParticipants: number;
  liveQueue: number;
  remainingStock: number;
  drawProgress: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  tvStatus: 'online' | 'offline' | 'standby';
  todayWinners: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: 'draw' | 'winner' | 'registration' | 'queue' | 'system' | 'prize';
  message: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface OperatorUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'platinum' | 'gold' | 'silver' | 'standard';
  website: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'emergency';
  priority: number;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'participants' | 'draws' | 'winners' | 'prizes' | 'queue';
  format: 'pdf' | 'csv' | 'excel';
  generatedAt: string;
  generatedBy: string;
  dateRange: { start: string; end: string };
  url: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FilterState {
  search: string;
  status?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface CommandPaletteItem {
  id: string;
  label: string;
  description: string;
  category: string;
  shortcut?: string;
  action: () => void;
}
