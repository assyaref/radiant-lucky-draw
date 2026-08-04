/**
 * useAnimationState
 *
 * Lightweight hook for consuming a single animation state from the context.
 * Useful for individual components that need to react to specific states.
 *
 * Usage:
 * ```tsx
 * const { isActive, phase, progress } = useAnimationState('countdown');
 *
 * if (isActive) {
 *   return <CountdownAnimation progress={progress} />;
 * }
 * ```
 */

import { useContext, useMemo } from 'react';
import { type AnimationState, type UseAnimationStateReturn } from '../types';
import { AnimationContext } from '../context/AnimationContext';

/**
 * Hook to observe a specific animation state.
 * Returns whether the state is active, its phase, and progress.
 */
export function useAnimationState(state: AnimationState): UseAnimationStateReturn {
  const ctx = useContext(AnimationContext);

  if (!ctx) {
    throw new Error(
      'useAnimationState must be used within an AnimationProvider. ' +
        'Wrap your component tree with <AnimationProvider>.',
    );
  }

  return useMemo(() => {
    const isCurrentState = ctx.currentState === state;
    const isCompleted = ctx.hasStatePassed(state);

    return {
      currentState: ctx.currentState,
      phase: isCurrentState ? ctx.phase : isCompleted ? 'completed' : 'completed',
      progress: isCurrentState ? ctx.stateProgress : isCompleted ? 1 : 0,
      isEntering: isCurrentState && ctx.phase === 'enter',
      isActive: isCurrentState && ctx.phase === 'active',
      isExiting: isCurrentState && ctx.phase === 'exit',
      isCompleted,
    };
  }, [state, ctx.currentState, ctx.phase, ctx.stateProgress, ctx.hasStatePassed]);
}
