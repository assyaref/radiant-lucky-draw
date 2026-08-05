import { useState } from 'react';
import type { PrizeSchedule as PrizeScheduleType } from '../types';

interface PrizeScheduleProps {
  schedule: PrizeScheduleType | null;
  onChange: (schedule: PrizeScheduleType) => void;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const;

function createDefaultSchedule(prizeId: string): PrizeScheduleType {
  return {
    prizeId,
    startDate: null,
    endDate: null,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
    startTime: '00:00',
    endTime: '23:59',
  };
}

export function PrizeSchedule({ schedule, onChange }: PrizeScheduleProps) {
  const [localSchedule, setLocalSchedule] = useState<PrizeScheduleType>(
    () => schedule ?? createDefaultSchedule(''),
  );

  // Adjust local state when the `schedule` prop changes (React 19 recommended pattern).
  const [prevSchedule, setPrevSchedule] = useState(schedule);
  if (schedule !== prevSchedule) {
    setPrevSchedule(schedule);
    if (schedule) {
      setLocalSchedule(schedule);
    }
  }

  const update = (updates: Partial<PrizeScheduleType>) => {
    const updated = { ...localSchedule, ...updates };
    setLocalSchedule(updated);
    onChange(updated);
  };

  const toggleDay = (
    day: keyof Omit<
      PrizeScheduleType,
      'prizeId' | 'startDate' | 'endDate' | 'startTime' | 'endTime'
    >,
  ) => {
    update({ [day]: !localSchedule[day] });
  };

  const hasDateRange = localSchedule.startDate || localSchedule.endDate;
  const allDaysOff = !DAYS.some((d) => localSchedule[d.key]);

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Schedule</h3>
        <span className="text-xs text-white/40">Optional availability window</span>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/50 mb-1">Start Date</label>
          <input
            type="date"
            value={localSchedule.startDate ?? ''}
            onChange={(e) => update({ startDate: e.target.value || null })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">End Date</label>
          <input
            type="date"
            value={localSchedule.endDate ?? ''}
            onChange={(e) => update({ endDate: e.target.value || null })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/50 mb-1">Start Time</label>
          <input
            type="time"
            value={localSchedule.startTime}
            onChange={(e) => update({ startTime: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">End Time</label>
          <input
            type="time"
            value={localSchedule.endTime}
            onChange={(e) => update({ endTime: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Days of Week */}
      <div>
        <label className="block text-xs text-white/50 mb-2">Active Days</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                localSchedule[day.key]
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-2 text-xs">
        {hasDateRange && (
          <span className="text-white/40">
            {localSchedule.startDate ?? 'Any'} → {localSchedule.endDate ?? 'Any'}
          </span>
        )}
        {allDaysOff && (
          <span className="text-amber-400">⚠ No days selected — prize will be unavailable</span>
        )}
        {!hasDateRange && !allDaysOff && (
          <span className="text-emerald-400/60">✓ Available on selected days & times</span>
        )}
      </div>
    </div>
  );
}
