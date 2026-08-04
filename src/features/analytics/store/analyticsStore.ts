// ============================================================
// Analytics Store
// ============================================================

import { create } from 'zustand';
import { analyticsService } from '../services/analyticsService';
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
  ExportFormat,
} from '../types';

interface AnalyticsStore {
  // Data
  summary: AnalyticsSummary | null;
  hourlyData: HourlyDataPoint[];
  dailyData: DailyDataPoint[];
  weeklyData: WeeklyDataPoint[];
  monthlyData: MonthlyDataPoint[];
  prizeDistribution: PrizeDistribution[];
  winningProbabilities: WinningProbability[];
  queuePerformance: QueuePerformance[];
  averageWaitTimes: AverageWaitTime[];
  mostPopularPrizes: MostPopularPrize[];
  report: AnalyticsReport | null;

  // UI State
  loading: boolean;
  error: string | null;
  selectedPeriod: 'daily' | 'weekly' | 'monthly';
  exporting: boolean;

  // Actions
  fetchAll: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchHourlyData: () => Promise<void>;
  fetchDailyData: () => Promise<void>;
  fetchWeeklyData: () => Promise<void>;
  fetchMonthlyData: () => Promise<void>;
  fetchPrizeDistribution: () => Promise<void>;
  fetchWinningProbabilities: () => Promise<void>;
  fetchQueuePerformance: () => Promise<void>;
  fetchAverageWaitTimes: () => Promise<void>;
  fetchMostPopularPrizes: () => Promise<void>;
  fetchReport: (type: 'daily' | 'weekly' | 'monthly') => Promise<void>;
  setSelectedPeriod: (period: 'daily' | 'weekly' | 'monthly') => void;
  exportData: (format: ExportFormat) => Promise<void>;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({

  // Initial Data
  summary: null,
  hourlyData: [],
  dailyData: [],
  weeklyData: [],
  monthlyData: [],
  prizeDistribution: [],
  winningProbabilities: [],
  queuePerformance: [],
  averageWaitTimes: [],
  mostPopularPrizes: [],
  report: null,

  // UI State
  loading: false,
  error: null,
  selectedPeriod: 'daily',
  exporting: false,

  // Actions
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [
        summary,
        hourlyData,
        dailyData,
        weeklyData,
        monthlyData,
        prizeDistribution,
        winningProbabilities,
        queuePerformance,
        averageWaitTimes,
        mostPopularPrizes,
      ] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getHourlyData(),
        analyticsService.getDailyData(),
        analyticsService.getWeeklyData(),
        analyticsService.getMonthlyData(),
        analyticsService.getPrizeDistribution(),
        analyticsService.getWinningProbabilities(),
        analyticsService.getQueuePerformance(),
        analyticsService.getAverageWaitTimes(),
        analyticsService.getMostPopularPrizes(),
      ]);
      set({
        summary,
        hourlyData,
        dailyData,
        weeklyData,
        monthlyData,
        prizeDistribution,
        winningProbabilities,
        queuePerformance,
        averageWaitTimes,
        mostPopularPrizes,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await analyticsService.getSummary();
      set({ summary });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchHourlyData: async () => {
    try {
      const hourlyData = await analyticsService.getHourlyData();
      set({ hourlyData });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchDailyData: async () => {
    try {
      const dailyData = await analyticsService.getDailyData();
      set({ dailyData });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchWeeklyData: async () => {
    try {
      const weeklyData = await analyticsService.getWeeklyData();
      set({ weeklyData });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchMonthlyData: async () => {
    try {
      const monthlyData = await analyticsService.getMonthlyData();
      set({ monthlyData });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchPrizeDistribution: async () => {
    try {
      const prizeDistribution = await analyticsService.getPrizeDistribution();
      set({ prizeDistribution });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchWinningProbabilities: async () => {
    try {
      const winningProbabilities = await analyticsService.getWinningProbabilities();
      set({ winningProbabilities });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchQueuePerformance: async () => {
    try {
      const queuePerformance = await analyticsService.getQueuePerformance();
      set({ queuePerformance });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchAverageWaitTimes: async () => {
    try {
      const averageWaitTimes = await analyticsService.getAverageWaitTimes();
      set({ averageWaitTimes });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchMostPopularPrizes: async () => {
    try {
      const mostPopularPrizes = await analyticsService.getMostPopularPrizes();
      set({ mostPopularPrizes });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchReport: async (type) => {
    set({ loading: true, error: null });
    try {
      const report = await analyticsService.getFullReport(type);
      set({ report, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  exportData: async (format) => {
    set({ exporting: true });
    try {
      const blob = await analyticsService.exportData({ format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${format === 'excel' ? 'xls' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      set({ exporting: false });
    } catch (err) {
      set({ error: (err as Error).message, exporting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
