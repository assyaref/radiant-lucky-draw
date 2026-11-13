/**
 * NameSpinWheel — canvas prize wheel for Spin Nama.
 *
 * - Idle: turns slowly so the screen feels alive.
 * - Spin: accelerates, then decelerates over `durationMs` and stops with the
 *   winner segment (chosen by the server) under the pointer at the top.
 * - Late viewers (Monitor opened mid-spin) join at the right point in time,
 *   based on the server `startedAt`.
 * Canvas keeps it light on long-running TV screens (one bitmap, no DOM per name).
 */

import { useEffect, useRef } from 'react';

export interface WheelSpin {
  spinId: string;
  winnerSegment: number;
  durationMs: number;
  /** ISO time the server started the spin */
  startedAt?: string;
}

interface Props {
  segments: string[];
  spin?: WheelSpin | null;
  /** Segment to highlight after the spin (usually the winner). */
  highlight?: number | null;
  onSpinEnd?: (spinId: string) => void;
  className?: string;
}

const PALETTE = [
  '#2563eb', // blue
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#4f46e5', // indigo
  '#9333ea', // purple
  '#0ea5e9', // sky
];
const GOLD = '#f59e0b';
const TAU = Math.PI * 2;
const POINTER = -Math.PI / 2; // top
const IDLE_SPEED = 0.12; // rad/s

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Strong ease-out: fast start, long satisfying slowdown. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/**
 * Final rotation (radians) so that `winnerSegment` stops under the top pointer,
 * after several full turns. Deterministic per spin id.
 */
export function planTarget(
  from: number,
  winnerSegment: number,
  segmentCount: number,
  spinId: string,
  durationMs: number,
): number {
  const n = Math.max(1, segmentCount);
  const seg = TAU / n;
  // Land inside the winner segment, slightly off-centre.
  const jitter = (hash(spinId) - 0.5) * seg * 0.6;
  const desired = POINTER - (winnerSegment + 0.5) * seg + jitter;
  const turns = 6 + Math.round(durationMs / 2000);
  return from + turns * TAU + mod(desired - from, TAU);
}

/** Index of the segment currently under the top pointer. */
export function segmentAtPointer(rotation: number, segmentCount: number): number {
  const seg = TAU / Math.max(1, segmentCount);
  return Math.floor(mod(POINTER - rotation, TAU) / seg) % Math.max(1, segmentCount);
}

/** Draw one frame of the wheel. */
export function drawWheel(
  ctx: CanvasRenderingContext2D,
  size: number,
  names: string[],
  rotation: number,
  highlight: number | null,
): void {
  const n = names.length;
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, TAU);
  ctx.fillStyle = '#0b1229';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(245,158,11,0.75)';
  ctx.stroke();

  if (n === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `600 ${Math.max(14, size * 0.04)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Belum ada nama', cx, cy);
  } else {
    const seg = TAU / n;
    const fontSize = Math.max(9, Math.min(r * 0.075, seg * r * 0.55));
    ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    const maxText = r * 0.66;

    for (let i = 0; i < n; i++) {
      const a0 = rotation + i * seg;
      const isHi = highlight === i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a0 + seg);
      ctx.closePath();
      ctx.fillStyle = isHi ? GOLD : PALETTE[i % PALETTE.length];
      ctx.globalAlpha = isHi || highlight === null ? 1 : 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (n <= 120) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(2,6,23,0.55)';
        ctx.stroke();
      }

      // Label, along the segment's centre line, right-aligned near the rim
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + seg / 2);
      let label = names[i];
      if (ctx.measureText(label).width > maxText) {
        while (label.length > 1 && ctx.measureText(`${label}…`).width > maxText) {
          label = label.slice(0, -1);
        }
        label = `${label}…`;
      }
      ctx.fillStyle = isHi ? '#111827' : 'rgba(255,255,255,0.95)';
      ctx.fillText(label, r - 12, 0);
      ctx.restore();
    }
  }

  // Hub
  const hub = Math.max(18, r * 0.14);
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, hub);
  g.addColorStop(0, '#fde68a');
  g.addColorStop(1, '#d97706');
  ctx.beginPath();
  ctx.arc(cx, cy, hub, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0b1229';
  ctx.stroke();
}

export function NameSpinWheel({ segments, spin, highlight = null, onSpinEnd, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rotation = useRef(Math.random() * TAU);
  const segRef = useRef(segments);
  const highlightRef = useRef(highlight);
  const spinRef = useRef<{
    id: string;
    from: number;
    to: number;
    start: number;
    duration: number;
    done: boolean;
  } | null>(null);
  const onEndRef = useRef(onSpinEnd);

  segRef.current = segments;
  highlightRef.current = highlight;
  onEndRef.current = onSpinEnd;

  // Plan a spin whenever a new one arrives.
  useEffect(() => {
    if (!spin || spin.spinId === spinRef.current?.id) return;
    const from = rotation.current;
    const to = planTarget(from, spin.winnerSegment, segRef.current.length, spin.spinId, spin.durationMs);
    const elapsed = spin.startedAt ? Date.now() - Date.parse(spin.startedAt) : 0;
    const clamped = Math.min(Math.max(0, Number.isFinite(elapsed) ? elapsed : 0), spin.durationMs);
    spinRef.current = {
      id: spin.spinId,
      from,
      to,
      start: performance.now() - (clamped < 1500 ? 0 : clamped),
      duration: spin.durationMs,
      done: false,
    };
  }, [spin]);

  // Render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let size = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight || wrap.clientWidth));
      canvas.width = Math.max(1, size * dpr);
      canvas.height = Math.max(1, size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const s = spinRef.current;
      if (s && !s.done) {
        const t = Math.min(1, (now - s.start) / s.duration);
        rotation.current = s.from + (s.to - s.from) * easeOut(t);
        if (t >= 1) {
          s.done = true;
          rotation.current = s.to;
          onEndRef.current?.(s.id);
        }
      } else if (highlightRef.current === null) {
        rotation.current += IDLE_SPEED * dt;
      }

      drawWheel(ctx, size, segRef.current, rotation.current, highlightRef.current);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative aspect-square w-full ${className ?? ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 m-auto" aria-hidden="true" />
      {/* Pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-1 z-10"
        style={{
          width: 0,
          height: 0,
          borderLeft: '18px solid transparent',
          borderRight: '18px solid transparent',
          borderTop: '34px solid #fbbf24',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export default NameSpinWheel;
