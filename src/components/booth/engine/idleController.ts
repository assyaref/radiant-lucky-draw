/**
 * LiveEventEngine - Idle Controller
 * Manages the idle attraction loop. Cycles through:
 * Hero -> Prize Showcase -> Sponsors -> Company Profile -> CSR -> Products -> Recruitment
 * Loops automatically with smooth cinematic transitions.
 */
import type { IdleScene, IdleSceneDef } from './types';

/** The idle scene sequence (in display order) */
export const IDLE_SCENES: IdleSceneDef[] = [
  {
    id: 'hero',
    title: 'LUCKY DRAW',
    subtitle: 'Spin & Win Amazing Prizes',
    icon: '🎰',
    gradient: 'from-amber-400/20 via-blue-500/10 to-transparent',
    duration: 8000,
  },
  {
    id: 'prizeShowcase',
    title: 'GRAND PRIZE',
    subtitle: 'Platinum Package Worth $5,000',
    icon: '👑',
    gradient: 'from-amber-400/20 via-amber-500/10 to-transparent',
    duration: 8000,
  },
  {
    id: 'sponsors',
    title: 'OUR SPONSORS',
    subtitle: 'Proudly Supported by Industry Leaders',
    icon: '🤝',
    gradient: 'from-purple-400/20 via-pink-500/10 to-transparent',
    duration: 8000,
  },
  {
    id: 'companyProfile',
    title: 'RADIANT GROUP',
    subtitle: 'Leading Innovation Since 2010',
    icon: '✦',
    gradient: 'from-blue-400/20 via-purple-500/10 to-transparent',
    duration: 8000,
  },
  {
    id: 'csr',
    title: 'CSR INITIATIVES',
    subtitle: 'Empowering Communities Through Technology',
    icon: '🌍',
    gradient: 'from-green-400/20 via-emerald-500/10 to-transparent',
    duration: 8000,
  },
  {
    id: 'products',
    title: 'OUR PRODUCTS',
    subtitle: 'Premium Digital Solutions for Global Enterprises',
    icon: '💼',
    gradient: 'from-blue-400/20 via-cyan-500/10 to-transparent',
    duration: 8000,
  },
  {
    id: 'recruitment',
    title: 'JOIN OUR TEAM',
    subtitle: 'Scan QR Code for Career Opportunities',
    icon: '📋',
    gradient: 'from-purple-400/20 via-pink-500/10 to-transparent',
    duration: 8000,
  },
];

export class IdleController {
  private index = 0;
  private listeners: Array<(scene: IdleScene) => void> = [];

  /** Get the current idle scene */
  getCurrent(): IdleSceneDef {
    return IDLE_SCENES[this.index];
  }

  /** Get the current scene id */
  getCurrentId(): IdleScene {
    return IDLE_SCENES[this.index].id;
  }

  /** Get the index of a specific scene */
  getIndex(scene: IdleScene): number {
    return IDLE_SCENES.findIndex((s) => s.id === scene);
  }

  /** Subscribe to scene changes */
  subscribe(listener: (scene: IdleScene) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Advance to the next scene (loops) */
  next(): IdleScene {
    this.index = (this.index + 1) % IDLE_SCENES.length;
    const scene = this.getCurrentId();
    this.listeners.forEach((l) => l(scene));
    return scene;
  }

  /** Jump to a specific scene */
  goTo(scene: IdleScene): void {
    const idx = this.getIndex(scene);
    if (idx === -1 || idx === this.index) return;
    this.index = idx;
    this.listeners.forEach((l) => l(scene));
  }

  /** Reset to the first scene (hero) */
  reset(): void {
    this.index = 0;
    this.listeners.forEach((l) => l(this.getCurrentId()));
  }

  /** Get the total number of scenes */
  get length(): number {
    return IDLE_SCENES.length;
  }
}
