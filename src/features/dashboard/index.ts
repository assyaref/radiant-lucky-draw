/**
 * Enterprise Admin Dashboard Feature
 *
 * M2.3A — Dashboard shell, navigation, statistics, charts, activity,
 * layout, and reusable dashboard architecture. Mock data only.
 *
 * No CRUD, no backend, no API, no database, no Prisma, no Socket.IO,
 * no authentication changes. Foundation only.
 */

export { DashboardPage } from './DashboardPage';
export { useDashboard } from './hooks/useDashboard';

// Types
export type {
  KpiMetric,
  TrendDirection,
  ChartPoint,
  AnalyticsSeries,
  PrizeDistributionSlice,
  ActivityItem,
  ActivityType,
  RecentWinner,
  WinnerStatus,
  ServerStatusItem,
  ServerStatusLevel,
  HealthMetric,
  QuickAction,
  QuickActionKind,
  DashboardData,
  DashboardState,
  DashboardStatus,
} from './types';

// Reusable components
export { KpiCard } from './components/KpiCard';
export { AnalyticsChart } from './components/AnalyticsChart';
export { ActivityTimeline } from './components/ActivityTimeline';
export { RecentWinners } from './components/RecentWinners';
export { QuickActions } from './components/QuickActions';
export { ServerStatus } from './components/ServerStatus';
export { SystemHealth } from './components/SystemHealth';
export { EmptyState } from './components/EmptyState';
export { LoadingDashboard } from './components/LoadingDashboard';
export { Sidebar } from './components/Sidebar';
export { TopNavigation } from './components/TopNavigation';
export { DashboardHeader } from './components/DashboardHeader';

// Widgets
export { ParticipantsWidget } from './widgets/ParticipantsWidget';
export { PrizeWidget } from './widgets/PrizeWidget';
export { QueueWidget } from './widgets/QueueWidget';
export { WinnerWidget } from './widgets/WinnerWidget';
