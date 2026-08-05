import { useState } from 'react';
import { PrizeTier } from '@/engine/types/prize';
import type { BulkUpdatePayload } from '../types';

interface BulkUpdateProps {
  selectedIds: string[];
  onApply: (payload: BulkUpdatePayload) => Promise<void>;
  onCancel: () => void;
}

export function BulkUpdate({ selectedIds, onApply, onCancel }: BulkUpdateProps) {
  const [tier, setTier] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [enabled, setEnabled] = useState<string>('');
  const [maxDailyWinner, setMaxDailyWinner] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [applying, setApplying] = useState(false);

  const hasChanges = tier || weight || enabled || maxDailyWinner || color;

  const handleApply = async () => {
    if (!hasChanges) return;

    setApplying(true);
    try {
      const updates: BulkUpdatePayload['updates'] = {};
      if (tier) updates.tier = tier as PrizeTier;
      if (weight) updates.weight = Number(weight);
      if (enabled) updates.enabled = enabled === 'true';
      if (maxDailyWinner) updates.maxDailyWinner = Number(maxDailyWinner);
      if (color) updates.color = color;

      await onApply({ prizeIds: selectedIds, updates });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Bulk Update — {selectedIds.length} prize{selectedIds.length !== 1 ? 's' : ''} selected
        </h3>
        <button
          onClick={onCancel}
          className="text-xs text-white/40 hover:text-white transition-colors"
        >
          Deselect All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {/* Tier */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" className="bg-gray-800">
              No change
            </option>
            <option value={PrizeTier.GRAND} className="bg-gray-800">
              Grand
            </option>
            <option value={PrizeTier.VERY_RARE} className="bg-gray-800">
              Very Rare
            </option>
            <option value={PrizeTier.RARE} className="bg-gray-800">
              Rare
            </option>
            <option value={PrizeTier.NORMAL} className="bg-gray-800">
              Normal
            </option>
            <option value={PrizeTier.COMMON} className="bg-gray-800">
              Common
            </option>
          </select>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Weight</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="No change"
            step="0.1"
            min="0.1"
            className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Enabled */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Status</label>
          <select
            value={enabled}
            onChange={(e) => setEnabled(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" className="bg-gray-800">
              No change
            </option>
            <option value="true" className="bg-gray-800">
              Enable
            </option>
            <option value="false" className="bg-gray-800">
              Disable
            </option>
          </select>
        </div>

        {/* Daily Limit */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Daily Limit</label>
          <input
            type="number"
            value={maxDailyWinner}
            onChange={(e) => setMaxDailyWinner(e.target.value)}
            placeholder="No change"
            min="0"
            className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Color</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="No change"
            className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleApply}
          disabled={!hasChanges || applying}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {applying
            ? 'Applying...'
            : `Apply to ${selectedIds.length} prize${selectedIds.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
