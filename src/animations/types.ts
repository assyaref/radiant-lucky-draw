/**
 * Animation Orchestrator Types
 *
 * Defines all types for the animation system:
 * - Animation states (state machine)
 * - Timeline events
 * - Celebration levels
 * - Configuration
 */

// ─── Animation State Machine ────────────────────────────────────────────

/**
 * All possible animation states in the Lucky Draw experience.
 * Maps directly to the animation timeline.
 */
export type AnimationState =
  | 'idle'
  | 'countdown'
  | 'machine_spin'
  | 'lighting'
  | 'camera_zoom'
  | 'ball_rotation'
  | 'particle_burst'
  | 'prize_reveal'
  | 'winner_card'
  | 'confetti'
  | 'return_idle';

/**
 * Animation phase within a single state.
 * Each state goes through enter → active → exit phases.
 */
export type AnimationPhase = 'enter' | 'active' | 'exit' | 'completed';

// ─── Celebration Levels ─────────────────────────────────────────────────

/**
 * Celebration intensity levels.
 * Controls particle count, animation speed, sound intensity, etc.
 */
export type CelebrationLevel = 'low' | 'medium' | 'high' | 'epic';

/**
 * Configuration per celebration level.
 */
export interface CelebrationLevelConfig {
  /** Duration multiplier (1 = normal speed) */
  speedMultiplier: number;
  /** Particle count multiplier */
  particleMultiplier: number;
  /** Whether to show fireworks */
  showFireworks: boolean;
  /** Whether to play intense sound effects */
  intenseSound: boolean;
  /** Camera shake intensity in pixels */
  cameraShakeIntensity: number;
  /** Glow/lighting intensity (0-1) */
  glowIntensity: number;
  /** Confetti piece count */
  confettiCount: number;
}

// ─── Timeline ───────────────────────────────────────────────────────────

/**
 * A single timeline event.
 */
export interface TimelineEvent {
  /** Unique identifier */
  id: string;
  /** The animation state this event belongs to */
  state: AnimationState;
  /** When this event fires (ms from state start) */
  timestamp: number;
  /** Event type */
  type: 'start' | 'midpoint' | 'end' | 'custom';
  /** Optional callback data */
  data?: Record<string, unknown>;
}

/**
 * Timeline configuration for a single animation state.
 */
export interface TimelineEntry {
  /** The animation state */
  state: AnimationState;
  /** Duration of this state in ms */
  duration: number;
  /** Easing function name for transitions */
  easing?: string;
  /** Events that fire during this state */
  events?: TimelineEvent[];
  /** Whether this state can be skipped */
  skippable?: boolean;
  /** Whether this state can be cancelled */
  cancelable?: boolean;
}

/**
 * Complete timeline configuration.
 */
export interface TimelineConfig {
  /** Ordered list of timeline entries */
  entries: TimelineEntry[];
  /** Whether the timeline loops */
  loop?: boolean;
  /** Whether to auto-play on creation */
  autoPlay?: boolean;
}

// ─── Animation Controller ───────────────────────────────────────────────

/**
 * Status of the animation controller.
 */
export type ControllerStatus = 'idle' | 'running' | 'paused' | 'cancelled' | 'completed';

/**
 * Callback hooks for animation lifecycle events.
 */
export interface AnimationCallbacks {
  onStateEnter?: (state: AnimationState) => void;
  onStateActive?: (state: AnimationState, progress: number) => void;
  onStateExit?: (state: AnimationState) => void;
  onStateComplete?: (state: AnimationState) => void;
  onTimelineEvent?: (event: TimelineEvent) => void;
  onControllerStart?: () => void;
  onControllerPause?: () => void;
  onControllerResume?: () => void;
  onControllerCancel?: () => void;
  onControllerComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Configuration for the AnimationController.
 */
export interface AnimationControllerConfig {
  /** Celebration level (affects speed, intensity) */
  celebrationLevel?: CelebrationLevel;
  /** Timeline configuration */
  timeline?: TimelineConfig;
  /** Callback hooks */
  callbacks?: AnimationCallbacks;
  /** Whether to start automatically */
  autoStart?: boolean;
  /** Debug mode (logs all state transitions) */
  debug?: boolean;
}

// ─── Animation Context ──────────────────────────────────────────────────

/**
 * Context value provided by the AnimationProvider.
 */
export interface AnimationContextValue {
  /** Current animation state */
  currentState: AnimationState;
  /** Current phase within the state */
  phase: AnimationPhase;
  /** Controller status */
  status: ControllerStatus;
  /** Current celebration level */
  celebrationLevel: CelebrationLevel;
  /** Progress within current state (0-1) */
  stateProgress: number;
  /** Overall timeline progress (0-1) */
  overallProgress: number;
  /** Whether the controller is actively running */
  isActive: boolean;
  /** Whether the controller is paused */
  isPaused: boolean;
  /** Whether the controller is cancelled */
  isCancelled: boolean;

