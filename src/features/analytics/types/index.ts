// ============================================================
// Analytics Types
// ============================================================

export interface AnalyticsSummary {
  totalVisitors: number;
  registeredParticipants: number;
  completedDraws: number;
  remainingPrizeStock: number;
  conversionRate: number;
  peakHour: string;
  systemUptime: number;
}

export interface HourlyDataPoint {
  hour: string;
  participants: number;
  draws: number;
}

export interface DailyDataPoint {
  date: string;
  participants: number;
  draws: number;
  winners: number;
}

export interface WeeklyDataPoint {
  week: string;
  participants: number;
  draws: number;
  winners: number;
}

export interface MonthlyDataPoint {
  month: string;
  participants: number;
  draws: number;
  winners: number;
}

export interface PrizeDistribution {
  name: string;
  value: number;
  color: string;
}

export interface WinningProbability {
  prizeName: string;
  probability: number;
  participants: number;
}

export interface QueuePerformance {
  time: string;
  waitTime: number;
  queueLength: number;
}

export interface AverageWaitTime {
  period: string;
  minutes: number;
}

export interface MostPopularPrize {
  name: string;
  entries: number;
  percentage: number;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  period: string;
  generatedAt: string;
  summary: AnalyticsSummary;
  hourlyData: HourlyDataPoint[];
  dailyData: DailyDataPoint[];
  weeklyData: WeeklyDataPoint[];
  monthlyData: MonthlyDataPoint[];
  prizeDistribution: PrizeDistribution[];
  winningProbabilities: WinningProbability[];
  queuePerformance: QueuePerformance[];
  averageWaitTimes: AverageWaitTime[];
  mostPopularPrizes: MostPopularPrize[];
}

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: { start: string; end: string };
  includeCharts?: boolean;
}
