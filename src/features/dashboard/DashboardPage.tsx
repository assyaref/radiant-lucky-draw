/**
 * Enterprise Admin Dashboard — DashboardPage
 *
 * M2.3A — Dashboard shell, navigation, statistics, charts, activity,
 * layout, and reusable dashboard architecture. Mock data only.
 *
 * Layout:
 *   Sidebar | TopNavigation
 *   ─────────────────────────
 *   DashboardHeader
 *   KPI Cards (Participants, Today's Draw, Available Prizes, Current Queue)
 *   Widgets (Participants, Prizes, Queue, Winners)
 *   Middle (Analytics Chart, Realtime Statistics, Prize Distribution)
 *   Bottom (Recent Winners, Activity Timeline, Server Status, System Health, Quick Actions)
 */

import { memo } from 'react';
import { AnimatedBackground } from '@components/layout';
import { colors, radius, shadows } from '@design-system/index';
import { DevelopmentModeBanner } from '@features/auth';
import { useDashboard } from './hooks/useDashboard';
import { Sidebar } from './components/Sidebar';
import { TopNavigation } from './components/TopNavigation';
import { DashboardHeader } from './components/DashboardHeader';
import { KpiCard } from './components/KpiCard';
import { AnalyticsChart } from './components/AnalyticsChart';
import { ActivityTimeline } from './components/ActivityTimeline';
import { RecentWinners } from './components/RecentWinners';
import { QuickActions } from './components/QuickActions';
import { ServerStatus } from './components/ServerStatus';
import { SystemHealth } from './components/SystemHealth';
import { LoadingDashboard } from './components/LoadingDashboard';
import { ParticipantsWidget } from './widgets/ParticipantsWidget';
import { PrizeWidget } from './widgets/PrizeWidget';
import { QueueWidget } from './widgets/QueueWidget';
import { WinnerWidget } from './widgets/WinnerWidget';

/* ── Section Panel ────────────────────────────────────────────────── */

function SectionPanel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-md ${className}`}
      style={{
        background: colors.glass.dark,
        borderColor: colors.glass.line,
        borderRadius: radius.panel,
        boxShadow: shadows.card,
      }}
    >
      <h3 className="mb-4 text-sm font-semibold" style={{ color: colors.text.primary }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Prize Distribution (donut) ───────────────────────────────────── */

function PrizeDistribution({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-3">
      {slices.map((slice) => {
        const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
        return (
          <div key={slice.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: slice.color, boxShadow: `0 0 6px ${slice.color}` }}
                />
                {slice.label}
              </span>
              <span className="font-semibold" style={{ color: colors.text.primary }}>
                {slice.value}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: colors.glass.light }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${slice.color}, ${slice.color}88)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Realtime Statistics ──────────────────────────────────────────── */

function RealtimeStats({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="flex h-40 items-end gap-2">
      {points.map((point) => {
        const height = Math.round((point.value / max) * 100);
        return (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${height}%`,
                background: `linear-gradient(180deg, ${colors.brand[400]}, ${colors.brand[600]})`,
                boxShadow: shadows.glow.blue.sm,
              }}
            />
            <span className="text-[9px]" style={{ color: colors.text.tertiary }}>
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export const DashboardPage = memo(function DashboardPage() {
  const { status, data, lastUpdated, refresh } = useDashboard();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Premium animated background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavigation />

          <main className="flex-1 space-y-6 overflow-y-auto p-5 lg:p-6">
            <DevelopmentModeBanner />
            {status === 'loading' ? (
              <LoadingDashboard />
            ) : (
              <>
                <DashboardHeader
                  title="Dashboard"
                  subtitle="Real-time overview of your lucky draw operations"
                  lastUpdated={lastUpdated}
                  onRefresh={refresh}
                />

                {/* Top KPI */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.kpis.map((kpi, index) => (
                    <KpiCard key={kpi.id} metric={kpi} delay={index * 0.08} />
                  ))}
                </div>

                {/* Widgets */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ParticipantsWidget total={1284} registeredToday={342} active={96} delay={0} />
                  <PrizeWidget available={96} claimed={42} total={138} delay={0.08} />
                  <QueueWidget waiting={57} ready={18} served={284} delay={0.16} />
                  <WinnerWidget today={42} claimed={31} pending={11} delay={0.24} />
                </div>

                {/* Middle */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <SectionPanel title="Analytics" className="lg:col-span-2">
                    <AnalyticsChart series={data.analyticsSeries} />
                  </SectionPanel>
                  <SectionPanel title="Prize Distribution">
                    <PrizeDistribution slices={data.prizeDistribution} />
                  </SectionPanel>
                </div>

                {/* Realtime statistics */}
                <SectionPanel title="Realtime Statistics">
                  <RealtimeStats points={data.realtimeStats} />
                </SectionPanel>

                {/* Bottom */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <SectionPanel title="Recent Winners">
                    <RecentWinners winners={data.recentWinners} />
                  </SectionPanel>
                  <SectionPanel title="Activity Timeline">
                    <ActivityTimeline activities={data.activities} />
                  </SectionPanel>
                  <div className="space-y-6">
                    <SectionPanel title="Server Status">
                      <ServerStatus items={data.serverStatus} />
                    </SectionPanel>
                    <SectionPanel title="System Health">
                      <SystemHealth metrics={data.health} />
                    </SectionPanel>
                  </div>
                </div>

                {/* Quick Actions */}
                <SectionPanel title="Quick Actions">
                  <QuickActions actions={data.quickActions} />
                </SectionPanel>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
});
