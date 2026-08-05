/**
 * Enterprise Admin Dashboard — Type Definitions
 *
 * M2.3A — Dashboard shell, navigation, statistics, charts, activity,
 * layout, and reusable dashboard architecture. Mock data only.
 */

/* ── KPI ──────────────────────────────────────────────────────────── */

export type TrendDirection = 'up' | 'down' | 'flat';

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  icon: 'participants' | 'draw' | 'prizes' | 'queue';
  trend: number;
  direction: TrendDirection;
  color: 'blue' | 'gold' | 'green' | 'amber';
  suffix?: string;
  prefix?: string;
}

/* ── Charts ───────────────────────────────────────────────────────── */

export interface ChartPoint {
  label: string;
  value: number;
}

export interface AnalyticsSeries {
  id: string;
  name: string;
  color: string;
  points: ChartPoint[];
}

export interface PrizeDistributionSlice {
  label: string;
  value: number;
  color: string;
}

/* ── Activity ─────────────────────────────────────────────────────── */

export type ActivityType = 'draw' | 'winner' | 'registration' | 'queue' | 'system' | 'prize';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  userName?: string;
}

/* ── Winners ──────────────────────────────────────────────────────── */

export type WinnerStatus = 'claimed' | 'pending' | 'expired';

export interface RecentWinner {
  id: string;
  name: string;
  prize: string;
  time: string;
  status: WinnerStatus;
  avatarColor: string;
}

/* ── Server Status ────────────────────────────────────────────────── */

export type ServerStatusLevel = 'green' | 'yellow' | 'red';

export interface ServerStatusItem {
  id: string;
  label: string;
  status: ServerStatusLevel;
  detail: string;
}

/* ── System Health ────────────────────────────────────────────────── */

export interface HealthMetric {
  id: string;
  label: string;
  value: number; // 0 - 100
  detail: string;
  color: 'blue' | 'gold' | 'green' | 'amber' | 'red';
}

/* ── Quick Actions ────────────────────────────────────────────────── */

export type QuickActionKind = 'participant' | 'draw' | 'prizes' | 'export' | 'settings';

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  kind: QuickActionKind;
}

/* ── Dashboard State ──────────────────────────────────────────────── */

export interface DashboardData {
  kpis: KpiMetric[];
  analyticsSeries: AnalyticsSeries[];
  prizeDistribution: PrizeDistributionSlice[];
  realtimeStats: ChartPoint[];
  recentWinners: RecentWinner[];
  activities: ActivityItem[];
  serverStatus: ServerStatusItem[];
  health: HealthMetric[];
  quickActions: QuickAction[];
}

export type DashboardStatus = 'loading' | 'ready' | 'error';

export interface DashboardState {
  status: DashboardStatus;
  data: DashboardData;
  lastUpdated: string | null;
}
