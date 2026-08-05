// ============================================================
// Mock Analytics Repository
// ============================================================

import type {
  AnalyticsSummary,
  HourlyDataPoint,
  DailyDataPoint,
  WeeklyDataPoint,
  MonthlyDataPoint,
  PrizeDistribution,
  WinningProbability,
  QueuePerformance,
  AverageWaitTime,
  MostPopularPrize,
  AnalyticsReport,
} from '../types';

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHourlyData(): HourlyDataPoint[] {
  return hours.map((hour) => ({
    hour,
    participants: randomInt(10, 150),
    draws: randomInt(1, 20),
  }));
}

function generateDailyData(daysCount = 30): DailyDataPoint[] {
  return Array.from({ length: daysCount }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (daysCount - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      participants: randomInt(50, 500),
      draws: randomInt(5, 40),
      winners: randomInt(1, 15),
    };
  });
}

function generateWeeklyData(weeksCount = 12): WeeklyDataPoint[] {
  return Array.from({ length: weeksCount }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (weeksCount - 1 - i) * 7);
    const weekNum = getWeekNumber(date);
    return {
      week: `W${weekNum}`,
      participants: randomInt(300, 3000),
      draws: randomInt(30, 200),
      winners: randomInt(10, 80),
    };
  });
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function generateMonthlyData(monthsCount = 6): MonthlyDataPoint[] {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return Array.from({ length: monthsCount }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (monthsCount - 1 - i));
    return {
      month: `${months[date.getMonth()]} ${date.getFullYear()}`,
      participants: randomInt(1000, 10000),
      draws: randomInt(100, 800),
      winners: randomInt(30, 300),
    };
  });
}

function generatePrizeDistribution(): PrizeDistribution[] {
  return [
    { name: 'Samsung Galaxy S25', value: 15, color: '#0ea5e9' },
    { name: 'Apple Watch Ultra', value: 12, color: '#a855f7' },
    { name: 'Dyson Airwrap', value: 10, color: '#22c55e' },
    { name: 'Sony WH-1000XM6', value: 8, color: '#f59e0b' },
    { name: 'Nintendo Switch 2', value: 7, color: '#ef4444' },
    { name: 'AirPods Pro 3', value: 6, color: '#ec4899' },
    { name: 'iPad Air', value: 5, color: '#14b8a6' },
    { name: 'MacBook Pro', value: 4, color: '#f97316' },
    { name: 'PS5 Pro', value: 3, color: '#6366f1' },
    { name: 'DJI Mini 5', value: 2, color: '#84cc16' },
  ];
}

function generateWinningProbabilities(): WinningProbability[] {
  return [
    { prizeName: 'Samsung Galaxy S25', probability: 2.5, participants: 40 },
    { prizeName: 'Apple Watch Ultra', probability: 3.0, participants: 33 },
    { prizeName: 'Dyson Airwrap', probability: 3.5, participants: 29 },
    { prizeName: 'Sony WH-1000XM6', probability: 4.0, participants: 25 },
    { prizeName: 'Nintendo Switch 2', probability: 4.5, participants: 22 },
    { prizeName: 'AirPods Pro 3', probability: 5.0, participants: 20 },
    { prizeName: 'iPad Air', probability: 6.0, participants: 17 },
    { prizeName: 'MacBook Pro', probability: 7.5, participants: 13 },
    { prizeName: 'PS5 Pro', probability: 10.0, participants: 10 },
    { prizeName: 'DJI Mini 5', probability: 15.0, participants: 7 },
  ];
}

function generateQueuePerformance(): QueuePerformance[] {
  return hours.slice(6, 22).map((time) => ({
    time,
    waitTime: randomInt(2, 25),
    queueLength: randomInt(5, 60),
  }));
}

function generateAverageWaitTimes(): AverageWaitTime[] {
  return days.map((day) => ({
    period: day,
    minutes: Math.round((Math.random() * 15 + 3) * 10) / 10,
  }));
}

function generateMostPopularPrizes(): MostPopularPrize[] {
  return [
    { name: 'Samsung Galaxy S25', entries: 245, percentage: 22.5 },
    { name: 'Apple Watch Ultra', entries: 198, percentage: 18.2 },
    { name: 'Dyson Airwrap', entries: 167, percentage: 15.3 },
    { name: 'Sony WH-1000XM6', entries: 145, percentage: 13.3 },
    { name: 'Nintendo Switch 2', entries: 132, percentage: 12.1 },
    { name: 'AirPods Pro 3', entries: 98, percentage: 9.0 },
    { name: 'iPad Air', entries: 56, percentage: 5.1 },
    { name: 'MacBook Pro', entries: 32, percentage: 2.9 },
    { name: 'PS5 Pro', entries: 12, percentage: 1.1 },
    { name: 'DJI Mini 5', entries: 5, percentage: 0.5 },
  ];
}

function generateSummary(): AnalyticsSummary {
  return {
    totalVisitors: 45280,
    registeredParticipants: 12850,
    completedDraws: 384,
    remainingPrizeStock: 156,
    conversionRate: 28.4,
    peakHour: '19:00 - 20:00',
    systemUptime: 99.97,
  };
}

export const mockAnalyticsRepository = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    await delay(300);
    return generateSummary();
  },

  getHourlyData: async (): Promise<HourlyDataPoint[]> => {
    await delay(300);
    return generateHourlyData();
  },

  getDailyData: async (daysCount?: number): Promise<DailyDataPoint[]> => {
    await delay(300);
    return generateDailyData(daysCount);
  },

  getWeeklyData: async (weeksCount?: number): Promise<WeeklyDataPoint[]> => {
    await delay(300);
    return generateWeeklyData(weeksCount);
  },

  getMonthlyData: async (monthsCount?: number): Promise<MonthlyDataPoint[]> => {
    await delay(300);
    return generateMonthlyData(monthsCount);
  },

  getPrizeDistribution: async (): Promise<PrizeDistribution[]> => {
    await delay(300);
    return generatePrizeDistribution();
  },

  getWinningProbabilities: async (): Promise<WinningProbability[]> => {
    await delay(300);
    return generateWinningProbabilities();
  },

  getQueuePerformance: async (): Promise<QueuePerformance[]> => {
    await delay(300);
    return generateQueuePerformance();
  },

  getAverageWaitTimes: async (): Promise<AverageWaitTime[]> => {
    await delay(300);
    return generateAverageWaitTimes();
  },

  getMostPopularPrizes: async (): Promise<MostPopularPrize[]> => {
    await delay(300);
    return generateMostPopularPrizes();
  },

  getFullReport: async (
    type: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<AnalyticsReport> => {
    await delay(500);
    const now = new Date();
    return {
      id: `RPT-${Date.now()}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analytics Report`,
      type,
      period: now.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      summary: generateSummary(),
      hourlyData: generateHourlyData(),
      dailyData: generateDailyData(),
      weeklyData: generateWeeklyData(),
      monthlyData: generateMonthlyData(),
      prizeDistribution: generatePrizeDistribution(),
      winningProbabilities: generateWinningProbabilities(),
      queuePerformance: generateQueuePerformance(),
      averageWaitTimes: generateAverageWaitTimes(),
      mostPopularPrizes: generateMostPopularPrizes(),
    };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
