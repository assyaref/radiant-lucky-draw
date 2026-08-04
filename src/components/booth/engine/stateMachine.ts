/**
 * LiveEventEngine - State Machine
 * Manages the core engine state transitions with a clean, deterministic
 * state machine. Handles idle, demo, attract, event, welcome, and emergency states.
 */
import type { EngineState } from './types';

/** Valid transitions from each state */
const TRANSITIONS: Record<EngineState, EngineState[]> = {
  idle: ['demo', 'attract', 'event', 'welcome', 'emergency'],
  demo: ['idle', 'event', 'emergency'],
  attract: ['idle', 'demo', 'event', 'emergency'],
  event: ['idle', 'emergency'],
  welcome: ['idle', 'event', 'emergency'],
  emergency: ['idle', 'event'],
};

/** States that can be interrupted by a live event */
const INTERRUPTIBLE: EngineState[] = ['idle', 'demo', 'attract', 'welcome'];

export class StateMachine {
  private state: EngineState = 'idle';
  private listeners: Array<(state: EngineState, prev: EngineState) => void> = [];

  constructor(initial: EngineState = 'idle') {
    this.state = initial;
  }

  /** Get the current state */
  getState(): EngineState {
    return this.state;
  }

  /** Subscribe to state changes */
  subscribe(listener: (state: EngineState, prev: EngineState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Attempt a transition to a new state */
  transition(next: EngineState): boolean {
    if (next === this.state) return false;

    const allowed = TRANSITIONS[this.state];
    const canInterrupt = INTERRUPTIBLE.includes(this.state) && next === 'event';

    if (!allowed.includes(next) && !canInterrupt) {
      // eslint-disable-next-line no-console
      console.warn(`[LiveEventEngine] Invalid transition: ${this.state} -> ${next}`);
      return false;
    }

    const prev = this.state;
    this.state = next;
    this.listeners.forEach((l) => l(next, prev));
    return true;
  }

  /** Force a transition regardless of rules (for emergency overrides) */
  force(next: EngineState): void {
    const prev = this.state;
    this.state = next;
    this.listeners.forEach((l) => l(next, prev));
  }

  /** Check if a transition is valid */
  canTransition(next: EngineState): boolean {
    if (next === this.state) return false;
    const allowed = TRANSITIONS[this.state];
    const canInterrupt = INTERRUPTIBLE.includes(this.state) && next === 'event';
    return allowed.includes(next) || canInterrupt;
  }
}
