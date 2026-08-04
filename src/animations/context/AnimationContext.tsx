/**
 * AnimationContext
 *
 * React context provider for the Animation Orchestrator.
 * Makes the animation state and controls available to all descendant components.
 *
 * Usage:
 * ```tsx
 * <AnimationProvider
 *   celebrationLevel="high"
 *   autoStart={false}
 *   onStateEnter={(state) => console.log('Entering:', state)}
 * >
 *   <YourApp />
 * </AnimationProvider>
 * ```
 */

import { createContext, type ReactNode } from 'react';
import {
  type AnimationPhase,
  type CelebrationLevel,
  type AnimationContextValue,
  type AnimationCallbacks,
} from '../types';
import { useAnimationController } from '../hooks/useAnimationController';

// ─── Context ────────────────────────────────────────────────────────────

export const AnimationContext = createContext<AnimationContextValue | null>(null);

// ─── Provider Props ─────────────────────────────────────────────────────

export interface AnimationProviderProps {
  /** Child components */
  children: ReactNode;
  /** Celebration level (default: 'medium') */
  celebrationLevel?: CelebrationLevel;
  /** Whether to auto-start the animation (default: false) */
  autoStart?: boolean;
  /** Enable debug logging */
  debug?: boolean;

  // Callbacks
  onStateEnter?: AnimationCallbacks['onStateEnter'];
  onStateActive?: AnimationCallbacks['onStateActive'];
  onStateExit?: AnimationCallbacks['onStateExit'];
  onStateComplete?: AnimationCallbacks['onStateComplete'];
  onTimelineEvent?: AnimationCallbacks['onTimelineEvent'];
  onControllerStart?: AnimationCallbacks['onControllerStart'];
  onControllerPause?: AnimationCallbacks['onControllerPause'];
  onControllerResume?: AnimationCallbacks['onControllerResume'];
  onControllerCancel?: AnimationCallbacks['onControllerCancel'];
  onControllerComplete?: AnimationCallbacks['onControllerComplete'];
  onError?: AnimationCallbacks['onError'];
}

// ─── Provider Component ─────────────────────────────────────────────────

export function AnimationProvider({
  children,
  celebrationLevel = 'medium',
  autoStart = false,
  debug = false,
  onStateEnter,
  onStateActive,
  onStateExit,
  onStateComplete,
  onTimelineEvent,
  onControllerStart,
  onControllerPause,
  onControllerResume,
  onControllerCancel,
  onControllerComplete,
  onError,
}: AnimationProviderProps) {
  const anim = useAnimationController({
    celebrationLevel,
    autoStart,
    debug,
    callbacks: {
      onStateEnter,
      onStateActive,
      onStateExit,
      onStateComplete,
      onTimelineEvent,
      onControllerStart,
      onControllerPause,
      onControllerResume,
      onControllerCancel,
      onControllerComplete,
      onError,
    },
  });

  const contextValue: AnimationContextValue = {
    currentState: anim.state.currentState,
    phase: anim.state.phase,
    status: anim.status,
    celebrationLevel: anim.celebrationLevel,
    stateProgress: anim.state.progress,
    overallProgress: anim.overallProgress,
    isActive: anim.status === 'running',
    isPaused: anim.status === 'paused',
    isCancelled: anim.status === 'cancelled',

    start: anim.start,
    pause: anim.pause,
    resume: anim.resume,
    cancel: anim.cancel,
    restart: anim.restart,
    skipTo: anim.skipTo,
    setCelebrationLevel: anim.setCelebrationLevel,

    isState: anim.isState,
    isPhase: (phase: AnimationPhase) => anim.state.phase === phase,
    hasStatePassed: anim.hasStatePassed,
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
}
