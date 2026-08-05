/**
 * Enterprise Admin Dashboard — AnalyticsChart
 *
 * M2.3A — Reusable line/area chart for analytics series.
 * Uses chart.js + react-chartjs-2. Mock data only.
 */

import { memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { colors } from '@design-system/index';
import type { AnalyticsSeries } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface AnalyticsChartProps {
  series: AnalyticsSeries[];
  height?: number;
}

export const AnalyticsChart = memo(function AnalyticsChart({
  series,
  height = 280,
}: AnalyticsChartProps) {
  const labels = series[0]?.points.map((p) => p.label) ?? [];

  const datasets = series.map((s) => ({
    label: s.name,
    data: s.points.map((p) => p.value),
    borderColor: s.color,
    backgroundColor: `${s.color}22`,
    fill: true,
    tension: 0.4,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: s.color,
    borderWidth: 2,
  }));

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: colors.text.secondary,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: colors.bg.surface,
        borderColor: colors.glass.line,
        borderWidth: 1,
        titleColor: colors.text.primary,
        bodyColor: colors.text.secondary,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: colors.glass.line },
        ticks: { color: colors.text.tertiary },
        border: { color: colors.glass.line },
      },
      y: {
        grid: { color: colors.glass.line },
        ticks: { color: colors.text.tertiary },
        border: { color: colors.glass.line },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height }} className="w-full">
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
});
