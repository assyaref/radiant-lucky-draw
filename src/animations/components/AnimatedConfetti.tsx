/**
 * AnimatedConfetti
 *
 * Framer Motion confetti animation component.
 * Creates a celebratory confetti shower with colorful falling pieces.
 *
 * No business logic - pure animation.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
  shape: 'rect' | 'circle';
  drift: number;
  duration: number;
}

const COLORS = ['#fbbf24', '#ef4444', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#f59e0b'];

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 720 - 360,
    scale: Math.random() * 0.5 + 0.5,
    delay: Math.random() * 0.5,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    drift: (Math.random() - 0.5) * 20,
    duration: 2.5 + Math.random() * 1.5,
  }));
}

export function AnimatedConfetti({
  active,
  celebrationLevel,
  duration,
  delay = 0,
  onComplete,
}: AnimationComponentProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  // Generate pieces when `active` transitions to true (React 19 recommended pattern).
  const [prevActive, setPrevActive] = useState(active);
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) {
      setPieces(generatePieces(config.confettiCount));
    }
  }

  // Clean up after animation completes.
  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration + 1000);

    return () => clearTimeout(timer);
  }, [active, duration, onComplete]);

  const visiblePieces = active ? pieces : [];

  return (
    <AnimatePresence>
      {visiblePieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="pointer-events-none fixed z-50"
          initial={{
            top: -20,
            left: `${piece.x}%`,
            opacity: 1,
            rotate: 0,
            scale: piece.scale,
          }}
          animate={{
            top: '110vh',
            left: `${piece.x + piece.drift}%`,
            opacity: 0,
            rotate: piece.rotation,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: piece.duration,
            delay: piece.delay + delay / 1000,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div
            className={piece.shape === 'rect' ? 'h-3 w-2 rounded-sm' : 'h-2 w-2 rounded-full'}
            style={{ backgroundColor: piece.color }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
