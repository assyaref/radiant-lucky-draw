// ============================================================
// Line Chart Component (Chart.js)
// ============================================================

import { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
    pointRadius?: number;
    pointHoverRadius?: number;
  }[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  area?: boolean;
  className?: string;
}

export function LineChart({
  labels,
  datasets,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  area = false,
  className = '',
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const defaultColors = [
      { border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
      { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
      { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
      { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    ];

    const processedDatasets = datasets.map((ds, i) => ({
      ...ds,
      borderColor: ds.borderColor || defaultColors[i % defaultColors.length].border,
      backgroundColor: ds.backgroundColor || (area ? defaultColors[i % defaultColors.length].bg : 'transparent'),
      fill: ds.fill ?? area,
      tension: ds.tension ?? 0.4,
      pointRadius: ds.pointRadius ?? 3,
      pointHoverRadius: ds.pointHoverRadius ?? 6,
    }));

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: processedDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: showLegend,
            position: 'top',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              boxWidth: 12,
              padding: 12,
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
        },
        scales: {
          x: {
            grid: {
              display: showGrid,
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
            },
          },
          y: {
            grid: {
              display: showGrid,
              color: 'rgba(148, 163, 184, 0.1)',
            },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, datasets, title, showLegend, showGrid, area]);

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
