/**
 * Enterprise Admin Dashboard — useDashboard Hook
 *
 * M2.3A — Provides mock dashboard data with a simulated loading state.
 * No backend, API, or store integration. Foundation only.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { colors } from '@design-system/index';
import type { DashboardData, DashboardState, DashboardStatus } from '../types';

/* ── Mock Data ────────────────────────────────────────────────────── */

const mockData: DashboardData = {
  kpis: [
    {
      id: 'participants',
      label: 'Participants',
      value: 1284,
      icon: 'participants',
      trend: 12.4,
      direction: 'up',
      color: 'blue',
    },
    {
      id: 'draw',
      label: "Today's Draw",
      value: 342,
      icon: 'draw',
      trend: 8.1,
      direction: 'up',
      color: 'gold',
    },
    {
      id: 'prizes',
      label: 'Available Prizes',
      value: 96,
      icon: 'prizes',
      trend: -3.2,
      direction: 'down',
      color: 'green',
    },
    {
      id: 'queue',
      label: 'Current Queue',
      value: 57,
      icon: 'queue',
      trend: 0,
      direction: 'flat',
      color: 'amber',
    },
  ],

  analyticsSeries: [
    {
      id: 'registrations',
      name: 'Registrations',
      color: colors.brand[500],
      points: [
        { label: '08:00', value: 42 },
        { label: '09:00', value: 78 },
        { label: '10:00', value: 120 },
        { label: '11:00', value: 96 },
        { label: '12:00', value: 64 },
        { label: '13:00', value: 132 },
        { label: '14:00', value: 158 },
        { label: '15:00', value: 142 },
      ],
    },
    {
      id: 'draws',
      name: 'Draws',
      color: colors.gold[400],
      points: [
        { label: '08:00', value: 12 },
        { label: '09:00', value: 28 },
        { label: '10:00', value: 45 },
        { label: '11:00', value: 38 },
        { label: '12:00', value: 22 },
        { label: '13:00', value: 51 },
        { label: '14:00', value: 66 },
        { label: '15:00', value: 58 },
      ],
    },
  ],

  prizeDistribution: [
    { label: 'Grand Prize', value: 4, color: colors.gold[400] },
    { label: 'Gold Tier', value: 12, color: colors.brand[500] },
    { label: 'Silver Tier', value: 28, color: colors.brand[300] },
    { label: 'Bronze Tier', value: 52, color: colors.status.online },
  ],

  realtimeStats: [
    { label: '00:00', value: 20 },
    { label: '02:00', value: 35 },
    { label: '04:00', value: 28 },
    { label: '06:00', value: 52 },
    { label: '08:00', value: 74 },
    { label: '10:00', value: 61 },
    { label: '12:00', value: 88 },
    { label: '14:00', value: 96 },
  ],

  recentWinners: [
    {
      id: 'w1',
      name: 'Aisha Rahman',
      prize: 'Grand Prize — iPhone 15 Pro',
      time: '2 min ago',
      status: 'claimed',
      avatarColor: colors.gold[400],
    },
    {
      id: 'w2',
      name: 'Budi Santoso',
      prize: 'Gold Tier — Smart TV 55"',
      time: '8 min ago',
      status: 'pending',
      avatarColor: colors.brand[500],
    },
    {
      id: 'w3',
      name: 'Clara Wijaya',
      prize: 'Silver Tier — AirPods Pro',
      time: '15 min ago',
      status: 'claimed',
      avatarColor: colors.brand[300],
    },
    {
      id: 'w4',
      name: 'Dimas Pratama',
      prize: 'Bronze Tier — Power Bank',
      time: '22 min ago',
      status: 'expired',
      avatarColor: colors.status.online,
    },
    {
      id: 'w5',
      name: 'Eka Lestari',
      prize: 'Gold Tier — Smart TV 55"',
      time: '31 min ago',
      status: 'claimed',
      avatarColor: colors.gold[300],
    },
  ],

  activities: [
    {
      id: 'a1',
      type: 'winner',
      message: 'Aisha Rahman won the Grand Prize',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      userName: 'Operator',
    },
    {
      id: 'a2',
      type: 'draw',
      message: 'Lucky draw #42 completed',
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      userName: 'System',
    },
    {
      id: 'a3',
      type: 'registration',
      message: 'New participant registered: Budi Santoso',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      userName: 'Booth 1',
    },
    {
      id: 'a4',
      type: 'queue',
      message: 'Queue advanced — 12 participants moved to ready',
      timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
      userName: 'System',
    },
    {
      id: 'a5',
      type: 'prize',
      message: 'Prize stock updated: Silver Tier +10',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      userName: 'Admin',
    },
    {
      id: 'a6',
      type: 'system',
      message: 'Socket connection re-established',
      timestamp: new Date(Date.now() - 33 * 60000).toISOString(),
      userName: 'System',
    },
  ],

  serverStatus: [
    { id: 'api', label: 'API', status: 'green', detail: '24ms latency' },
    { id: 'database', label: 'Database', status: 'green', detail: 'PostgreSQL · healthy' },
    { id: 'socket', label: 'Socket', status: 'green', detail: '1,204 connected' },
    { id: 'railway', label: 'Railway', status: 'yellow', detail: 'Deploying v1.4.2' },
    { id: 'storage', label: 'Storage', status: 'green', detail: '68% capacity' },
  ],

  health: [
    { id: 'cpu', label: 'CPU', value: 42, detail: '4.2 / 8 cores', color: 'blue' },
    { id: 'memory', label: 'Memory', value: 68, detail: '5.4 / 8 GB', color: 'gold' },
    { id: 'response', label: 'Response Time', value: 24, detail: '24ms avg', color: 'green' },
    { id: 'queue', label: 'Queue Length', value: 57, detail: '57 waiting', color: 'amber' },
    { id: 'storage', label: 'Storage', value: 68, detail: '68 GB / 100 GB', color: 'red' },
  ],

  quickActions: [
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
  ],
};

/* ── Hook ─────────────────────────────────────────────────────────── */

export function useDashboard() {
  const [status, setStatus] = useState<DashboardStatus>('loading');
  const [data, setData] = useState<DashboardData>(mockData);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setStatus('loading');
    // Simulate async fetch
    const timer = setTimeout(() => {
      setData(mockData);
      setLastUpdated(new Date().toISOString());
      setStatus('ready');
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initial load — status already starts as 'loading', so no synchronous
    // setState is needed here. Only schedule the async completion.
    const timer = setTimeout(() => {
      setData(mockData);
      setLastUpdated(new Date().toISOString());
      setStatus('ready');
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const state = useMemo<DashboardState>(
    () => ({ status, data, lastUpdated }),
    [status, data, lastUpdated],
  );

  return { ...state, refresh };
}
