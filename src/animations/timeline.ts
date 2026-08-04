/**
 * Animation Timeline Engine
 *
 * Manages the sequencing of animation states with precise timing,
 * event scheduling, and progress tracking.
 *
 * Features:
 * - Ordered state progression
 * - Configurable durations per state
 * - Timeline event scheduling
 * - Progress tracking (state-level and overall)
 * - Skip/cancel support per entry
 * - Loop support
 */

import {
  type AnimationState,
  type AnimationPhase,
  type TimelineConfig,
  type TimelineEntry,
  type TimelineEvent,
  type CelebrationLevel,
  ANIMATION_STATE_ORDER,
  DEFAULT_STATE_DURATIONS,
  CELEBRATION_CONFIGS,
} from './types';

// ─── Default Timeline ───────────────────────────────────────────────────

/**
 * Creates the default timeline configuration for the Lucky Draw experience.
 */
export function createDefaultTimeline(): TimelineConfig {
  return {
    entries: ANIMATION_STATE_ORDER.map((state) => ({
      state,
      duration: DEFAULT_STATE_DURATIONS[state],
      easing: getDefaultEasing(state),
      skippable: state !== 'idle' && state !== 'return_idle',
      cancelable: state !== 'winner_card' && state !== 'prize_reveal',
      events: createDefaultEvents(state),
    })),
    loop: false,
    autoPlay: false,
  };
}

/**
 * Returns the default easing for a given state.
 */
function getDefaultEasing(state: AnimationState): string {
  switch (state) {
    case 'countdown':
      return 'easeOut';
    case 'machine_spin':
      return 'easeInOut';
    case 'ball_rotation':
      return 'linear';
    case 'particle_burst':
      return 'easeOut';
    case 'prize_reveal':
      return 'easeOut';
    case 'winner_card':
      return 'spring';
    case 'confetti':
      return 'easeOut';
    default:
      return 'easeInOut';
  }
}

/**
 * Creates default timeline events for a given state.
 */
function createDefaultEvents(state: AnimationState): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  switch (state) {
    case 'countdown':
      events.push(
        { id: `${state}-start`, state, timestamp: 0, type: 'start' },
        { id: `${state}-mid`, state, timestamp: 1500, type: 'midpoint' },
        { id: `${state}-end`, state, timestamp: 3000, type: 'end' },
      );
      break;
    case 'machine_spin':
      events.push(
        { id: `${state}-start`, state, timestamp: 0, type: 'start' },
        { id: `${state}-mid`, state, timestamp: 1500, type: 'midpoint' },
        { id: `${state}-end`, state, timestamp: 3000, type: 'end' },
      );
      break;
    case 'prize_reveal':
      events.push(
        { id: `${state}-start`, state, timestamp: 0, type: 'start' },
        { id: `${state}-mid`, state, timestamp: 2000, type: 'midpoint' },
        { id: `${state}-end`, state, timestamp: 4000, type: 'end' },
      );
      break;
    case 'winner_card':
      events.push(
        { id: `${state}-start`, state, timestamp: 0, type: 'start' },
        { id: `${state}-mid`, state, timestamp: 2000, type: 'midpoint' },
        { id: `${state}-end`, state, timestamp: 4000, type: 'end' },
      );
      break;
    default:
      events.push(
        { id: `${state}-start`, state, timestamp: 0, type: 'start' },
        { id: `${state}-end`, state, timestamp: DEFAULT_STATE_DURATIONS[state], type: 'end' },
      );
  }

  return events;
}

// ─── Timeline Engine ────────────────────────────────────────────────────

/**
 * Pure timeline engine that manages state sequencing and timing.
 * No React dependencies - can be used in any context.
 */
export class TimelineEngine {
  private config: TimelineConfig;
  private currentIndex: number = 0;
  private elapsed: number = 0;
  private stateElapsed: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private completedStates: Set<AnimationState> = new Set();
  private celebrationLevel: CelebrationLevel = 'medium';
  private onStateChange?: (state: AnimationState, phase: AnimationPhase) => void;
  private onProgress?: (stateProgress: number, overallProgress: number) => void;
  private onEvent?: (event: TimelineEvent) => void;

  constructor(config?: TimelineConfig) {
    this.config = config ?? createDefaultTimeline();
  }

