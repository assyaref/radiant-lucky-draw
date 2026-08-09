import type { Prize } from '@/engine/types/prize';
import { PrizeTier } from '@/engine/types/prize';
import { normalizeImageUrl } from '@/utils';

interface PrizePreviewProps {
  prize: Prize;
  /** Show compact version for inline display */
  compact?: boolean;
}

const TIER_LABELS: Record<PrizeTier, string> = {
  [PrizeTier.GRAND]: 'Grand Prize',
  [PrizeTier.VERY_RARE]: 'Very Rare',
  [PrizeTier.RARE]: 'Rare',
  [PrizeTier.NORMAL]: 'Normal',
  [PrizeTier.COMMON]: 'Common',
};

const TIER_GRADIENTS: Record<PrizeTier, string> = {
  [PrizeTier.GRAND]: 'from-amber-500/30 via-amber-500/10 to-transparent',
  [PrizeTier.VERY_RARE]: 'from-purple-500/30 via-purple-500/10 to-transparent',
  [PrizeTier.RARE]: 'from-blue-500/30 via-blue-500/10 to-transparent',
  [PrizeTier.NORMAL]: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  [PrizeTier.COMMON]: 'from-slate-500/30 via-slate-500/10 to-transparent',
};

export function PrizePreview({ prize, compact = false }: PrizePreviewProps) {
  const stockStatus = prize.stock === 0 ? 'out' : prize.stock <= 10 ? 'low' : 'in';
  const stockColor =
    stockStatus === 'out'
      ? 'text-red-400'
      : stockStatus === 'low'
        ? 'text-amber-400'
        : 'text-emerald-400';
  const stockBarColor =
    stockStatus === 'out'
      ? 'bg-red-500'
      : stockStatus === 'low'
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 overflow-hidden"
          style={{ backgroundColor: `${prize.color}20` }}
        >
          {prize.image ? (
            <img src={normalizeImageUrl(prize.image)} alt={prize.name} className="w-full h-full object-cover" />
          ) : (
            <span>🎁</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">{prize.name}</div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className={stockColor}>{prize.stock} left</span>
            <span>·</span>
            <span>Weight: {prize.weight}</span>
          </div>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${prize.enabled ? 'bg-emerald-400' : 'bg-red-400'}`}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
      {/* Header gradient */}
      <div
        className={`h-24 relative bg-gradient-to-br ${TIER_GRADIENTS[prize.tier]}`}
        style={{ background: `linear-gradient(135deg, ${prize.color}40, ${prize.color}10)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: prize.color, boxShadow: `0 0 40px ${prize.color}60` }}
          >
            {prize.image ? (
              <img
                src={normalizeImageUrl(prize.image)}
                alt={prize.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span>🏆</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-14 text-center">
        <h3 className="text-xl font-bold text-white mb-1">{prize.name}</h3>
        {prize.description && (
          <p className="text-sm text-white/50 mb-4 line-clamp-2">{prize.description}</p>
        )}

        <div className="flex items-center justify-center gap-3 mb-4">
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: `${prize.color}30`, color: prize.color }}
          >
            {TIER_LABELS[prize.tier]}
          </span>
          <span className="text-xs text-white/40">
            Weight: <strong className="text-white/70">{prize.weight}</strong>
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 rounded-lg bg-white/5">
            <div className={`text-lg font-bold ${stockColor}`}>{prize.stock}</div>
            <div className="text-xs text-white/40">Stock</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-white">{prize.dailyWinnerCount}</div>
            <div className="text-xs text-white/40">Today</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-lg font-bold text-white">{prize.maxDailyWinner || '∞'}</div>
            <div className="text-xs text-white/40">Daily Limit</div>
          </div>
        </div>

        {/* Stock bar */}
        <div className="mt-3 w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${stockBarColor}`}
            style={{ width: `${Math.min((prize.stock / Math.max(prize.stock, 10)) * 100, 100)}%` }}
          />
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${prize.enabled ? 'bg-emerald-400' : 'bg-red-400'}`}
          />
          <span className="text-xs text-white/50">{prize.enabled ? 'Active' : 'Disabled'}</span>
          <span className="text-xs text-white/30 mx-1">|</span>
          <span className="text-xs text-white/50">Order #{prize.displayOrder}</span>
        </div>
      </div>
    </div>
  );
}
