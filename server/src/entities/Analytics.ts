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
  /** Figures for the dashboard widgets ("today" = Asia/Jakarta calendar day). */
  breakdown: {
    participants: { total: number; registeredToday: number; active: number };
    prizes: { total: number; available: number; claimed: number };
    queue: { waiting: number; ready: number; served: number };
    winners: { today: number; claimed: number; pending: number };
  };
}