  // ─── Configuration ──────────────────────────────────────────────────

  /** Set celebration level (affects timing via speed multiplier) */
  setCelebrationLevel(level: CelebrationLevel): void {
    this.celebrationLevel = level;
  }

  /** Get current celebration level */
  getCelebrationLevel(): CelebrationLevel {
    return this.celebrationLevel;
  }

  /** Replace timeline config */
  setConfig(config: TimelineConfig): void {
    this.config = config;
    this.reset();
  }

  /** Register state change callback */
  onStateChangeCallback(cb: (state: AnimationState, phase: AnimationPhase) => void): void {
    this.onStateChange = cb;
  }

  /** Register progress callback */
  onProgressCallback(cb: (stateProgress: number, overallProgress: number) => void): void {
    this.onProgress = cb;
  }

  /** Register event callback */
  onEventCallback(cb: (event: TimelineEvent) => void): void {
    this.onEvent = cb;
  }

  // ─── Accessors ──────────────────────────────────────────────────────

  /** Get current animation state */
  getCurrentState(): AnimationState {
    return this.config.entries[this.currentIndex]?.state ?? 'idle';
  }

  /** Get current timeline entry */
  getCurrentEntry(): TimelineEntry | null {
    return this.config.entries[this.currentIndex] ?? null;
  }

  /** Get current index in the timeline */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** Get total number of entries */
  getTotalEntries(): number {
    return this.config.entries.length;
  }

  /** Get elapsed time in current state (ms) */
  getStateElapsed(): number {
    return this.stateElapsed;
  }

  /** Get total elapsed time (ms) */
  getTotalElapsed(): number {
    return this.elapsed;
  }

  /** Get progress within current state (0-1) */
  getStateProgress(): number {
    const entry = this.getCurrentEntry();
    if (!entry || entry.duration <= 0) return 1;
    return Math.min(this.stateElapsed / entry.duration, 1);
  }

  /** Get overall timeline progress (0-1) */
  getOverallProgress(): number {
    const totalDuration = this.getTotalDuration();
    if (totalDuration <= 0) return 1;
    return Math.min(this.elapsed / totalDuration, 1);
  }

  /** Get total duration of all entries (ms) */
  getTotalDuration(): number {
    return this.config.entries.reduce((sum, e) => sum + this.getAdjustedDuration(e), 0);
  }

  /** Get adjusted duration considering celebration level speed multiplier */
  getAdjustedDuration(entry: TimelineEntry): number {
    const speedMultiplier = CELEBRATION_CONFIGS[this.celebrationLevel].speedMultiplier;
    return Math.round(entry.duration * speedMultiplier);
  }

  /** Check if engine is running */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /** Check if engine is paused */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /** Get set of completed states */
  getCompletedStates(): ReadonlySet<AnimationState> {
    return this.completedStates;
  }

  /** Check if a specific state has been completed */
  hasStateCompleted(state: AnimationState): boolean {
    return this.completedStates.has(state);
  }

  /** Check if current state can be skipped */
  canSkip(): boolean {
    const entry = this.getCurrentEntry();
    return entry?.skippable ?? false;
  }

  /** Check if current state can be cancelled */
  canCancel(): boolean {
    const entry = this.getCurrentEntry();
    return entry?.cancelable ?? false;
  }

  /** Check if timeline has reached the end */
  isComplete(): boolean {
    return this.currentIndex >= this.config.entries.length;
  }

  // ─── Control ────────────────────────────────────────────────────────

  /** Start the timeline from the beginning */
  start(): void {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.enterCurrentState();
  }

  /** Pause the timeline */
  pause(): void {
    if (!this.isRunning) return;
    this.isPaused = true;
  }

