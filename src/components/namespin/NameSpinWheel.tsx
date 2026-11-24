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
  /** A segment passed the pointer while spinning (for tick sounds). */
  onTick?: (segment: number) => void;
  /** Segment under the pointer changed (any time). */
  onPointerSegment?: (segment: number) => void;
  className?: string;
  variant?: 'name' | 'prize' | 'dual';
}

/** Segment colours: [light, dark] for a soft radial gradient. */
const PALETTE: Array<[string, string]> = [
  ['#5b4cf0', '#3423b8'], // indigo
  ['#0ea5e9', '#0369a1'], // sky
  ['#2563eb', '#1e3a8a'], // blue
  ['#a855f7', '#6d28d9'], // violet
  ['#14b8a6', '#0f766e'], // teal
  ['#6366f1', '#3730a3'], // indigo 2
  ['#06b6d4', '#0e7490'], // cyan
  ['#8b5cf6', '#5b21b6'], // purple
];
const PRIZE_PALETTE: Array<[string, string]> = [
  ['#f59e0b', '#b45309'], // amber
  ['#ef4444', '#b91c1c'], // red
  ['#ec4899', '#be185d'], // pink
  ['#f97316', '#c2410c'], // orange
  ['#eab308', '#a16207'], // yellow
  ['#dc2626', '#991b1b'], // red 2
  ['#fbbf24', '#d97706'], // gold
  ['#fb923c', '#ea580c'], // orange 2
];
const DUAL_PALETTE: Array<[string, string]> = [
  ['#a855f7', '#6d28d9'], // violet
  ['#ec4899', '#be185d'], // pink
  ['#f59e0b', '#b45309'], // amber
  ['#8b5cf6', '#5b21b6'], // purple
  ['#f97316', '#c2410c'], // orange
  ['#d946ef', '#a21caf'], // fuchsia
  ['#fbbf24', '#d97706'], // gold
  ['#fb7185', '#be123c'], // rose
];
const WINNER: [string, string] = ['#fde047', '#f59e0b'];
const PRIZE_WINNER: [string, string] = ['#fef08a', '#eab308'];
const DUAL_WINNER: [string, string] = ['#f0abfc', '#c026d3'];
const TAU = Math.PI * 2;
const POINTER = -Math.PI / 2; // top
const IDLE_SPEED = 0.12; // rad/s
const PRIZE_IDLE_SPEED = 0.10; // rad/s
const DUAL_IDLE_SPEED = 0.11; // rad/s

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
  variant: 'name' | 'prize' | 'dual' = 'name',
): number {
  const n = Math.max(1, segmentCount);
  const seg = TAU / n;
  // Land inside the winner segment, slightly off-centre.
  const jitter = (hash(spinId + variant) - 0.5) * seg * 0.6;
  const desired = POINTER - (winnerSegment + 0.5) * seg + jitter;
  const turns = variant === 'prize' || variant === 'dual' ? 5 + Math.round(durationMs / 2200) : 6 + Math.round(durationMs / 2000);
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
  variant: 'name' | 'prize' | 'dual' = 'name',
): void {
  const n = names.length;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - size * 0.035; // room for the glow
  const rim = Math.max(6, outer * 0.055);
  const r = outer - rim; // face radius
  ctx.clearRect(0, 0, size, size);

  // Gold rim with glow
  ctx.save();
  ctx.shadowColor = variant === 'prize' ? 'rgba(245,158,11,0.75)' : 'rgba(251,191,36,0.75)';
  ctx.shadowBlur = size * 0.045;
  const rimGrad = ctx.createLinearGradient(cx - outer, cy - outer, cx + outer, cy + outer);
  if (variant === 'prize') {
    rimGrad.addColorStop(0, '#fff3b0');
    rimGrad.addColorStop(0.25, '#f59e0b');
    rimGrad.addColorStop(0.5, '#b45309');
    rimGrad.addColorStop(0.75, '#fbbf24');
    rimGrad.addColorStop(1, '#d97706');
  } else {
    rimGrad.addColorStop(0, '#fff3b0');
    rimGrad.addColorStop(0.25, '#fbbf24');
    rimGrad.addColorStop(0.5, '#b45309');
    rimGrad.addColorStop(0.75, '#fcd34d');
    rimGrad.addColorStop(1, '#d97706');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, TAU);
  ctx.fillStyle = rimGrad;
  ctx.fill();
  ctx.restore();

  // Dark inner edge between rim and face
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, TAU);
  ctx.fillStyle = '#1a1033';
  ctx.fill();

  const palette = variant === 'prize' ? PRIZE_PALETTE : variant === 'dual' ? DUAL_PALETTE : PALETTE;
  const winnerColor = variant === 'prize' ? PRIZE_WINNER : variant === 'dual' ? DUAL_WINNER : WINNER;

  if (n === 0) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, variant === 'prize' ? '#78350f' : '#312e81');
    g.addColorStop(1, variant === 'prize' ? '#451a03' : '#1e1b4b');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `700 ${Math.max(14, size * 0.04)}px Poppins, Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(variant === 'prize' ? 'Belum ada hadiah' : 'Belum ada nama', cx, cy + r * 0.3);
  } else {
    const seg = TAU / n;
    const fontSize = Math.max(9, Math.min(r * 0.085, seg * r * 0.5));
    ctx.font = `800 ${fontSize}px Poppins, Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    const maxText = r * 0.62;

    for (let i = 0; i < n; i++) {
      const a0 = rotation + i * seg;
      const isHi = highlight === i;
      const [light, dark] = isHi ? winnerColor : palette[i % palette.length];
      const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      g.addColorStop(0, dark);
      g.addColorStop(0.55, light);
      g.addColorStop(1, dark);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a0 + seg);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      if (n <= 120) {
        ctx.lineWidth = Math.max(1, size * 0.002);
        ctx.strokeStyle = 'rgba(15,10,40,0.55)';
        ctx.stroke();
      }

      // Label along the segment's centre line, near the rim
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
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = isHi ? '#1f1300' : '#ffffff';
      ctx.fillText(label, r * 0.88, 0);
      ctx.restore();
    }

    // Soft inner vignette for depth
    const v = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = v;
    ctx.fill();
  }

  // Gold hub orb
  const hub = Math.max(16, r * 0.15);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = hub * 0.5;
  const ring = ctx.createLinearGradient(cx - hub, cy - hub, cx + hub, cy + hub);
  if (variant === 'prize') {
    ring.addColorStop(0, '#fff7c2');
    ring.addColorStop(0.5, '#b45309');
    ring.addColorStop(1, '#fde68a');
  } else {
    ring.addColorStop(0, '#fff7c2');
    ring.addColorStop(0.5, '#d97706');
    ring.addColorStop(1, '#fde68a');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, hub, 0, TAU);
  ctx.fillStyle = ring;
  ctx.fill();
  ctx.restore();
  const orb = ctx.createRadialGradient(cx - hub * 0.3, cy - hub * 0.35, hub * 0.05, cx, cy, hub * 0.85);
  if (variant === 'prize') {
    orb.addColorStop(0, '#fffbe6');
    orb.addColorStop(0.35, '#fbbf24');
    orb.addColorStop(1, '#92400e');
  } else {
    orb.addColorStop(0, '#fffbe6');
    orb.addColorStop(0.35, '#fcd34d');
    orb.addColorStop(1, '#c2410c');
  }
  ctx.beginPath();
  ctx.arc(cx, cy, hub * 0.8, 0, TAU);
  ctx.fillStyle = orb;
  ctx.fill();
}

