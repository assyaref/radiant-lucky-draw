/**
 * Analytics Entity
 */

export interface DrawAnalytics {
  totalDraws: number;
  totalParticipants: number;
  totalPrizesAwarded: number;
  totalPrizeValue: number;
  averageDrawTime: number;
  topPrizes: Array<{ name: string; count: number; value: number }>;
  participationByHour: Array<{ hour: number; count: number }>;
  completionRate: number;
}

export interface DashboardStats {
  activeParticipants: number;
  queueLength: number;
  estimatedWait: number;
  drawsToday: number;
  prizesAwarded: number;
  systemUptime: number;
  activeConnections: number;
}
