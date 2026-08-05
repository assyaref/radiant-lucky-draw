// ============================================================
// Operator Dashboard Page
// ============================================================

import { useEffect } from 'react';
import { useDashboardStore } from '@store/operator/dashboardStore';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers,
  HiOutlineQueueList,
  HiOutlineCube,
  HiOutlineTrophy,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
} from 'react-icons/hi2';

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-dark-border bg-dark-surface-secondary p-5 hover:border-dark-border/80 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-dark-text-tertiary">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trendUp ? (
                <HiOutlineArrowTrendingUp className="w-3.5 h-3.5 text-success-500" />
              ) : (
                <HiOutlineArrowTrendingDown className="w-3.5 h-3.5 text-danger-500" />
              )}
              <span className={trendUp ? 'text-success-500' : 'text-danger-500'}>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

function ActivityItem({
  activity,
}: {
  activity: { type: string; message: string; timestamp: string; userName?: string };
}) {
  const typeColors: Record<string, string> = {
    draw: 'bg-primary-500/20 text-primary-400',
    winner: 'bg-success-500/20 text-success-400',
    registration: 'bg-secondary-500/20 text-secondary-400',
    queue: 'bg-warning-500/20 text-warning-400',
    system: 'bg-dark-text-tertiary/20 text-dark-text-tertiary',
    prize: 'bg-accent-500/20 text-accent-400',
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-dark-border/50 last:border-0">
      <span
        className={`mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full ${typeColors[activity.type] || typeColors.system}`}
      >
        {activity.type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-dark-text-secondary truncate">{activity.message}</p>
        <p className="text-xs text-dark-text-tertiary/50 mt-0.5">
          {new Date(activity.timestamp).toLocaleTimeString()}
          {activity.userName && ` · ${activity.userName}`}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { stats, refreshStats } = useDashboardStore();

  useEffect(() => {
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-dark-text-tertiary mt-1">
            Real-time overview of your lucky draw operations
          </p>
        </div>
        <button
          onClick={refreshStats}
          className="px-4 py-2 rounded-lg bg-dark-surface-tertiary text-dark-text-secondary hover:text-white hover:bg-dark-surface-tertiary/80 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Live Participants"
          value={stats.liveParticipants}
          icon={<HiOutlineUsers className="w-5 h-5 text-primary-400" />}
          trend="+12%"
          trendUp
          color="bg-primary-500/10"
        />
        <StatCard
          title="Live Queue"
          value={stats.liveQueue}
          icon={<HiOutlineQueueList className="w-5 h-5 text-warning-400" />}
          trend="-3%"
          trendUp={false}
          color="bg-warning-500/10"
        />
        <StatCard
          title="Remaining Stock"
          value={stats.remainingStock}
          icon={<HiOutlineCube className="w-5 h-5 text-secondary-400" />}
          color="bg-secondary-500/10"
        />
        <StatCard
          title="Today's Winners"
          value={stats.todayWinners}
          icon={<HiOutlineTrophy className="w-5 h-5 text-success-400" />}
          trend="+5"
          trendUp
          color="bg-success-500/10"
        />
      </div>

      {/* Progress & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draw Progress */}
        <div className="lg:col-span-2 rounded-xl border border-dark-border bg-dark-surface-secondary p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Draw Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-dark-text-secondary">Overall Progress</span>
                <span className="text-white font-medium">{stats.drawProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-dark-surface-tertiary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.drawProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { label: 'Pending', value: '24', color: 'bg-warning-500' },
                { label: 'In Progress', value: '18', color: 'bg-primary-500' },
                { label: 'Completed', value: '42', color: 'bg-success-500' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-lg font-bold text-white">{item.value}</span>
                  </div>
                  <p className="text-xs text-dark-text-tertiary mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-white">Recent Activities</h3>
          </div>
          <div className="divide-y divide-dark-border/50 max-h-[320px] overflow-y-auto">
            {stats.recentActivities.slice(0, 6).map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-dark-border bg-dark-surface-secondary p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Start Draw', icon: '🎯', color: 'from-primary-500 to-secondary-500' },
            { label: 'Add Prize', icon: '🎁', color: 'from-success-500 to-emerald-500' },
            { label: 'View Queue', icon: '👥', color: 'from-warning-500 to-orange-500' },
            { label: 'Generate Report', icon: '📊', color: 'from-secondary-500 to-purple-500' },
          ].map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-dark-surface-tertiary/50 hover:bg-dark-surface-tertiary transition-colors text-left"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm text-dark-text-secondary hover:text-white transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
