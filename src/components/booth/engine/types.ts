/**
 * LiveEventEngine - Type definitions
 * State machine types for the exhibition booth experience engine.
 */

/** Core engine states */
export type EngineState =
  | 'idle' // Attraction loop (hero, prizes, sponsors, company, CSR, products, recruitment)
  | 'demo' // Simulated draw sequence (countdown -> spin -> winner -> celebration)
  | 'attract' // Grand prize flash (every 15s)
  | 'event' // Live draw in progress (participant started)
  | 'welcome' // Initial welcome overlay
  | 'emergency'; // Connection lost

/** Idle scene identifiers */
export type IdleScene =
  | 'hero'
  | 'prizeShowcase'
  | 'sponsors'
  | 'companyProfile'
  | 'csr'
  | 'products'
  | 'recruitment';

/** Demo draw sub-steps */
export type DemoStep = 'countdown' | 'machineSpin' | 'winner' | 'celebration';

/** Event draw sub-steps */
export type EventStep = 'countdown' | 'machineSpin' | 'winner' | 'celebration';

/** Transition types for cinematic scene changes */
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'blur' | 'wipe';

/** A single idle scene definition */
export interface IdleSceneDef {
  id: IdleScene;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  /** Duration in ms before advancing to next scene */
  duration: number;
}

/** Engine configuration */
export interface EngineConfig {
  /** Idle scene cycle interval (ms) */
  idleSceneInterval: number;
  /** Demo mode interval (ms) - every 45s */
  demoInterval: number;
  /** Attract mode interval (ms) - every 15s */
  attractInterval: number;
  /** Demo celebration duration (ms) */
  demoCelebrationDuration: number;
  /** Event celebration duration (ms) */
  eventCelebrationDuration: number;
  /** Transition duration (ms) */
  transitionDuration: number;
}

/** Default engine configuration */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  idleSceneInterval: 8000,
  demoInterval: 45000,
  attractInterval: 15000,
  demoCelebrationDuration: 6000,
  eventCelebrationDuration: 6000,
  transitionDuration: 800,
};

/** Winner data for demo/event celebrations */
export interface WinnerData {
  name: string;
  prize: string;
  icon: string;
  color: string;
}

/** Engine event payloads */
export interface EngineEvents {
  onStateChange: (state: EngineState) => void;
  onIdleSceneChange: (scene: IdleScene) => void;
  onDemoStepChange: (step: DemoStep) => void;
  onEventStepChange: (step: EventStep) => void;
  onWinner: (winner: WinnerData) => void;
  onTransition: (type: TransitionType) => void;
}
