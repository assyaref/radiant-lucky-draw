/**
 * AnimationOrchestrator
 *
 * The main orchestrator component that coordinates the entire animation
 * experience. Wraps the AnimationProvider and provides a declarative API
 * for controlling the animation timeline.
 *
 * This is the primary entry point for consuming the animation system.
 *
 * Usage:
 * ```tsx
 * <AnimationOrchestrator
 *   celebrationLevel="high"
 *   autoStart={false}
 *   onStateEnter={(state) => handleStateChange(state)}
 * >
 *   {(anim) => (
 *     <div>
 *       {anim.isState('countdown') && <CountdownUI />}
 *       {anim.isState('winner_card') && <WinnerUI />}
 *       <button onClick={anim.start}>Start Draw</button>
 *     </div>
 *   )}
 * </AnimationOrchestrator>
 * ```
 */

import { type ReactNode } from 'react';
import { AnimationProvider } from './context/AnimationContext';
import { useAnimationController } from './hooks/useAnimationController';
import type { UseAnimationControllerReturn, CelebrationLevel, AnimationCallbacks } from './types';

// ─── Render Props ───────────────────────────────────────────────────────

interface AnimationOrchestratorProps {
  /** Child components or render function */
  children?: ReactNode | ((anim: UseAnimationControllerReturn) => ReactNode);
  /** Celebration level (default: 'medium') */
  celebrationLevel?: CelebrationLevel;
  /** Whether to auto-start the animation (default: false) */
  autoStart?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback hooks */
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

/**
 * AnimationOrchestrator component.
 * Provides animation context and optionally renders children with controller access.
 */
export function AnimationOrchestrator({
  children,
  ...providerProps
}: AnimationOrchestratorProps) {
  // If children is a function, we need to render with the hook inside the provider
  if (typeof children === 'function') {
    return (
      <AnimationProvider {...providerProps}>
        <AnimationOrchestratorInner>
          {children as (anim: UseAnimationControllerReturn) => ReactNode}
        </AnimationOrchestratorInner>
      </AnimationProvider>
    );
  }

  return <AnimationProvider {...providerProps}>{children}</AnimationProvider>;
}

/**
 * Inner component that uses the hook and passes it to the render prop.
 */
function AnimationOrchestratorInner({
  children,
}: {
  children: (anim: UseAnimationControllerReturn) => ReactNode;
}) {
  const anim = useAnimationController();
  return <>{children(anim)}</>;
}

// ─── Standalone Usage (without provider) ────────────────────────────────

/**
 * Standalone animation orchestrator for use without the provider.
 * Useful for one-off animations or testing.
 */
export { useAnimationController as useOrchestrator } from './hooks/useAnimationController';
