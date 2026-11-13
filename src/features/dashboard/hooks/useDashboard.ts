/**
 * Enterprise Admin Dashboard — useDashboard Hook
 *
 * Loads live figures from the API (analytics, prizes, winners, health) and
 * refreshes every 30 s. Sections without a data source stay empty rather than
 * showing invented numbers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '@design-system/index';
import api from '@api/client';
import { boothApi, type Winner } from '@api/booth';
import { prizeApi, type Prize } from '@api/prize';
import type {
  ActivityItem,
  DashboardData,
  DashboardState,
  DashboardStatus,
  DashboardWidgets,
  HealthMetric,
  RecentWinner,
  ServerStatusItem,
} from '../types';

interface DashboardStats {
  activeParticipants: number;
  queueLength: number;
  estimatedWait: number;
  drawsToday: number;
  prizesAwarded: number;
  breakdown?: DashboardWidgets;
}

const EMPTY_WIDGETS: DashboardWidgets = {
  participants: { total: 0, registeredToday: 0, active: 0 },
  prizes: { total: 0, available: 0, claimed: 0 },
  queue: { waiting: 0, ready: 0, served: 0 },
  winners: { today: 0, claimed: 0, pending: 0 },
};

interface DrawAnalytics {
  totalDraws: number;
  totalPrizesAwarded: number;
  completionRate?: number;
  participationByHour?: Array<{ hour: number; count: number }>;
}

interface HealthInfo {
  status: string;
  database?: { status: string; latencyMs?: number };
}

const REFRESH_MS = 30_000;

const AVATAR_COLORS = [
  colors.brand[500],
  colors.gold[400],
  colors.brand[300],
  colors.status.online,
  '#8b5cf6',
  '#06b6d4',
];

const TIER_COLORS: Record<string, string> = {
  grand: colors.gold[400],
  diamond: '#06b6d4',
  platinum: '#a78bfa',
  gold: colors.gold[400],
  silver: colors.brand[300],
  bronze: '#f59e0b',
  doorprize: colors.status.online,
};

const TIER_LABELS: Record<string, string> = {
  grand: 'Grand Prize',
  diamond: 'Diamond',
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  doorprize: 'Door Prize',
};

const QUICK_ACTIONS: DashboardData['quickActions'] = [
  {
    id: 'participant',
    label: 'Add Participant',
    description: 'Register a new participant',
    kind: 'participant',
  },
  {
    id: 'draw',
    label: 'Start Draw',
    description: 'Launch the lucky draw',
    kind: 'draw',
  },
  {
    id: 'prizes',
    label: 'Manage Prizes',
    description: 'Update prize inventory',
    kind: 'prizes',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Download reports',
    kind: 'export',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure dashboard',
    kind: 'settings',
  },
];

const EMPTY: DashboardData = {
  kpis: [],
  analyticsSeries: [],
  prizeDistribution: [],
  realtimeStats: [],
  recentWinners: [],
  activities: [],
  serverStatus: [],
  health: [],
  quickActions: QUICK_ACTIONS,
  widgets: EMPTY_WIDGETS,
};

function settled<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === 'fulfilled' ? r.value : null;
}

function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function build(
  stats: DashboardStats | null,
  draws: DrawAnalytics | null,
  prizes: Prize[] | null,
  winners: Winner[] | null,
  health: HealthInfo | null,
  apiLatencyMs: number | null,
): DashboardData {
  const prizeList = prizes ?? [];
  const remaining = prizeList.reduce((sum, p) => sum + (Number(p.remaining) || 0), 0);
  const quantity = prizeList.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

  const kpis: DashboardData['kpis'] = [
    {
      id: 'participants',
      label: 'Participants',
      value: stats?.activeParticipants ?? 0,
      icon: 'participants',
      trend: 0,
      direction: 'flat',
      color: 'blue',
    },
    {
      id: 'draw',
      label: "Today's Draw",
      value: stats?.drawsToday ?? 0,
      icon: 'draw',
      trend: 0,
      direction: 'flat',
      color: 'gold',
    },
    {
      id: 'prizes',
      label: 'Available Prizes',
      value: remaining,
      icon: 'prizes',
      trend: 0,
      direction: 'flat',
      color: 'green',
    },
    {
      id: 'queue',
      label: 'Current Queue',
      value: stats?.queueLength ?? 0,
      icon: 'queue',
      trend: 0,
      direction: 'flat',
      color: 'amber',
    },
  ];

  const byHour = (draws?.participationByHour ?? []).filter((h) => h.count > 0);
  const hours = byHour.length
    ? Array.from(
        { length: Math.max(...byHour.map((h) => h.hour)) - Math.min(...byHour.map((h) => h.hour)) + 1 },
        (_, i) => Math.min(...byHour.map((h) => h.hour)) + i,
      )
    : [];
  const countAt = new Map((draws?.participationByHour ?? []).map((h) => [h.hour, h.count]));
  const registrationPoints = hours.map((h) => ({
    label: `${String(h).padStart(2, '0')}:00`,
    value: countAt.get(h) ?? 0,
  }));

  const tierRemaining = new Map<string, number>();
  for (const p of prizeList) {
    tierRemaining.set(p.tier, (tierRemaining.get(p.tier) ?? 0) + (Number(p.remaining) || 0));
  }

  const recentWinners: RecentWinner[] = (winners ?? []).slice(0, 8).map((w) => ({
    id: w.id,
    name: w.participantName,
    prize: w.prizeName,
    time: timeLabel(w.announcedAt),
    status: w.claimStatus === 'claimed' ? 'claimed' : 'pending',
    avatarColor: hashColor(w.participantName ?? w.id),
  }));

  const activities: ActivityItem[] = (winners ?? []).slice(0, 6).map((w) => ({
    id: `win-${w.id}`,
    type: 'winner',
    message: `${w.participantName} memenangkan ${w.prizeName}`,
    timestamp: w.announcedAt,
    userName: 'Booth',
  }));

  const dbOk = health?.database?.status === 'healthy';
  const serverStatus: ServerStatusItem[] = [
    {
      id: 'api',
      label: 'API (Supabase Edge)',
      status: health ? 'green' : 'red',
      detail: health ? `${apiLatencyMs ?? '–'} ms` : 'Tidak terjangkau',
    },
    {
      id: 'database',
      label: 'Database',
      status: health ? (dbOk ? 'green' : 'red') : 'yellow',
      detail: health
        ? `Postgres · ${dbOk ? 'healthy' : 'bermasalah'}${
            health.database?.latencyMs !== undefined ? ` · ${health.database.latencyMs} ms` : ''
          }`
        : 'Tidak diketahui',
    },
  ];

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const healthMetrics: HealthMetric[] = [
    {
      id: 'stock',
      label: 'Stok hadiah tersisa',
      value: pct(remaining, quantity),
      detail: `${remaining} / ${quantity}`,
      color: 'green',
    },
    {
      id: 'awarded',
      label: 'Hadiah terbagi',
      value: pct(quantity - remaining, quantity),
      detail: `${Math.max(0, quantity - remaining)} hadiah`,
      color: 'gold',
    },
    {
      id: 'queue',
      label: 'Antrean',
      value: Math.min(100, stats?.queueLength ?? 0),
      detail: `${stats?.queueLength ?? 0} menunggu`,
      color: 'amber',
    },
  ];

  return {
    kpis,
    analyticsSeries: registrationPoints.length
      ? [
          {
            id: 'registrations',
            name: 'Registrations',
            color: colors.brand[500],
            points: registrationPoints,
          },
        ]
      : [],
    prizeDistribution: [...tierRemaining.entries()]
      .filter(([, v]) => v > 0)
      .map(([tier, value]) => ({
        label: TIER_LABELS[tier] ?? tier,
        value,
        color: TIER_COLORS[tier] ?? colors.brand[300],
      })),
    realtimeStats: registrationPoints,
    recentWinners,
    activities,
    serverStatus,
    health: healthMetrics,
    quickActions: QUICK_ACTIONS,
    widgets: stats?.breakdown ?? EMPTY_WIDGETS,
  };
}

/* ── Hook ─────────────────────────────────────────────────────────── */