export function NameSpinWheel({
  segments,
  spin,
  highlight = null,
  onSpinEnd,
  onTick,
  onPointerSegment,
  className,
  variant = 'name',
}: Props) {
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
  const onTickRef = useRef(onTick);
  const onPointerRef = useRef(onPointerSegment);
  const lastSeg = useRef(-1);
  onTickRef.current = onTick;
  onPointerRef.current = onPointerSegment;

  segRef.current = segments;
  highlightRef.current = highlight;
  onEndRef.current = onSpinEnd;

  // Plan a spin whenever a new one arrives.
  useEffect(() => {
    if (!spin || spin.spinId === spinRef.current?.id) return;
    const from = rotation.current;
    const to = planTarget(from, spin.winnerSegment, segRef.current.length, spin.spinId, spin.durationMs, variant);
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
  }, [spin, variant]);

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
        const idleSpeed = variant === 'prize' ? PRIZE_IDLE_SPEED : variant === 'dual' ? DUAL_IDLE_SPEED : IDLE_SPEED;
        rotation.current += idleSpeed * dt;
      }

      const count = segRef.current.length;
      if (count > 0) {
        const cur = segmentAtPointer(rotation.current, count);
        if (cur !== lastSeg.current) {
          lastSeg.current = cur;
          onPointerRef.current?.(cur);
          if (s && !s.done) onTickRef.current?.(cur);
        }
      }

      drawWheel(ctx, size, segRef.current, rotation.current, highlightRef.current, variant);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant]);

  return (
    <div ref={wrapRef} className={`relative aspect-square w-full ${className ?? ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 m-auto" aria-hidden="true" />
      {/* Pointer */}
      <svg
        viewBox="0 0 40 40"
        className="absolute left-1/2 -translate-x-1/2 top-0 z-10 w-[9%] max-w-[64px] min-w-[26px]"
        style={{ filter: variant === 'prize' ? 'drop-shadow(0 0 10px rgba(245,158,11,0.85)) drop-shadow(0 4px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 0 10px rgba(251,191,36,0.85)) drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`nsw-pointer-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="0.5" stopColor={variant === 'prize' ? '#f59e0b' : '#fbbf24'} />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <path d="M4 4 H36 Q38 4 36.8 6 L21.5 34 Q20 36.5 18.5 34 L3.2 6 Q2 4 4 4 Z" fill={`url(#nsw-pointer-${variant})`} stroke="#92400e" strokeWidth="1.2" />
        <path d="M9 7.5 H31 L20 27 Z" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  );
}

export default NameSpinWheel;