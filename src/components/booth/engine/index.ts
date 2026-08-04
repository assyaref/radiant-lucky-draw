/**
 * LiveEventEngine - Public exports
 */
export { LiveEventEngineProvider, useLiveEventEngine } from './LiveEventEngine';
export type { LiveEventEngineApi } from './LiveEventEngine';
export { LiveEventExperience } from './LiveEventExperience';
export { IdleSceneOverlay } from './IdleSceneOverlay';
export { DemoSequenceOverlay } from './DemoSequenceOverlay';
export { AttractFlashOverlay } from './AttractFlashOverlay';
export { EventSequenceOverlay } from './EventSequenceOverlay';
export { StateMachine } from './stateMachine';
export { IdleController, IDLE_SCENES } from './idleController';
export { SceneController } from './sceneController';
export { TransitionManager, TRANSITION_VARIANTS, CINEMATIC_EASE } from './transitionManager';
export {
  DEFAULT_ENGINE_CONFIG,
  type EngineState,
  type IdleScene,
  type IdleSceneDef,
  type DemoStep,
  type EventStep,
  type TransitionType,
  type EngineConfig,
  type WinnerData,
  type EngineEvents,
} from './types';