export function useDashboard() {
  const [status, setStatus] = useState<DashboardStatus>('loading');
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const t0 = performance.now();
    const [stats, draws, prizes, winners, health] = await Promise.allSettled([
      api.get<{ data: DashboardStats }>('/analytics/dashboard'),
      api.get<{ data: DrawAnalytics }>('/analytics/draws'),
      prizeApi.list({ page: 1, limit: 100 }),
      boothApi.getPublicWinners(8),
      api.get<{ data: HealthInfo }>('/health'),
    ]);
    if (!alive.current) return;
    const latency = health.status === 'fulfilled' ? Math.round(performance.now() - t0) : null;
    setData(
      build(
        settled(stats)?.data ?? null,
        settled(draws)?.data ?? null,
        (settled(prizes)?.data as Prize[] | undefined) ?? null,
        (settled(winners)?.data as Winner[] | undefined) ?? null,
        settled(health)?.data ?? null,
        latency,
      ),
    );
    setLastUpdated(new Date().toISOString());
    setStatus('ready');
  }, []);

  const refresh = useCallback(() => {
    setStatus('loading');
    void load();
  }, [load]);

  useEffect(() => {
    alive.current = true;
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [load]);

  const state = useMemo<DashboardState>(
    () => ({ status, data, lastUpdated }),
    [status, data, lastUpdated],
  );

  return { ...state, refresh };
}
