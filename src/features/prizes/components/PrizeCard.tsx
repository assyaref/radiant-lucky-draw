import type { Prize } from '@/engine/types/prize';

import { PrizeTier } from '@/engine/types/prize';

interface PrizeCardProps {
  prize: Prize;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (prize: Prize) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  /** Drag handle props for DnD */
  dragHandleProps?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  /** Whether this card is being dragged */
  isDragging?: boolean;
}

const TIER_LABELS: Record<PrizeTier, string> = {
  [PrizeTier.GRAND]: 'Grand',
  [PrizeTier.VERY_RARE]: 'Very Rare',
  [PrizeTier.RARE]: 'Rare',
  [PrizeTier.NORMAL]: 'Normal',
  [PrizeTier.COMMON]: 'Common',
};

const TIER_BADGE_COLORS: Record<PrizeTier, string> = {
  [PrizeTier.GRAND]: 'bg-amber-500 text-black',
  [PrizeTier.VERY_RARE]: 'bg-purple-500 text-white',
  [PrizeTier.RARE]: 'bg-blue-500 text-white',
  [PrizeTier.NORMAL]: 'bg-emerald-500 text-white',
  [PrizeTier.COMMON]: 'bg-slate-500 text-white',
};

export function PrizeCard({
  prize,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
  dragHandleProps,
  isDragging,
}: PrizeCardProps) {
  const stockStatus = prize.stock === 0 ? 'out' : prize.stock <= 10 ? 'low' : 'in';
  const stockColor = stockStatus === 'out' ? 'text-red-400' : stockStatus === 'low' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div
      className={`
        relative group rounded-xl border transition-all duration-200 p-4
        ${selected ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}
        ${!prize.enabled ? 'opacity-50' : ''}
        ${isDragging ? 'opacity-60 ring-2 ring-indigo-500/50 scale-[1.02] shadow-xl shadow-indigo-500/20 z-50' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        className="absolute top-3 left-3 z-10 flex items-center gap-1"
      >
        <button
          className="cursor-grab active:cursor-grabbing p-1 rounded text-white/20 hover:text-white/50 transition-colors -ml-1"
          title="Drag to reorder"
          {...dragHandleProps}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="11" cy="12" r="1.5" />
          </svg>
        </button>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(prize.id)}
          className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-indigo-500"
        />
      </div>

      {/* Color indicator */}
      <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl" style={{ backgroundColor: prize.color }} />

      <div className="flex items-start gap-4 mt-2">
        {/* Image placeholder */}
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl shrink-0 overflow-hidden"
          style={{ backgroundColor: `${prize.color}20` }}
        >
          {prize.image ? (
            <img src={prize.image} alt={prize.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span>🎁</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{prize.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE_COLORS[prize.tier]}`}>
              {TIER_LABELS[prize.tier]}
            </span>
          </div>

          {prize.description && (
            <p className="text-sm text-white/50 line-clamp-1 mb-2">{prize.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Weight: <strong className="text-white/70">{prize.weight}</strong></span>
            <span>
              Stock: <strong className={stockColor}>{prize.stock}</strong>
            </span>
            <span>
              Daily: <strong className="text-white/70">{prize.dailyWinnerCount}/{prize.maxDailyWinner || '∞'}</strong>
            </span>
            <span>
              Order: <strong className="text-white/70">#{prize.displayOrder}</strong>
            </span>
          </div>

          {/* Stock bar */}
          <div className="mt-2 w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                stockStatus === 'out' ? 'bg-red-500' : stockStatus === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(prize.stock / 10, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleEnabled(prize.id)}
            className={`p-1.5 rounded-lg transition-colors ${prize.enabled ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-red-400 hover:bg-red-500/20'}`}
            title={prize.enabled ? 'Disable' : 'Enable'}
          >
            {prize.enabled ? '✓' : '✕'}
          </button>
          <button
            onClick={() => onEdit(prize)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={() => onDuplicate(prize.id)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Duplicate"
          >
            ⧉
          </button>
          <button
            onClick={() => onDelete(prize.id)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
