/**
 * useAnimationTimeline
 *
 * Hook for accessing timeline-level information.
 * Useful for progress bars, stage indicators, and timeline visualization.
 *
 * Usage:
 * ```tsx
 * const { totalDuration, overallProgress, currentIndex, totalEntries } = useAnimationTimeline();
 *
 * return <ProgressBar value={overallProgress} label={`${currentIndex}/${totalEntries}`} />;
 * ```
 */

import { useContext, useMemo } from 'react';
import { type AnimationState, ANIMATION_STATE_ORDER } from '../types';
import { AnimationContext } from '../context/AnimationContext';

interface UseAnimationTimelineReturn {
  /** Total duration of the timeline in ms */
  totalDuration: number;
  /** Overall progress (0-1) */
  overallProgress: number;
  /** Current state index in the timeline */
  currentIndex: number;
  /** Total number of states */
  totalEntries: number;
  /** Ordered list of all animation states */
  stateOrder: readonly AnimationState[];
  /** States that have been completed */
  completedStates: AnimationState[];
  /** Current active state */
  currentState: AnimationState;
}

/**
 * Hook for timeline-level information.
 */
export function useAnimationTimeline(): UseAnimationTimelineReturn {
  const ctx = useContext(AnimationContext);

  if (!ctx) {
    throw new Error(
      'useAnimationTimeline must be used within an AnimationProvider. ' +
        'Wrap your component tree with <AnimationProvider>.',
    );
  }

  return useMemo(() => {
    const currentIndex = ANIMATION_STATE_ORDER.indexOf(ctx.currentState);
    const completedStates = ANIMATION_STATE_ORDER.filter((s) => ctx.hasStatePassed(s));

    return {
      totalDuration: 0, // Computed internally by the controller
      overallProgress: ctx.overallProgress,
      currentIndex: currentIndex >= 0 ? currentIndex : 0,
      totalEntries: ANIMATION_STATE_ORDER.length,
      stateOrder: ANIMATION_STATE_ORDER,
      completedStates,
      currentState: ctx.currentState,
    };
  }, [ctx.currentState, ctx.overallProgress, ctx.hasStatePassed]);
}
