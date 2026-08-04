/**
 * LiveEventEngine - Transition Manager
 * Manages cinematic transitions between scenes and states.
 * Provides smooth fade/slide/zoom/blur/wipe transitions.
 */
import type { TransitionType } from './types';
import type { TargetAndTransition } from 'framer-motion';

/** Transition variants for framer-motion */
export interface TransitionVariants {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
}

export const TRANSITION_VARIANTS: Record<TransitionType, TransitionVariants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 80 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -80 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(20px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(20px)' },
  },
  wipe: {
    initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
    animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
    exit: { opacity: 0, clipPath: 'inset(0 0% 0 100%)' },
  },
};


/** Shared easing curve for cinematic transitions */
export const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const;

export class TransitionManager {
  private current: TransitionType = 'fade';
  private listeners: Array<(type: TransitionType) => void> = [];

  /** Get the current transition type */
  getCurrent(): TransitionType {
    return this.current;
  }

  /** Subscribe to transition changes */
  subscribe(listener: (type: TransitionType) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Set the transition type for the next scene change */
  setTransition(type: TransitionType): void {
    this.current = type;
    this.listeners.forEach((l) => l(type));
  }

  /** Cycle through transition types (for variety) */
  cycle(): TransitionType {
    const types: TransitionType[] = ['fade', 'slide', 'zoom', 'blur', 'wipe'];
    const idx = types.indexOf(this.current);
    this.current = types[(idx + 1) % types.length];
    this.listeners.forEach((l) => l(this.current));
    return this.current;
  }

  /** Get the framer-motion variants for the current transition */
  getVariants() {
    return TRANSITION_VARIANTS[this.current];
  }
}
