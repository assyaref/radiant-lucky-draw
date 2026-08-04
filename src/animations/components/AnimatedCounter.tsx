/**
 * AnimatedCounter
 *
 * A reusable component that smoothly animates numeric values using
 * requestAnimationFrame for buttery 60 FPS counting.
 *
 * Usage:
 * ```tsx
 * <AnimatedCounter value={1234} duration={1.2} />
 * ```
 */

import { useEffect, useRef, useState, memo } from 'react';

interface AnimatedCounterProps {
  /** Target numeric value */
  value: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix (e.g. "$", "#") */
  prefix?: string;
  /** Suffix (e.g. "%", " people") */
  suffix?: string;
  /** CSS class for the number */
  className?: string;
  /** Whether to pulse when value changes */
  pulseOnChange?: boolean;
}

export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  pulseOnChange = false,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const [pulsing, setPulsing] = useState(false);
  const prevValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    if (from === to) return;

    // Trigger pulse on change
    if (pulseOnChange) {
      setPulsing(true);
      const pulseTimer = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(pulseTimer);
    }

    const start = performance.now();
    const change = to - from;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for a natural settle
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + change * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevValue.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, pulseOnChange]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={`${className} ${pulsing ? 'animate-kpi-pulse' : ''}`}
      style={pulsing ? { transform: 'scale(1.05)' } : undefined}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
});
