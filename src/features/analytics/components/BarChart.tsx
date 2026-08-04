// ============================================================
// Bar Chart Component (Chart.js)
// ============================================================

import { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    borderRadius?: number;
  }[];
  title?: string;
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
}

export function BarChart({
  labels,
  datasets,
  title,
  height = 300,
  horizontal = false,
  stacked = false,
  showLegend = true,
  showGrid = true,
  className = '',
}: BarChartProps) {
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
      'rgba(14, 165, 233, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(249, 115, 22, 0.8)',
    ];

    const processedDatasets = datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || defaultColors[i % defaultColors.length],
      borderColor: ds.borderColor || 'transparent',
      borderWidth: ds.borderWidth || 0,
      borderRadius: ds.borderRadius ?? 4,
    }));

    chartRef.current = new Chart(ctx, {
      type: horizontal ? 'bar' : 'bar',
      data: {
        labels,
        datasets: processedDatasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
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
            stacked,
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
            stacked,
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
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, datasets, title, horizontal, stacked, showLegend, showGrid]);

  return (
    <div className={className} style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
