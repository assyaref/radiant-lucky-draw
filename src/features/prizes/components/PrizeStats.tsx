import type { PrizeStats as PrizeStatsType } from '../types';

interface PrizeStatsProps {
  stats: PrizeStatsType | null;
  loading: boolean;
}

export function PrizeStats({ stats, loading }: PrizeStatsProps) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const winningPercentage =
    stats.totalStock > 0 ? ((stats.totalDailyWinners / stats.totalStock) * 100).toFixed(2) : '0.00';

  const cards = [
    {
      label: 'Total Prizes',
      value: stats.totalPrizes,
      sub: `${stats.enabledPrizes} enabled · ${stats.disabledPrizes} disabled`,
      color: 'from-indigo-500/20 to-indigo-500/5',
      border: 'border-indigo-500/30',
      icon: '🏆',
    },
    {
      label: 'Total Stock',
      value: stats.totalStock.toLocaleString(),
      sub: `${stats.outOfStockCount} out of stock · ${stats.lowStockCount} low`,
      color: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/30',
      icon: '📦',
    },
    {
      label: 'Winning %',
      value: `${winningPercentage}%`,
      sub: `${stats.totalDailyWinners} winners today`,
      color: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/30',
      icon: '🎯',
    },
    {
      label: 'Tiers',
      value: Object.keys(stats.tierDistribution).length,
      sub: Object.entries(stats.tierDistribution)
        .map(([tier, count]) => `${tier}: ${count}`)
        .join(' · '),
      color: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/30',
      icon: '📊',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-4 relative overflow-hidden`}
        >
          <div className="absolute top-2 right-2 text-2xl opacity-20">{card.icon}</div>
          <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
          <div className="text-sm text-white/50">{card.label}</div>
          <div className="text-xs text-white/30 mt-1 truncate">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
