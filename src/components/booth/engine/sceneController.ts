/**
 * LiveEventEngine - Scene Controller
 * Manages the demo and event draw sequences.
 * Demo: countdown -> machineSpin -> winner -> celebration -> return idle
 * Event: countdown -> machineSpin -> winner -> celebration -> return idle
 */
import type { DemoStep, EventStep, WinnerData } from './types';

/** Demo winner pool for simulated draws */
const DEMO_WINNERS: WinnerData[] = [
  { name: 'Sarah Johnson', prize: 'Platinum Package', icon: '👑', color: '#fbbf24' },
  { name: 'Michael Chen', prize: 'Diamond Bundle', icon: '💎', color: '#60a5fa' },
  { name: 'Aisha Rahman', prize: 'Gold Edition', icon: '🏆', color: '#f59e0b' },
  { name: 'David Kim', prize: 'Silver Gift Set', icon: '🎁', color: '#a78bfa' },
  { name: 'Emma Wilson', prize: 'Bronze Reward', icon: '🎯', color: '#34d399' },
];

/** Step durations in ms for the draw sequence */
const STEP_DURATIONS: Record<DemoStep, number> = {
  countdown: 3000,
  machineSpin: 2500,
  winner: 2000,
  celebration: 6000,
};

export class SceneController {
  private demoStep: DemoStep = 'countdown';
  private eventStep: EventStep = 'countdown';
  private demoListeners: Array<(step: DemoStep) => void> = [];
  private eventListeners: Array<(step: EventStep) => void> = [];
  private winnerListeners: Array<(winner: WinnerData) => void> = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** Subscribe to demo step changes */
  onDemoStep(listener: (step: DemoStep) => void): () => void {
    this.demoListeners.push(listener);
    return () => {
      this.demoListeners = this.demoListeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to event step changes */
  onEventStep(listener: (step: EventStep) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  /** Subscribe to winner announcements */
  onWinner(listener: (winner: WinnerData) => void): () => void {
    this.winnerListeners.push(listener);
    return () => {
      this.winnerListeners = this.winnerListeners.filter((l) => l !== listener);
    };
  }

  /** Get a random demo winner */
  private randomWinner(): WinnerData {
    return DEMO_WINNERS[Math.floor(Math.random() * DEMO_WINNERS.length)];
  }

  /** Clear all pending timers */
  clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  /**
   * Run the demo draw sequence.
   * Returns a promise that resolves when the sequence completes.
   */
  runDemoSequence(onComplete: () => void): void {
    this.clearTimers();
    this.setDemoStep('countdown');

    const schedule = (step: DemoStep, delay: number) => {
      this.timers.push(
        setTimeout(() => {
          this.setDemoStep(step);
          if (step === 'winner') {
            this.winnerListeners.forEach((l) => l(this.randomWinner()));
          }
          if (step === 'celebration') {
            this.timers.push(setTimeout(onComplete, STEP_DURATIONS.celebration));
          }
        }, delay),
      );
    };

    schedule('machineSpin', STEP_DURATIONS.countdown);
    schedule('winner', STEP_DURATIONS.countdown + STEP_DURATIONS.machineSpin);
    schedule(
      'celebration',
      STEP_DURATIONS.countdown + STEP_DURATIONS.machineSpin + STEP_DURATIONS.winner,
    );
  }

  /**
   * Run the event (live) draw sequence.
   * Returns a promise that resolves when the sequence completes.
   */
  runEventSequence(winner: WinnerData, onComplete: () => void): void {
    this.clearTimers();
    this.setEventStep('countdown');

    const schedule = (step: EventStep, delay: number) => {
      this.timers.push(
        setTimeout(() => {
          this.setEventStep(step);
          if (step === 'winner') {
            this.winnerListeners.forEach((l) => l(winner));
          }
          if (step === 'celebration') {
            this.timers.push(setTimeout(onComplete, STEP_DURATIONS.celebration));
          }
        }, delay),
      );
    };

    schedule('machineSpin', STEP_DURATIONS.countdown);
    schedule('winner', STEP_DURATIONS.countdown + STEP_DURATIONS.machineSpin);
    schedule(
      'celebration',
      STEP_DURATIONS.countdown + STEP_DURATIONS.machineSpin + STEP_DURATIONS.winner,
    );
  }

  /** Get the current demo step */
  getDemoStep(): DemoStep {
    return this.demoStep;
  }

  /** Get the current event step */
  getEventStep(): EventStep {
    return this.eventStep;
  }

  private setDemoStep(step: DemoStep): void {
    this.demoStep = step;
    this.demoListeners.forEach((l) => l(step));
  }

  private setEventStep(step: EventStep): void {
    this.eventStep = step;
    this.eventListeners.forEach((l) => l(step));
  }
}
