/**
 * AnimatedCameraZoom
 *
 * Framer Motion camera zoom animation component.
 * Simulates a dramatic camera zoom-in effect on the stage.
 *
 * No business logic - pure animation.
 */

import { motion } from 'framer-motion';
import { type AnimationComponentProps, CELEBRATION_CONFIGS } from '../types';

export function AnimatedCameraZoom({
  active,
  phase,
  celebrationLevel,
  duration,
  delay = 0,
  onComplete,
  className = '',
}: AnimationComponentProps) {
  const config = CELEBRATION_CONFIGS[celebrationLevel];

  if (!active) return null;

  const animDuration = (duration / 1000) * config.speedMultiplier;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* Vignette overlay */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={
          phase === 'enter'
            ? { opacity: 0.6 }
            : phase === 'active'
              ? { opacity: [0.6, 0.8, 0.6] }
              : { opacity: 0 }
        }
        transition={{
          duration: animDuration * 0.5,
          ease: 'easeInOut',
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
        onAnimationComplete={() => {
          if (phase === 'exit' || phase === 'completed') {
            onComplete?.();
          }
        }}
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Zoom lines */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 1.5, opacity: 0 }}
        animate={
          phase === 'enter'
            ? { scale: 1, opacity: 1 }
            : phase === 'active'
              ? { scale: [1, 1.02, 1] }
              : { scale: 1.1, opacity: 0 }
        }
        transition={{
          duration: animDuration,
          ease: [0.25, 0.46, 0.45, 0.94],
          repeat: phase === 'active' ? Infinity : 0,
          delay: delay / 1000,
        }}
      >
        {/* Crosshair lines */}
        <motion.div
          className="absolute h-full w-[1px] bg-amber-400/20"
          animate={
            phase === 'active'
              ? { opacity: [0.1, 0.3, 0.1] }
              : undefined
          }
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <motion.div
          className="absolute h-[1px] w-full bg-amber-400/20"
          animate={
            phase === 'active'
              ? { opacity: [0.1, 0.3, 0.1] }
              : undefined
          }
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
        />

        {/* Corner brackets */}
        {[
          { top: '10%', left: '10%', rotate: 0 },
          { top: '10%', right: '10%', rotate: 90 },
          { bottom: '10%', left: '10%', rotate: -90 },
          { bottom: '10%', right: '10%', rotate: 180 },
        ].map((corner, i) => (
          <motion.div
            key={i}
            className="absolute h-8 w-8"
            style={{
              top: corner.top,
              left: corner.left,
              right: corner.right,
              bottom: corner.bottom,
              transform: `rotate(${corner.rotate}deg)`,
            }}
            animate={
              phase === 'active'
                ? { opacity: [0.3, 0.7, 0.3] }
                : undefined
            }
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: i * 0.3,
            }}
          >
            <div className="h-4 w-[2px] bg-amber-400/40 absolute top-0 left-0" />
            <div className="w-4 h-[2px] bg-amber-400/40 absolute top-0 left-0" />
          </motion.div>
        ))}
      </motion.div>

      {/* Camera shake */}
      <motion.div
        className="absolute inset-0"
        animate={
          phase === 'active'
            ? {
                x: [
                  0,
                  config.cameraShakeIntensity * 0.5,
                  -config.cameraShakeIntensity * 0.3,
                  config.cameraShakeIntensity * 0.2,
                  0,
                ],
                y: [
                  0,
                  -config.cameraShakeIntensity * 0.4,
                  config.cameraShakeIntensity * 0.3,
                  -config.cameraShakeIntensity * 0.2,
                  0,
                ],
              }
            : undefined
        }
        transition={{
          repeat: phase === 'active' ? Infinity : 0,
          duration: 0.3,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
