/**
 * Animation Orchestrator
 *
 * Central export point for the entire animation system.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────┐
 * │                   AnimationOrchestrator             │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
 * │  │ Timeline  │  │Controller│  │  State Machine   │  │
 * │  │  Engine   │→ │          │→ │  (Phases)        │  │
 * │  └──────────┘  └──────────┘  └──────────────────┘  │
 * │        ↓              ↓               ↓             │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
 * │  │  Hooks   │  │ Context  │  │   Components     │  │
 * │  │ (React)  │  │(Provider)│  │ (Framer Motion)  │  │
 * │  └──────────┘  └──────────┘  └──────────────────┘  │
 * └─────────────────────────────────────────────────────┘
 *
 * Usage:
 * ```tsx
 * // Option 1: Use the provider + hooks
 * <AnimationProvider celebrationLevel="high">
 *   <YourApp />
 * </AnimationProvider>
 *
 * // Option 2: Use the hook directly
 * const anim = useAnimationController({ autoStart: true });
 *
 * // Option 3: Use standalone components
 * <AnimatedCountdown active={true} count={3} ... />
 * ```
 */

// ─── Types ──────────────────────────────────────────────────────────────
export type {
  AnimationState,
  AnimationPhase,
  ControllerStatus,
  CelebrationLevel,
  CelebrationLevelConfig,
  TimelineEvent,
  TimelineEntry,
  TimelineConfig,
  AnimationCallbacks,
  AnimationControllerConfig,
  AnimationContextValue,
  AnimationComponentProps,
  UseAnimationStateReturn,
  UseAnimationControllerReturn,
  StandardVariants,
} from './types';

export {
  ANIMATION_STATE_ORDER,
  DEFAULT_STATE_DURATIONS,
  CELEBRATION_CONFIGS,
} from './types';

// ─── Timeline Engine ────────────────────────────────────────────────────
export { TimelineEngine, createDefaultTimeline, calculateTotalDuration, getStateIndex, isStateBefore, getStatesUpTo, getStatesAfter } from './timeline';

// ─── Controller ─────────────────────────────────────────────────────────
export { AnimationController, createAnimationController } from './controller';

// ─── Context ────────────────────────────────────────────────────────────
export { AnimationContext, AnimationProvider } from './context';
export type { AnimationProviderProps } from './context';

// ─── Hooks ──────────────────────────────────────────────────────────────
export { useAnimationController, useAnimationState, useCelebrationLevel, useAnimationTimeline } from './hooks';

// ─── Components ─────────────────────────────────────────────────────────
export {
  AnimatedCountdown,
  AnimatedMachineSpin,
  AnimatedLighting,
  AnimatedCameraZoom,
  AnimatedBallRotation,
  AnimatedParticleBurst,
  AnimatedPrizeReveal,
  AnimatedWinnerCard,
  AnimatedConfetti,
  AnimatedIdle,
  AnimatedReturnIdle,
} from './components';

// ─── Motion Variants & Reusable Motion Components ───────────────────────
export {
  EASE_LUXURY,
  EASE_CINEMATIC,
  EASE_SOFT,
  EASE_SPRING,
  DURATION,
  transition,
  heroContainer,
  heroLine,
  heroSubtitle,
  cardEntrance,
  cardHover,
  cardBreathe,
  panelSlide,
  floatLoop,
  rotateLoop,
  glowLoop,
  pulseLoop,
  lightSweep,
  countNumber,
  winnerCard,
  portraitZoom,
  progressFill,
  queuePulse,
  kpiPulse,
  iconFloat,
  buttonPulse,
  cameraZoom,
  cameraPan,
  staggerContainer,
  fadeUp,
  fadeIn,
  motionVariants,
} from './variants';

export { AnimatedCounter } from './components/AnimatedCounter';


