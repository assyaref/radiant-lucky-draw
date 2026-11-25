/**
 * NameSpinWheel — canvas dual-layer prize wheel for Spin Nama.
 *
 * - Dual-layer concentric wheels: Outer = participant names, Inner = prize units
 * - Each wheel has independent rotation state and animation
 * - Idle: both wheels turn slowly so the screen feels alive
 * - Spin: both accelerate, then decelerate over durationMs and stop with
 *   their respective winner segments under the pointer at the top
 * - Late viewers (Monitor opened mid-spin) join at the right point in time,
 *   based on the server `startedAt`
 * - Canvas keeps it light on long-running TV screens (one bitmap, no DOM per name)
 */

import { useEffect, useRef } from 'react';

export interface WheelSpin {
  spinId: string;
  winnerSegment: number;
  prizeWinnerSegment?: number;
  durationMs: number;
  startedAt?: string;
}

export interface PrizeSegment {
  id: string;
  name: string;
  icon?: string; // emoji or image URL
  color?: string;
}

interface Props {
  segments: string[];
  prizeSegments?: PrizeSegment[];
  spin?: WheelSpin | null;
  highlight?: number | null;
  prizeHighlight?: number | null;
  onSpinEnd?: (spinId: string) => void;
  onTick?: (segment: number) => void;
  onPrizeTick?: (segment: number) => void;
  onPointerSegment?: (segment: number) => void;
  onPrizePointerSegment?: (segment: number) => void;
  className?: string;
  variant?: 'name' | 'prize' | 'dual';
}

const OUTER_PALETTE: Array<[string, string]> = [
  ['#0ea5e9', '#0369a1'], // electric blue
  ['#8b5cf6', '#5b21b6'], // royal purple
  ['#06b6d4', '#0e7490'], // turquoise
  ['#14b8a6', '#0f766e'], // teal
  ['#6366f1', '#3730a3'], // indigo
  ['#f97316', '#c2410c'], // soft orange
  ['#a855f7', '#6d28d9'], // violet
  ['#22d3ee', '#0891b2'], // cyan
  ['#ec4899', '#be185d'], // pink
  ['#3b82f6', '#1d4ed8'], // blue
];

const INNER_PALETTE: Array<[string, string]> = [
  ['#06b6d4', '#0e7490'], // cyan
  ['#3b82f6', '#1d4ed8'], // blue
  ['#8b5cf6', '#5b21b6'], // purple
  ['#10b981', '#047857'], // emerald
  ['#f59e0b', '#b45309'], // gold accent
  ['#0ea5e9', '#0369a1'], // sky
  ['#a855f7', '#6d28d9'], // violet
  ['#22d3ee', '#0891b2'], // cyan 2
  ['#ec4899', '#be185d'], // pink
  ['#14b8a6', '#0f766e'], // teal
];

const OUTER_WINNER: [string, string] = ['#fef08a', '#eab308'];
const INNER_WINNER: [string, string] = ['#fde047', '#f59e0b'];
const TAU = Math.PI * 2;
const POINTER = -Math.PI / 2;
const OUTER_IDLE_SPEED = 0.10;
const INNER_IDLE_SPEED = 0.08;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

function readableTangent(angle: number): number {
  const tangent = angle + Math.PI / 2;
  const normalized = mod(tangent, TAU);
  return tangent + (normalized > Math.PI / 2 && normalized < (Math.PI * 3) / 2 ? Math.PI : 0);
}

/**
 * Radial text orientation: label runs from the hub outward along the segment
 * midpoint. On the left half the label is flipped 180° so it never reads
 * upside down (it then reads outer→inner but stays upright).
 */
function radialTransform(angle: number): { rotate: number; flip: boolean } {
  const normalized = mod(angle, TAU);
  const flip = normalized > Math.PI / 2 && normalized < (Math.PI * 3) / 2;
  return { rotate: angle + (flip ? Math.PI : 0), flip };
}

export function planTarget(
  from: number,
  winnerSegment: number,
  segmentCount: number,
  spinId: string,
  durationMs: number,
  variant: 'outer' | 'inner' = 'outer',
): number {
  const n = Math.max(1, segmentCount);
  const seg = TAU / n;
  const jitter = (hash(spinId + variant) - 0.5) * seg * 0.6;
  const desired = POINTER - (winnerSegment + 0.5) * seg + jitter;
  const turns = variant === 'inner' ? 5 + Math.round(durationMs / 2200) : 6 + Math.round(durationMs / 2000);
  return from + turns * TAU + mod(desired - from, TAU);
}

