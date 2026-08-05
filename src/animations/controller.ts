/**
 * AnimationController
 *
 * Core controller that orchestrates the entire animation lifecycle.
 * Wraps the TimelineEngine with state machine logic, providing:
 * - Start / Pause / Resume / Cancel / Restart
 * - Skip to any state
 * - Celebration level management
 * - Callback hooks for lifecycle events
 * - Debug logging
 * - 60 FPS requestAnimationFrame loop
 *
 * No business logic - pure animation coordination.
 */

import {
  type AnimationState,
  type AnimationPhase,
  type ControllerStatus,
  type CelebrationLevel,
  type AnimationControllerConfig,
  type AnimationCallbacks,
} from './types';
import { TimelineEngine, createDefaultTimeline } from './timeline';

// ─── AnimationController ────────────────────────────────────────────────

export class AnimationController {
  private engine: TimelineEngine;
  private callbacks: AnimationCallbacks;
  private status: ControllerStatus = 'idle';
  private celebrationLevel: CelebrationLevel;
  private currentState: AnimationState = 'idle';
  private currentPhase: AnimationPhase = 'completed';
  private stateProgress: number = 0;
  private overallProgress: number = 0;
  private debug: boolean;
  private rafId: number | null = null;
  private lastTickTime: number = 0;
  private completedStates: Set<AnimationState> = new Set();

  constructor(config?: AnimationControllerConfig) {
    const timeline = config?.timeline ?? createDefaultTimeline();
    this.celebrationLevel = config?.celebrationLevel ?? 'medium';
    this.callbacks = config?.callbacks ?? {};
    this.debug = config?.debug ?? false;

    this.engine = new TimelineEngine(timeline);
    this.engine.setCelebrationLevel(this.celebrationLevel);

    // Wire up engine callbacks
    this.engine.onStateChangeCallback((state, phase) => {
      this.currentState = state;
      this.currentPhase = phase;

      if (phase === 'enter') {
        this.log(`[Animation] Enter state: ${state}`);
        this.callbacks.onStateEnter?.(state);
      } else if (phase === 'active') {
        this.callbacks.onStateActive?.(state, this.stateProgress);
      } else if (phase === 'exit') {
        this.log(`[Animation] Exit state: ${state}`);
        this.callbacks.onStateExit?.(state);
      } else if (phase === 'completed') {
        this.log(`[Animation] Complete state: ${state}`);
        this.completedStates.add(state);
        this.callbacks.onStateComplete?.(state);
      }
    });

    this.engine.onProgressCallback((stateProgress, overallProgress) => {
      this.stateProgress = stateProgress;
      this.overallProgress = overallProgress;
    });

    this.engine.onEventCallback((event) => {
      this.log(`[Animation] Timeline event: ${event.id} at ${event.timestamp}ms`);
      this.callbacks.onTimelineEvent?.(event);
    });

    // Auto-start if configured
    if (config?.autoStart) {
      this.start();
    }
  }

  // ─── Public Accessors ───────────────────────────────────────────────

  /** Get current animation state */
  getCurrentState(): AnimationState {
    return this.currentState;
  }

  /** Get current phase within the state */
  getCurrentPhase(): AnimationPhase {
    return this.currentPhase;
  }

  /** Get controller status */
  getStatus(): ControllerStatus {
    return this.status;
  }

  /** Get current celebration level */
  getCelebrationLevel(): CelebrationLevel {
    return this.celebrationLevel;
  }

  /** Get progress within current state (0-1) */
  getStateProgress(): number {
    return this.stateProgress;
  }

  /** Get overall timeline progress (0-1) */
  getOverallProgress(): number {
    return this.overallProgress;
  }

  /** Check if controller is actively running */
  isActive(): boolean {
    return this.status === 'running';
  }

  /** Check if controller is paused */
  isPaused(): boolean {
    return this.status === 'paused';
  }

  /** Check if controller is cancelled */
  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /** Check if controller has completed */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /** Check if currently in a specific state */
  isState(state: AnimationState): boolean {
    return this.currentState === state;
  }

