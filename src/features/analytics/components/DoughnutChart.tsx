// ============================================================
// Doughnut Chart Component (Chart.js)
// ============================================================

import { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  title?: string;
  height?: number;
  cutout?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  '#0ea5e9', '#a855f7', '#22c55e', '#f59e0b', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

export function DoughnutChart({
  labels,
  data,
  colors = DEFAULT_COLORS,
  title,
  height = 300,
  cutout = '65%',
  showLegend = true,
  showPercentage = true,
  className = '',
}: DoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const total = data.reduce((a, b) => a + b, 0);

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, data.length),
            borderColor: '#1e293b',
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout,
        plugins: {
          legend: {
            display: showLegend,
            position: 'right',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              boxWidth: 12,
              padding: 12,
              generateLabels: showPercentage
                ? (chart) => {
                    const datasets = chart.data.datasets;
                    return chart.data.labels!.map((label, i) => ({
                      text: `${label} (${((datasets[0].data[i] as number) / total * 100).toFixed(1)}%)`,
                      fillStyle: (datasets[0].backgroundColor as string[])[i],
                      strokeStyle: 'transparent',
                      pointStyle: 'circle' as const,
                      index: i,
                    }));
                  }
                : undefined,
            },
          },
          title: title
            ? {
                display: true,
                text: title,
                color: '#f1f5f9',
                font: { size: 14, weight: 'bold' },

                padding: { bottom: 16 },
              }
            : undefined,
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed as unknown as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return ` ${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, data, colors, title, cutout, showLegend, showPercentage]);

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
