import { useState } from 'react';
import type { Prize } from '@/engine/types/prize';
import { PrizeTier } from '@/engine/types/prize';
import type { PrizeCreateParams } from '@/engine/types/prize';
import type { ImageUploadData, PrizeSchedule as PrizeScheduleType } from '../types';
import { ImageUpload } from './ImageUpload';
import { PrizeSchedule } from './PrizeSchedule';

interface PrizeFormProps {
  prize: Prize | null;
  isEditing: boolean;
  onSubmit: (params: PrizeCreateParams) => Promise<void>;
  onCancel: () => void;
}

const TIER_OPTIONS: { value: PrizeTier; label: string }[] = [
  { value: PrizeTier.GRAND, label: 'Grand Prize' },
  { value: PrizeTier.VERY_RARE, label: 'Very Rare' },
  { value: PrizeTier.RARE, label: 'Rare' },
  { value: PrizeTier.NORMAL, label: 'Normal' },
  { value: PrizeTier.COMMON, label: 'Common' },
];

const DEFAULT_WEIGHTS: Record<PrizeTier, number> = {
  [PrizeTier.GRAND]: 0.5,
  [PrizeTier.VERY_RARE]: 1,
  [PrizeTier.RARE]: 3,
  [PrizeTier.NORMAL]: 15,
  [PrizeTier.COMMON]: 80,
};

export function PrizeForm({ prize, isEditing, onSubmit, onCancel }: PrizeFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<PrizeTier>(PrizeTier.NORMAL);
  const [color, setColor] = useState('#6366f1');
  const [weight, setWeight] = useState(15);
  const [stock, setStock] = useState(10);
  const [maxDailyWinner, setMaxDailyWinner] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [imageData, setImageData] = useState<ImageUploadData>({
    file: null,
    previewUrl: '',
    uploadedAt: null,
  });
  const [schedule, setSchedule] = useState<PrizeScheduleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Adjust form state when the `prize` prop changes (React 19 recommended pattern).
  const [prevPrize, setPrevPrize] = useState(prize);
  if (prize !== prevPrize) {
    setPrevPrize(prize);
    if (prize) {
      setName(prize.name);
      setDescription(prize.description);
      setTier(prize.tier);
      setColor(prize.color);
      setWeight(prize.weight);
      setStock(prize.stock);
      setMaxDailyWinner(prize.maxDailyWinner);
      setEnabled(prize.enabled);
      setDisplayOrder(prize.displayOrder);
      setImageData({
        file: null,
        previewUrl: prize.image,
        uploadedAt: prize.image ? new Date().toISOString() : null,
      });
    } else {
      setName('');
      setDescription('');
      setTier(PrizeTier.NORMAL);
      setColor('#6366f1');
      setWeight(15);
      setStock(10);
      setMaxDailyWinner(0);
      setEnabled(true);
      setDisplayOrder(1);
      setImageData({ file: null, previewUrl: '', uploadedAt: null });
      setSchedule(null);
    }
  }

  const handleTierChange = (newTier: PrizeTier) => {
    setTier(newTier);
    if (!isEditing) {
      setWeight(DEFAULT_WEIGHTS[newTier]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Prize name is required');
      return;
    }
    if (stock < 0) {
      setError('Stock cannot be negative');
      return;
    }
    if (weight <= 0) {
      setError('Weight must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const params: PrizeCreateParams = {
        id: prize?.id ?? '',
        name: name.trim(),
        description: description.trim(),
        tier,
        image: imageData.previewUrl,
        color,
        weight,
        stock,
        maxDailyWinner,
        enabled,
        displayOrder,
      };
      await onSubmit(params);
    } catch {
      setError('Failed to save prize');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Prize Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter prize name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          placeholder="Enter prize description"
        />
      </div>

      {/* Tier & Weight row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Tier</label>
          <select
            value={tier}
            onChange={(e) => handleTierChange(e.target.value as PrizeTier)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-800">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Weight</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            step="0.1"
            min="0.1"
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Stock & Daily Limit row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Stock</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Daily Limit (0 = unlimited)
          </label>
          <input
            type="number"
            value={maxDailyWinner}
            onChange={(e) => setMaxDailyWinner(Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Color & Display Order row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Theme Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min="1"
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Image Upload */}
      <ImageUpload value={imageData} onChange={setImageData} prizeColor={color} />

      {/* Schedule */}
      <PrizeSchedule schedule={schedule} onChange={setSchedule} />

      {/* Enabled toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-indigo-500"
        />
        <label className="text-sm text-white/70">Prize is active and available for draws</label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : isEditing ? 'Update Prize' : 'Add Prize'}
        </button>
      </div>
    </form>
  );
}