  /** Check if currently in a specific phase */
  isPhase(phase: AnimationPhase): boolean {
    return this.currentPhase === phase;
  }

  /** Check if a state has been completed */
  hasStatePassed(state: AnimationState): boolean {
    return this.completedStates.has(state);
  }

  /** Get the underlying timeline engine */
  getEngine(): TimelineEngine {
    return this.engine;
  }

  // ─── Control Methods ────────────────────────────────────────────────

  /** Start the animation from the beginning */
  start(): void {
    if (this.status === 'running') {
      this.log('[Animation] Already running, ignoring start');
      return;
    }

    this.log('[Animation] Starting...');
    this.status = 'running';
    this.completedStates.clear();
    this.engine.setCelebrationLevel(this.celebrationLevel);
    this.engine.start();
    this.callbacks.onControllerStart?.();
    this.startLoop();
  }

  /** Pause the animation */
  pause(): void {
    if (this.status !== 'running') {
      this.log('[Animation] Not running, cannot pause');
      return;
    }

    this.log('[Animation] Pausing...');
    this.status = 'paused';
    this.engine.pause();
    this.stopLoop();
    this.callbacks.onControllerPause?.();
  }

  /** Resume from pause */
  resume(): void {
    if (this.status !== 'paused') {
      this.log('[Animation] Not paused, cannot resume');
      return;
    }

    this.log('[Animation] Resuming...');
    this.status = 'running';
    this.engine.resume();
    this.callbacks.onControllerResume?.();
    this.startLoop();
  }

  /** Cancel the animation entirely */
  cancel(): void {
    this.log('[Animation] Cancelling...');
    this.status = 'cancelled';
    this.engine.cancel();
    this.stopLoop();
    this.callbacks.onControllerCancel?.();
  }

  /** Restart the animation from the beginning */
  restart(): void {
    this.log('[Animation] Restarting...');
    this.stopLoop();
    this.status = 'idle';
    this.completedStates.clear();
    this.engine.reset();
    this.start();
  }

  /** Skip to a specific state */
  skipTo(state: AnimationState): void {
    this.log(`[Animation] Skipping to state: ${state}`);
    const success = this.engine.skipTo(state);
    if (!success) {
      this.log(`[Animation] Cannot skip to state: ${state} - not found`);
      this.callbacks.onError?.(new Error(`Cannot skip to state: ${state}`));
    }
  }

  /** Set celebration level (affects speed, intensity) */
  setCelebrationLevel(level: CelebrationLevel): void {
    this.celebrationLevel = level;
    this.engine.setCelebrationLevel(level);
    this.log(`[Animation] Celebration level set to: ${level}`);
  }

  /** Update callbacks */
  setCallbacks(callbacks: AnimationCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /** Clean up resources */
  destroy(): void {
    this.stopLoop();
    this.engine.cancel();
    this.status = 'cancelled';
  }

  // ─── Private ────────────────────────────────────────────────────────

  /**
   * Start the requestAnimationFrame loop.
   * Targets 60 FPS with delta-time based ticking.
   */
  private startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTickTime = performance.now();

    const tick = (now: number) => {
      if (this.status !== 'running') return;

      const deltaTime = now - this.lastTickTime;
      this.lastTickTime = now;

      // Cap delta to avoid huge jumps (e.g., after tab switch)
      const clampedDelta = Math.min(deltaTime, 100);

      // Tick the engine
      const result = this.engine.tick(clampedDelta);

      // Update state
      this.currentState = result.state;
      this.currentPhase = result.phase;

      // Check if timeline is complete
      if (this.engine.isComplete()) {
        this.log('[Animation] Timeline complete');
        this.status = 'completed';
        this.stopLoop();
        this.callbacks.onControllerComplete?.();
        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /** Stop the animation loop */
  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Debug logging */
  private log(message: string): void {
    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }
}

// ─── Factory Function ───────────────────────────────────────────────────

/**
 * Create a new AnimationController with sensible defaults.
 */
export function createAnimationController(config?: AnimationControllerConfig): AnimationController {
  return new AnimationController(config);
}