export function segmentAtPointer(rotation: number, segmentCount: number): number {
  const seg = TAU / Math.max(1, segmentCount);
  return Math.floor(mod(POINTER - rotation, TAU) / seg) % Math.max(1, segmentCount);
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  segAngle: number,
  fillStyle: CanvasGradient,
  label: string,
  fontSize: number,
  isHighlight: boolean,
  maxTextWidth: number,
): void {
  ctx.beginPath();
  ctx.moveTo(cx + rInner * Math.cos(a0), cy + rInner * Math.sin(a0));
  ctx.arc(cx, cy, rOuter, a0, a0 + segAngle);
  ctx.lineTo(cx + rInner * Math.cos(a0 + segAngle), cy + rInner * Math.sin(a0 + segAngle));
  ctx.arc(cx, cy, rInner, a0 + segAngle, a0, true);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.lineWidth = Math.max(1, rOuter * 0.003);
  ctx.strokeStyle = 'rgba(15,10,40,0.4)';
  ctx.stroke();

  ctx.save();
  const middle = a0 + segAngle / 2;
  const labelRadius = (rInner + rOuter) / 2;
  const { rotate, flip } = radialTransform(middle);
  ctx.translate(cx, cy);
  ctx.rotate(rotate);
  let text = label;
  ctx.font = `700 ${fontSize}px Poppins, Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  if (ctx.measureText(text).width > maxTextWidth) {
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxTextWidth) {
      text = text.slice(0, -1);
    }
    text = `${text}…`;
  }
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = Math.max(2, fontSize * 0.2);
  ctx.shadowOffsetY = 0.5;
  ctx.fillStyle = isHighlight ? '#1f1300' : '#ffffff';
  ctx.fillText(text, flip ? -labelRadius : labelRadius, 0);
  ctx.restore();
}

function drawSegmentWithIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  segAngle: number,
  fillStyle: CanvasGradient,
  label: string,
  icon: string | undefined,
  fontSize: number,
  isHighlight: boolean,
  maxTextWidth: number,
): void {
  ctx.beginPath();
  ctx.moveTo(cx + rInner * Math.cos(a0), cy + rInner * Math.sin(a0));
  ctx.arc(cx, cy, rOuter, a0, a0 + segAngle);
  ctx.lineTo(cx + rInner * Math.cos(a0 + segAngle), cy + rInner * Math.sin(a0 + segAngle));
  ctx.arc(cx, cy, rInner, a0 + segAngle, a0, true);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.lineWidth = Math.max(1, rOuter * 0.003);
  ctx.strokeStyle = 'rgba(15,10,40,0.4)';
  ctx.stroke();

  ctx.save();
  const middle = a0 + segAngle / 2;
  const textRadius = rInner + (rOuter - rInner) * 0.38;

  if (icon) {
    const iconRadius = rInner + (rOuter - rInner) * 0.7;
    ctx.save();
    ctx.translate(cx + iconRadius * Math.cos(middle), cy + iconRadius * Math.sin(middle));
    ctx.font = `${fontSize * 1.2}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(icon, 0, 0);
    ctx.restore();
  }

  ctx.translate(cx + textRadius * Math.cos(middle), cy + textRadius * Math.sin(middle));
  ctx.rotate(readableTangent(middle));
  let text = label;
  ctx.font = `800 ${fontSize}px Poppins, Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  if (ctx.measureText(text).width > maxTextWidth) {
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxTextWidth) {
      text = text.slice(0, -1);
    }
    text = `${text}…`;
  }
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = isHighlight ? '#1f1300' : '#ffffff';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawWheelLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  names: string[],
  rotation: number,
  highlight: number | null,
  rInner: number,
  rOuter: number,
  palette: Array<[string, string]>,
  winnerColor: [string, string],
): void {
  const n = names.length;
  if (n === 0) return;

  const cx = size / 2;
  const cy = size / 2;
  const seg = TAU / n;
  const band = rOuter - rInner;
  const labelRadius = (rInner + rOuter) / 2;
  const chord = 2 * labelRadius * Math.sin(Math.min(seg / 2, Math.PI / 2));
  // Radial text: height limited by band thickness & chord; length by band thickness.
  const fontSize = Math.max(12, Math.min(band * 0.4, chord * 0.55, rOuter * 0.2));
  const maxText = band * 0.86;

  for (let i = 0; i < n; i++) {
    const a0 = rotation + i * seg;
    const isHi = highlight === i;
    const [light, dark] = isHi ? winnerColor : palette[i % palette.length];
    const g = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    g.addColorStop(0, dark);
    g.addColorStop(0.55, light);
    g.addColorStop(1, dark);

    drawSegment(ctx, cx, cy, rInner, rOuter, a0, seg, g, names[i], fontSize, isHi, maxText);
  }
}

function drawPrizeWheelLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  prizes: PrizeSegment[],
  rotation: number,
  highlight: number | null,
  rInner: number,
  rOuter: number,
  palette: Array<[string, string]>,
  winnerColor: [string, string],
): void {
  const n = prizes.length;
  if (n === 0) return;

  const cx = size / 2;
  const cy = size / 2;
  const seg = TAU / n;
  const fontSize = Math.max(14, Math.min(rOuter * 0.13, seg * rOuter * 0.65));
  const textRadius = rInner + (rOuter - rInner) * 0.38;
  const maxText = 2 * textRadius * Math.sin(Math.min(seg / 2, Math.PI / 2)) * 0.9;

  for (let i = 0; i < n; i++) {
    const a0 = rotation + i * seg;
    const isHi = highlight === i;
    const prize = prizes[i];
    const [light, dark] = isHi ? winnerColor : (prize.color ? [prize.color, prize.color] : palette[i % palette.length]);
    const g = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    g.addColorStop(0, dark);
    g.addColorStop(0.55, light);
    g.addColorStop(1, dark);

    drawSegmentWithIcon(ctx, cx, cy, rInner, rOuter, a0, seg, g, prize.name, prize.icon, fontSize, isHi, maxText);
  }
}

export function drawDualWheel(
  ctx: CanvasRenderingContext2D,
  size: number,
  outerNames: string[],
  innerPrizes: PrizeSegment[],
  outerRotation: number,
  innerRotation: number,
  outerHighlight: number | null,
  innerHighlight: number | null,
): void {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - size * 0.025;
  const rimWidth = Math.max(6, outerRadius * 0.055);
  const outerFaceOuter = outerRadius;
  // Larger, proportional name band so radial labels read hub->rim with room.
  const outerFaceInner = outerFaceOuter - outerRadius * 0.4;
  const innerFaceOuter = outerFaceInner - size * 0.02;
  const innerFaceInner = Math.max(16, innerFaceOuter * 0.4);

  ctx.clearRect(0, 0, size, size);

  // Outer gold rim with glow
  ctx.save();
  ctx.shadowColor = 'rgba(251,191,36,0.85)';
  ctx.shadowBlur = size * 0.06;
  const outerRimGrad = ctx.createLinearGradient(cx - outerRadius, cy - outerRadius, cx + outerRadius, cy + outerRadius);
  outerRimGrad.addColorStop(0, '#fff3b0');
  outerRimGrad.addColorStop(0.25, '#fbbf24');
  outerRimGrad.addColorStop(0.5, '#b45309');
  outerRimGrad.addColorStop(0.75, '#fcd34d');
  outerRimGrad.addColorStop(1, '#d97706');
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, TAU);
  ctx.fillStyle = outerRimGrad;
  ctx.fill();
  ctx.restore();

  // Outer rim inner bevel
  ctx.beginPath();
  ctx.arc(cx, cy, outerFaceOuter - rimWidth + 1.5, 0, TAU);
  ctx.fillStyle = '#0d0a1a';
  ctx.fill();

  // Draw outer wheel (names)
  drawWheelLayer(ctx, size, outerNames, outerRotation, outerHighlight, outerFaceInner, outerFaceOuter, OUTER_PALETTE, OUTER_WINNER);

  // Inner rim separator (gold)
  ctx.beginPath();
  ctx.arc(cx, cy, innerFaceOuter + 2, 0, TAU);
  const separatorGrad = ctx.createLinearGradient(cx - innerFaceOuter, cy, cx + innerFaceOuter, cy);
  separatorGrad.addColorStop(0, '#d97706');
  separatorGrad.addColorStop(0.5, '#fbbf24');
  separatorGrad.addColorStop(1, '#d97706');
  ctx.strokeStyle = separatorGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner rim inner bevel
  ctx.beginPath();
  ctx.arc(cx, cy, innerFaceOuter - 1, 0, TAU);
  ctx.fillStyle = '#0d0a1a';
  ctx.fill();

  // Draw inner wheel (prizes with icons)
  drawPrizeWheelLayer(ctx, size, innerPrizes, innerRotation, innerHighlight, innerFaceInner, innerFaceOuter, INNER_PALETTE, INNER_WINNER);

  // Soft inner vignette for depth on inner wheel
  const v = ctx.createRadialGradient(cx, cy, innerFaceInner * 0.8, cx, cy, innerFaceOuter);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.beginPath();
  ctx.arc(cx, cy, innerFaceOuter, 0, TAU);
  ctx.fillStyle = v;
  ctx.fill();

  // Center hub with gold bevel
  const hub = Math.max(14, innerFaceInner * 0.9);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = hub * 0.5;
  const hubGrad = ctx.createLinearGradient(cx - hub, cy - hub, cx + hub, cy + hub);
  hubGrad.addColorStop(0, '#fff7c2');
  hubGrad.addColorStop(0.3, '#fbbf24');
  hubGrad.addColorStop(0.7, '#d97706');
  hubGrad.addColorStop(1, '#b45309');
  ctx.beginPath();
  ctx.arc(cx, cy, hub, 0, TAU);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.restore();

  // Center orb with highlight
  const orb = ctx.createRadialGradient(cx - hub * 0.3, cy - hub * 0.35, hub * 0.05, cx, cy, hub * 0.85);
  orb.addColorStop(0, '#fffbe6');
  orb.addColorStop(0.35, '#fcd34d');
  orb.addColorStop(1, '#c2410c');
  ctx.beginPath();
  ctx.arc(cx, cy, hub * 0.75, 0, TAU);
  ctx.fillStyle = orb;
  ctx.fill();
}

export function drawSingleWheel(
  ctx: CanvasRenderingContext2D,
  size: number,
  names: string[],
  rotation: number,
  highlight: number | null,
  variant: 'name' | 'prize' = 'name',
): void {
  const n = names.length;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - size * 0.035;
  const rim = Math.max(6, outer * 0.055);
  const r = outer - rim;

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

  // Dark inner edge
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, TAU);
  ctx.fillStyle = '#1a1033';
  ctx.fill();

  const palette = variant === 'prize' ? INNER_PALETTE : OUTER_PALETTE;
  const winnerColor = variant === 'prize' ? INNER_WINNER : OUTER_WINNER;

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
    const band = r * 0.62;
    const labelRadius = r * 0.68;
    const chord = 2 * labelRadius * Math.sin(Math.min(seg / 2, Math.PI / 2));
    const fontSize = Math.max(12, Math.min(band * 0.4, chord * 0.55, r * 0.2));
    const maxText = band * 0.86;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

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

      ctx.save();
      const middle = a0 + seg / 2;
      const { rotate, flip } = radialTransform(middle);
      ctx.translate(cx, cy);
      ctx.rotate(rotate);
      ctx.font = `700 ${fontSize}px Poppins, Inter, system-ui, sans-serif`;
      let label = names[i];
      if (ctx.measureText(label).width > maxText) {
        while (label.length > 1 && ctx.measureText(`${label}…`).width > maxText) {
          label = label.slice(0, -1);
        }
        label = `${label}…`;
      }
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = Math.max(2, fontSize * 0.2);
      ctx.shadowOffsetY = 0.5;
      ctx.fillStyle = isHi ? '#1f1300' : '#ffffff';
      ctx.fillText(label, flip ? -labelRadius : labelRadius, 0);
      ctx.restore();
    }

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
  prizeSegments = [],
  spin,
  highlight = null,
  prizeHighlight = null,
  onSpinEnd,
  onTick,
  onPrizeTick,
  onPointerSegment,
  onPrizePointerSegment,
  className,
  variant = 'name',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const outerRotation = useRef(Math.random() * TAU);
  const innerRotation = useRef(Math.random() * TAU);
  const segRef = useRef(segments);
  const prizeSegRef = useRef(prizeSegments);
  const outerHighlightRef = useRef(highlight);
  const innerHighlightRef = useRef(prizeHighlight);
  const spinRef = useRef<{
    id: string;
    outer: { from: number; to: number };
    inner: { from: number; to: number };
    start: number;
    duration: number;
    done: boolean;
  } | null>(null);
  const onEndRef = useRef(onSpinEnd);
  const onTickRef = useRef(onTick);
  const onPrizeTickRef = useRef(onPrizeTick);
  const onPointerRef = useRef(onPointerSegment);
  const onPrizePointerRef = useRef(onPrizePointerSegment);
  const lastOuterSeg = useRef(-1);
  const lastInnerSeg = useRef(-1);
  const isDual = variant === 'dual';

  onEndRef.current = onSpinEnd;
  onTickRef.current = onTick;
  onPrizeTickRef.current = onPrizeTick;
  onPointerRef.current = onPointerSegment;
  onPrizePointerRef.current = onPrizePointerSegment;

  segRef.current = segments;
  prizeSegRef.current = prizeSegments;
  outerHighlightRef.current = highlight;
  innerHighlightRef.current = prizeHighlight;

  useEffect(() => {
    if (!spin || spin.spinId === spinRef.current?.id) return;
    const isDualSpin = isDual && prizeSegments.length > 0;
    const outerFrom = outerRotation.current;
    const innerFrom = innerRotation.current;
    const outerTo = planTarget(outerFrom, spin.winnerSegment, segRef.current.length, spin.spinId, spin.durationMs, 'outer');
    const innerTo = isDualSpin
      ? planTarget(innerFrom, spin.prizeWinnerSegment ?? 0, prizeSegRef.current.length, spin.spinId, spin.durationMs, 'inner')
      : innerFrom;

    const elapsed = spin.startedAt ? Date.now() - Date.parse(spin.startedAt) : 0;
    const clamped = Math.min(Math.max(0, Number.isFinite(elapsed) ? elapsed : 0), spin.durationMs);

    spinRef.current = {
      id: spin.spinId,
      outer: { from: outerFrom, to: outerTo },
      inner: { from: innerFrom, to: innerTo },
      start: performance.now() - (clamped < 1500 ? 0 : clamped),
      duration: spin.durationMs,
      done: false,
    };
  }, [spin, isDual, prizeSegments.length]);

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
        const eased = easeOut(t);
        outerRotation.current = s.outer.from + (s.outer.to - s.outer.from) * eased;
        innerRotation.current = s.inner.from + (s.inner.to - s.inner.from) * eased;
        if (t >= 1) {
          s.done = true;
          outerRotation.current = s.outer.to;
          innerRotation.current = s.inner.to;
          onEndRef.current?.(s.id);
        }
      } else if (outerHighlightRef.current === null && innerHighlightRef.current === null) {
        outerRotation.current += OUTER_IDLE_SPEED * dt;
        innerRotation.current += INNER_IDLE_SPEED * dt;
      }

      const outerCount = segRef.current.length;
      const innerCount = prizeSegRef.current.length;

      if (outerCount > 0) {
        const cur = segmentAtPointer(outerRotation.current, outerCount);
        if (cur !== lastOuterSeg.current) {
          lastOuterSeg.current = cur;
          onPointerRef.current?.(cur);
          if (s && !s.done) onTickRef.current?.(cur);
        }
      }

      if (isDual && innerCount > 0) {
        const cur = segmentAtPointer(innerRotation.current, innerCount);
        if (cur !== lastInnerSeg.current) {
          lastInnerSeg.current = cur;
          onPrizePointerRef.current?.(cur);
          if (s && !s.done) onPrizeTickRef.current?.(cur);
        }
      }

      if (isDual) {
        drawDualWheel(ctx, size, segRef.current, prizeSegRef.current, outerRotation.current, innerRotation.current, outerHighlightRef.current, innerHighlightRef.current);
      } else {
        drawSingleWheel(ctx, size, segRef.current, outerRotation.current, outerHighlightRef.current, variant);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isDual, variant]);

  return (
    <div ref={wrapRef} className={`relative aspect-square w-full ${className ?? ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 m-auto" aria-hidden="true" />
      {/* Pointer at top */}
      <svg
        viewBox="0 0 40 40"
        className="absolute left-1/2 -translate-x-1/2 top-0 z-10 w-[9%] max-w-[64px] min-w-[26px]"
        style={{
          filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.9)) drop-shadow(0 4px 4px rgba(0,0,0,0.6))',
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="nsw-pointer-dual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="0.5" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <path d="M4 4 H36 Q38 4 36.8 6 L21.5 34 Q20 36.5 18.5 34 L3.2 6 Q2 4 4 4 Z" fill="url(#nsw-pointer-dual)" stroke="#92400e" strokeWidth="1.5" />
        <path d="M9 7.5 H31 L20 27 Z" fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  );
}

export default NameSpinWheel;