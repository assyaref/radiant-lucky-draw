/**
 * useAnimationController
 *
 * React hook that provides a declarative interface to the AnimationController.
 * Manages lifecycle, state synchronization, and cleanup.
 *
 * Usage:
 * ```tsx
 * const anim = useAnimationController({
 *   celebrationLevel: 'high',
 *   autoStart: true,
 *   callbacks: {
 *     onStateEnter: (state) => console.log('Entering:', state),
 *     onControllerComplete: () => console.log('Done!'),
 *   },
 * });
 *
 * // Control
 * anim.start();
 * anim.pause();
 * anim.resume();
 * anim.cancel();
 * anim.restart();
 * anim.skipTo('prize_reveal');
 *
 * // Read state
 * if (anim.isState('countdown')) { ... }
 * const progress = anim.stateProgress;
 * ```
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  type AnimationState,
  type AnimationPhase,
  type ControllerStatus,
  type CelebrationLevel,
  type AnimationControllerConfig,
  type AnimationCallbacks,
  type UseAnimationControllerReturn,
} from '../types';
import { AnimationController } from '../controller';

// ─── Hook ───────────────────────────────────────────────────────────────

/**
 * React hook for using the AnimationController.
 * Automatically cleans up on unmount.
 */
export function useAnimationController(
  config?: AnimationControllerConfig,
): UseAnimationControllerReturn {
  const controllerRef = useRef<AnimationController | null>(null);
  const [currentState, setCurrentState] = useState<AnimationState>('idle');
  const [phase, setPhase] = useState<AnimationPhase>('completed');
  const [status, setStatus] = useState<ControllerStatus>('idle');
  const [celebrationLevel, setCelebrationLevelState] = useState<CelebrationLevel>(
    config?.celebrationLevel ?? 'medium',
  );
  const [stateProgress, setStateProgress] = useState(0);
  const [overallProgress] = useState(0);

  // Build callbacks that sync React state
  const callbacks: AnimationCallbacks = {
    onStateEnter: (state) => {
      setCurrentState(state);
      setPhase('enter');
      setStateProgress(0);
      config?.callbacks?.onStateEnter?.(state);
    },
    onStateActive: (state, progress) => {
      setPhase('active');
      setStateProgress(progress);
      config?.callbacks?.onStateActive?.(state, progress);
    },
    onStateExit: (state) => {
      setPhase('exit');
      config?.callbacks?.onStateExit?.(state);
    },
    onStateComplete: (state) => {
      setPhase('completed');
      setStateProgress(1);
      config?.callbacks?.onStateComplete?.(state);
    },
    onTimelineEvent: (event) => {
      config?.callbacks?.onTimelineEvent?.(event);
    },
    onControllerStart: () => {
      setStatus('running');
      config?.callbacks?.onControllerStart?.();
    },
    onControllerPause: () => {
      setStatus('paused');
      config?.callbacks?.onControllerPause?.();
    },
    onControllerResume: () => {
      setStatus('running');
      config?.callbacks?.onControllerResume?.();
    },
    onControllerCancel: () => {
      setStatus('cancelled');
      config?.callbacks?.onControllerCancel?.();
    },
    onControllerComplete: () => {
      setStatus('completed');
      config?.callbacks?.onControllerComplete?.();
    },
    onError: (error) => {
      config?.callbacks?.onError?.(error);
    },
  };

  // Initialize controller
  useEffect(() => {
    const controller = new AnimationController({
      ...config,
      callbacks,
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // We intentionally only run this once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update callbacks when config changes
  useEffect(() => {
    controllerRef.current?.setCallbacks(callbacks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config?.callbacks?.onStateEnter,
    config?.callbacks?.onStateActive,
    config?.callbacks?.onStateExit,
    config?.callbacks?.onStateComplete,
    config?.callbacks?.onTimelineEvent,
    config?.callbacks?.onControllerStart,
    config?.callbacks?.onControllerPause,
    config?.callbacks?.onControllerResume,
    config?.callbacks?.onControllerCancel,
    config?.callbacks?.onControllerComplete,
    config?.callbacks?.onError,
  ]);

  // ─── Actions ──────────────────────────────────────────────────────

  const start = useCallback(() => {
    controllerRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    controllerRef.current?.resume();
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
  }, []);

  const restart = useCallback(() => {
    controllerRef.current?.restart();
  }, []);

  const skipTo = useCallback((state: AnimationState) => {
    controllerRef.current?.skipTo(state);
  }, []);

  const setCelebrationLevel = useCallback((level: CelebrationLevel) => {
    setCelebrationLevelState(level);
    controllerRef.current?.setCelebrationLevel(level);
  }, []);

  // ─── Queries ──────────────────────────────────────────────────────

  const isState = useCallback(
    (state: AnimationState): boolean => {
      return controllerRef.current?.isState(state) ?? currentState === state;
    },
    [currentState],
  );

  const hasStatePassed = useCallback((state: AnimationState): boolean => {
    return controllerRef.current?.hasStatePassed(state) ?? false;
  }, []);

  return {
    state: {
      currentState,
      phase,
      progress: stateProgress,
      isEntering: phase === 'enter',
      isActive: phase === 'active',
      isExiting: phase === 'exit',
      isCompleted: phase === 'completed',
    },
    status,
    celebrationLevel,
    overallProgress,
    start,
    pause,
    resume,
    cancel,
    restart,
    skipTo,
    setCelebrationLevel,
    isState,
    hasStatePassed,
  };
}