  /** Resume from pause */
  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
  }

  /** Cancel the timeline entirely */
  cancel(): void {
    this.isRunning = false;
    this.isPaused = false;
  }

  /** Reset to initial state */
  reset(): void {
    this.currentIndex = 0;
    this.elapsed = 0;
    this.stateElapsed = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.completedStates.clear();
  }

  /** Skip to a specific state in the timeline */
  skipTo(state: AnimationState): boolean {
    const index = this.config.entries.findIndex((e) => e.state === state);
    if (index < 0) return false;

    // Mark all states before the target as completed
    for (let i = 0; i < index; i++) {
      this.completedStates.add(this.config.entries[i].state);
    }

    this.currentIndex = index;
    this.stateElapsed = 0;
    this.enterCurrentState();
    return true;
  }

  /** Advance to the next state */
  next(): boolean {
    if (this.isComplete()) {
      if (this.config.loop) {
        this.currentIndex = 0;
        this.completedStates.clear();
        this.enterCurrentState();
        return true;
      }
      return false;
    }

    // Mark current as completed
    const currentEntry = this.getCurrentEntry();
    if (currentEntry) {
      this.completedStates.add(currentEntry.state);
    }

    this.currentIndex++;
    this.stateElapsed = 0;

    if (this.isComplete()) {
      if (this.config.loop) {
        this.currentIndex = 0;
        this.completedStates.clear();
        this.enterCurrentState();
      }
      return false;
    }

    this.enterCurrentState();
    return true;
  }

  /**
   * Tick the engine forward by deltaTime ms.
   * Returns the current state and phase after the tick.
   */
  tick(deltaTime: number): { state: AnimationState; phase: AnimationPhase } {
    if (!this.isRunning || this.isPaused || this.isComplete()) {
      return { state: this.getCurrentState(), phase: 'active' };
    }

    const entry = this.getCurrentEntry();
    if (!entry) {
      return { state: 'idle', phase: 'completed' };
    }

    const adjustedDuration = this.getAdjustedDuration(entry);
    const previousElapsed = this.stateElapsed;

    this.stateElapsed += deltaTime;
    this.elapsed += deltaTime;

    // Determine phase
    let phase: AnimationPhase;
    const progress = this.getStateProgress();

    if (progress < 0.05) {
      phase = 'enter';
    } else if (progress >= 1) {
      phase = 'completed';
    } else if (progress > 0.9) {
      phase = 'exit';
    } else {
      phase = 'active';
    }

    // Fire events that fall within this tick
    if (entry.events) {
      for (const event of entry.events) {
        const adjustedTimestamp = Math.round(event.timestamp * CELEBRATION_CONFIGS[this.celebrationLevel].speedMultiplier);
        if (previousElapsed < adjustedTimestamp && this.stateElapsed >= adjustedTimestamp) {
          this.onEvent?.(event);
        }
      }
    }

    // Notify progress
    this.onProgress?.(this.getStateProgress(), this.getOverallProgress());

    // Check if state duration has elapsed
    if (this.stateElapsed >= adjustedDuration) {
      this.onStateChange?.(entry.state, 'completed');
      this.next();
      return { state: entry.state, phase: 'completed' };
    }

    this.onStateChange?.(entry.state, phase);
    return { state: entry.state, phase };
  }

  // ─── Private ────────────────────────────────────────────────────────

  private enterCurrentState(): void {
    const entry = this.getCurrentEntry();
    if (entry) {
      this.onStateChange?.(entry.state, 'enter');
    }
  }
}

// ─── Utility Functions ──────────────────────────────────────────────────

/**
 * Calculate the total duration of a timeline config.
 */
export function calculateTotalDuration(config: TimelineConfig, level?: CelebrationLevel): number {
  const speedMultiplier = level ? CELEBRATION_CONFIGS[level].speedMultiplier : 1;
  return config.entries.reduce((sum, e) => sum + Math.round(e.duration * speedMultiplier), 0);
}

/**
 * Get the index of a state in the timeline.
 */
export function getStateIndex(state: AnimationState): number {
  return ANIMATION_STATE_ORDER.indexOf(state);
}

/**
 * Check if a state comes before another in the timeline.
 */
export function isStateBefore(a: AnimationState, b: AnimationState): boolean {
  return getStateIndex(a) < getStateIndex(b);
}

/**
 * Get all states up to and including the given state.
 */
export function getStatesUpTo(state: AnimationState): AnimationState[] {
  const index = getStateIndex(state);
  return ANIMATION_STATE_ORDER.slice(0, index + 1);
}

/**
 * Get all states after the given state.
 */
export function getStatesAfter(state: AnimationState): AnimationState[] {
  const index = getStateIndex(state);
  return ANIMATION_STATE_ORDER.slice(index + 1);
}
