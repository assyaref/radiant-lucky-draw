/**
 * AnimatedParticleBurst
 *
 * Framer Motion particle burst animation component.
 * Creates an explosive burst of particles radiating outward.
 *
 * No business logic - pure animation.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

const PARTICLE_COLORS = [
  '#fbbf24',
  '#f59e0b',
  '#ef4444',
  '#34d399',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
];

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

export function AnimatedParticleBurst({
  active,
  phase,
  celebrationLevel,
  duration,
  delay = 0,
  onComplete,
  className = '',
}: AnimationComponentProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];

  const particleCount = Math.round(30 * config.particleMultiplier);
  const animDuration = (duration / 1000) * config.speedMultiplier;

  // Generate particles once using lazy state initialization (React 19 recommended
  // pattern for impure values like Math.random).
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = 100 + Math.random() * 200;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = 3 + Math.random() * 6;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

      return {
        x,
        y,
        size,
        color,
        delay: Math.random() * 0.3,
        duration: animDuration * (0.5 + Math.random() * 0.5),
      };
    }),
  );

  if (!active) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
    >
      {/* Burst origin glow */}
      <motion.div
        className="absolute h-32 w-32 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={phase === 'enter' ? { scale: 3, opacity: 0 } : { opacity: 0 }}
        transition={{
          duration: animDuration * 0.5,
          ease: 'easeOut',
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.6), transparent 70%)',
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}60`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={
            phase === 'enter' || phase === 'active'
              ? {
                  x: p.x,
                  y: p.y,
                  opacity: [1, 0.8, 0],
                  scale: [1, 0.5, 0],
                }
              : { opacity: 0, scale: 0 }
          }
          transition={{
            duration: p.duration,
            ease: 'easeOut',
            delay: p.delay + delay / 1000,
          }}
        />
      ))}

      {/* Shockwave ring */}
      <motion.div
        className="absolute h-4 w-4 rounded-full border-2 border-amber-400/40"
        initial={{ scale: 0, opacity: 1 }}
        animate={phase === 'enter' ? { scale: 20, opacity: 0 } : { opacity: 0 }}
        transition={{
          duration: animDuration * 0.6,
          ease: 'easeOut',
          delay: delay / 1000,
        }}
      />
    </div>
  );
}
