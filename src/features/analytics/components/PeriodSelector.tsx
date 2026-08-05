// ============================================================
// Period Selector Component
// ============================================================

import { useAnalyticsStore } from '../store/analyticsStore';

interface PeriodSelectorProps {
  className?: string;
}

const periods = [
  { value: 'daily' as const, label: 'Daily', icon: '📅' },
  { value: 'weekly' as const, label: 'Weekly', icon: '📆' },
  { value: 'monthly' as const, label: 'Monthly', icon: '📊' },
];

export function PeriodSelector({ className = '' }: PeriodSelectorProps) {
  const { selectedPeriod, setSelectedPeriod, fetchReport } = useAnalyticsStore();

  const handleChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
    fetchReport(period);
  };

  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-lg bg-dark-surface-tertiary/50 ${className}`}
    >
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => handleChange(p.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
            selectedPeriod === p.value
              ? 'bg-dark-surface-secondary text-white shadow-sm'
              : 'text-dark-text-tertiary hover:text-white'
          }`}
        >
          <span>{p.icon}</span>
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );
}