  // Control methods
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  restart: () => void;
  skipTo: (state: AnimationState) => void;
  setCelebrationLevel: (level: CelebrationLevel) => void;

  // State queries
  isState: (state: AnimationState) => boolean;
  isPhase: (phase: AnimationPhase) => boolean;
  hasStatePassed: (state: AnimationState) => boolean;
}

// ─── Animation Component Props ──────────────────────────────────────────

/**
 * Base props for all animation components.
 */
export interface AnimationComponentProps {
  /** Whether the animation is active */
  active: boolean;
  /** Current animation phase */
  phase: AnimationPhase;
  /** Celebration level for intensity scaling */
  celebrationLevel: CelebrationLevel;
  /** Duration of the animation in ms */
  duration: number;
  /** Delay before animation starts in ms */
  delay?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional class names */
  className?: string;
}

// ─── Hook Return Types ──────────────────────────────────────────────────

/**
 * Return type for useAnimationState hook.
 */
export interface UseAnimationStateReturn {
  currentState: AnimationState;
  phase: AnimationPhase;
  progress: number;
  isEntering: boolean;
  isActive: boolean;
  isExiting: boolean;
  isCompleted: boolean;
}

/**
 * Return type for useAnimationController hook.
 */
export interface UseAnimationControllerReturn {
  /** Current state info */
  state: UseAnimationStateReturn;
  /** Controller status */
  status: ControllerStatus;
  /** Celebration level */
  celebrationLevel: CelebrationLevel;
  /** Overall progress (0-1) */
  overallProgress: number;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  restart: () => void;
  skipTo: (state: AnimationState) => void;
  setCelebrationLevel: (level: CelebrationLevel) => void;

  // Queries
  isState: (state: AnimationState) => boolean;
  hasStatePassed: (state: AnimationState) => boolean;
}

// ─── Framer Motion Variants ─────────────────────────────────────────────

/**
 * Standard animation variants for consistent transitions.
 */
export interface StandardVariants {
  initial: Record<string, unknown>;
  enter: Record<string, unknown>;
  exit: Record<string, unknown>;
}

// ─── Default Constants ──────────────────────────────────────────────────

/** Default durations per state (ms) */
export const DEFAULT_STATE_DURATIONS: Record<AnimationState, number> = {
  idle: 0,
  countdown: 3000,
  machine_spin: 3000,
  lighting: 2000,
  camera_zoom: 1500,
  ball_rotation: 2500,
  particle_burst: 2000,
  prize_reveal: 4000,
  winner_card: 4000,
  confetti: 3000,
  return_idle: 1000,
};

/** Ordered animation states */
export const ANIMATION_STATE_ORDER: readonly AnimationState[] = [
  'idle',
  'countdown',
  'machine_spin',
  'lighting',
  'camera_zoom',
  'ball_rotation',
  'particle_burst',
  'prize_reveal',
  'winner_card',
  'confetti',
  'return_idle',
] as const;

/** Celebration level configurations */
export const CELEBRATION_CONFIGS: Record<CelebrationLevel, CelebrationLevelConfig> = {
  low: {
    speedMultiplier: 1.5,
    particleMultiplier: 0.3,
    showFireworks: false,
    intenseSound: false,
    cameraShakeIntensity: 0,
    glowIntensity: 0.3,
    confettiCount: 20,
  },
  medium: {
    speedMultiplier: 1.0,
    particleMultiplier: 0.6,
    showFireworks: false,
    intenseSound: false,
    cameraShakeIntensity: 3,
    glowIntensity: 0.5,
    confettiCount: 50,
  },
  high: {
    speedMultiplier: 0.8,
    particleMultiplier: 1.0,
    showFireworks: true,
    intenseSound: true,
    cameraShakeIntensity: 6,
    glowIntensity: 0.75,
    confettiCount: 100,
  },
  epic: {
    speedMultiplier: 0.6,
    particleMultiplier: 2.0,
    showFireworks: true,
    intenseSound: true,
    cameraShakeIntensity: 10,
    glowIntensity: 1.0,
    confettiCount: 200,
  },
};
