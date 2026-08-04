/**
 * useCelebrationLevel
 *
 * Hook for reading and setting the celebration level.
 * Provides the current level config for intensity-based rendering.
 *
 * Usage:
 * ```tsx
 * const { level, config, setLevel } = useCelebrationLevel();
 *
 * return (
 *   <ParticleEffect
 *     count={config.particleMultiplier * 100}
 *     intensity={config.glowIntensity}
 *   />
 * );
 * ```
 */

import { useContext, useMemo } from 'react';
import { type CelebrationLevel, CELEBRATION_CONFIGS, type CelebrationLevelConfig } from '../types';
import { AnimationContext } from '../context/AnimationContext';

interface UseCelebrationLevelReturn {
  /** Current celebration level */
  level: CelebrationLevel;
  /** Configuration for the current level */
  config: CelebrationLevelConfig;
  /** Set a new celebration level */
  setLevel: (level: CelebrationLevel) => void;
}

/**
 * Hook to access and control the celebration level.
 */
export function useCelebrationLevel(): UseCelebrationLevelReturn {
  const ctx = useContext(AnimationContext);

  if (!ctx) {
    throw new Error(
      'useCelebrationLevel must be used within an AnimationProvider. ' +
        'Wrap your component tree with <AnimationProvider>.',
    );
  }

  const config = useMemo(
    () => CELEBRATION_CONFIGS[ctx.celebrationLevel],
    [ctx.celebrationLevel],
  );

  return {
    level: ctx.celebrationLevel,
    config,
    setLevel: ctx.setCelebrationLevel,
  };
}
