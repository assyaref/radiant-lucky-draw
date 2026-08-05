import { PrizeTier } from '@/engine/types/prize';
import type { PrizeFilterOptions } from '../types';

interface PrizeFilterProps {
  filters: PrizeFilterOptions;
  onChange: (filters: Partial<PrizeFilterOptions>) => void;
  onReset: () => void;
}

const TIER_OPTIONS: { value: PrizeTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: PrizeTier.GRAND, label: 'Grand' },
  { value: PrizeTier.VERY_RARE, label: 'Very Rare' },
  { value: PrizeTier.RARE, label: 'Rare' },
  { value: PrizeTier.NORMAL, label: 'Normal' },
  { value: PrizeTier.COMMON, label: 'Common' },
];

const STATUS_OPTIONS: { value: 'all' | boolean; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: true, label: 'Enabled' },
  { value: false, label: 'Disabled' },
];

const STOCK_OPTIONS: { value: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'; label: string }[] =
  [
    { value: 'all', label: 'All Stock' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock (≤10)' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

const SORT_OPTIONS: { value: PrizeFilterOptions['sortBy']; label: string }[] = [
  { value: 'displayOrder', label: 'Order' },
  { value: 'name', label: 'Name' },
  { value: 'tier', label: 'Tier' },
  { value: 'weight', label: 'Weight' },
  { value: 'stock', label: 'Stock' },
  { value: 'dailyWinnerCount', label: 'Daily Winners' },
];

export function PrizeFilter({ filters, onChange, onReset }: PrizeFilterProps) {
  const hasActiveFilters =
    filters.tier !== 'all' || filters.enabled !== 'all' || filters.stockStatus !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tier filter */}
      <select
        value={filters.tier}
        onChange={(e) => onChange({ tier: e.target.value as PrizeTier | 'all' })}
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {TIER_OPTIONS.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={String(filters.enabled)}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ enabled: val === 'all' ? 'all' : val === 'true' });
        }}
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Stock filter */}
      <select
        value={filters.stockStatus}
        onChange={(e) =>
          onChange({ stockStatus: e.target.value as PrizeFilterOptions['stockStatus'] })
        }
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {STOCK_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sortBy}
        onChange={(e) => onChange({ sortBy: e.target.value as PrizeFilterOptions['sortBy'] })}
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            Sort: {opt.label}
          </option>
        ))}
      </select>

      {/* Sort direction */}
      <button
        onClick={() =>
          onChange({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' })
        }
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
        title={`Sort ${filters.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
      >
        {filters.sortDirection === 'asc' ? '↑' : '↓'}
      </button>

      {/* Reset filters */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-lg text-red-400 text-sm hover:bg-red-500/20 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
