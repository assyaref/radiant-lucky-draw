/**
 * LiveEventEngine - Main Orchestrator
 * Ties together the StateMachine, IdleController, SceneController, and
 * TransitionManager into a single production-ready experience engine.
 *
 * Modes:
 *  - IDLE: Hero -> Prize Showcase -> Sponsors -> Company -> CSR -> Products -> Recruitment (loop)
 *  - DEMO: Every 45s simulate countdown -> machine spin -> winner -> celebration -> return idle
 *  - ATTRACT: Every 15s flash Grand Prize (glow, spotlight, animated banner)
 *  - EVENT: When a participant starts, interrupt idle, run live draw, return idle after winner
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StateMachine } from './stateMachine';
import { IdleController } from './idleController';
import { SceneController } from './sceneController';
import { TransitionManager } from './transitionManager';
import {
  DEFAULT_ENGINE_CONFIG,
  type DemoStep,
  type EngineConfig,
  type EngineState,
  type EventStep,
  type IdleScene,
  type TransitionType,
  type WinnerData,
} from './types';

/** Public API exposed to consumers */
export interface LiveEventEngineApi {
  /** Current engine state */
  state: EngineState;
  /** Current idle scene */
  idleScene: IdleScene;
  /** Current demo step */
  demoStep: DemoStep;
  /** Current event step */
  eventStep: EventStep;
  /** Current transition type */
  transition: TransitionType;
  /** Latest winner data */
  winner: WinnerData | null;
  /** Whether a demo sequence is running */
  isDemoRunning: boolean;
  /** Whether an event sequence is running */
  isEventRunning: boolean;
  /** Trigger a demo draw sequence */
  triggerDemo: () => void;
  /** Trigger a live event draw sequence */
  triggerEvent: (winner: WinnerData) => void;
  /** Trigger an attract flash */
  triggerAttract: () => void;
  /** Return to idle state */
  returnToIdle: () => void;
  /** Set the transition type */
  setTransition: (type: TransitionType) => void;
  /** Jump to a specific idle scene */
  goToScene: (scene: IdleScene) => void;
}

const LiveEventEngineContext = createContext<LiveEventEngineApi | null>(null);

/** Hook to consume the engine */
export function useLiveEventEngine(): LiveEventEngineApi {
  const ctx = useContext(LiveEventEngineContext);
  if (!ctx) {
    throw new Error('useLiveEventEngine must be used within a LiveEventEngineProvider');
  }
  return ctx;
}

interface LiveEventEngineProviderProps {
  children: ReactNode;
  config?: Partial<EngineConfig>;
  /** Called when a live event (participant) starts */
  onEventStart?: () => void;
  /** Called when a live event completes */
  onEventComplete?: () => void;
}

export function LiveEventEngineProvider({
  children,
  config,
  onEventStart,
  onEventComplete,
}: LiveEventEngineProviderProps) {
  const engineConfig = useMemo<EngineConfig>(
    () => ({ ...DEFAULT_ENGINE_CONFIG, ...config }),
    [config]
  );

  // Core controllers (stable refs)
  const stateMachineRef = useRef<StateMachine | null>(null);
  const idleControllerRef = useRef<IdleController | null>(null);
  const sceneControllerRef = useRef<SceneController | null>(null);
  const transitionManagerRef = useRef<TransitionManager | null>(null);

  if (!stateMachineRef.current) stateMachineRef.current = new StateMachine('idle');
  if (!idleControllerRef.current) idleControllerRef.current = new IdleController();
  if (!sceneControllerRef.current) sceneControllerRef.current = new SceneController();
  if (!transitionManagerRef.current) transitionManagerRef.current = new TransitionManager();

  const stateMachine = stateMachineRef.current;
  const idleController = idleControllerRef.current;
  const sceneController = sceneControllerRef.current;
  const transitionManager = transitionManagerRef.current;

  // Reactive state
  const [state, setState] = useState<EngineState>(stateMachine.getState());
  const [idleScene, setIdleScene] = useState<IdleScene>(idleController.getCurrentId());
  const [demoStep, setDemoStep] = useState<DemoStep>(sceneController.getDemoStep());
  const [eventStep, setEventStep] = useState<EventStep>(sceneController.getEventStep());
  const [transition, setTransitionState] = useState<TransitionType>(transitionManager.getCurrent());
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isEventRunning, setIsEventRunning] = useState(false);

  // Refs for callbacks to avoid stale closures
  const onEventStartRef = useRef(onEventStart);
  const onEventCompleteRef = useRef(onEventComplete);
  onEventStartRef.current = onEventStart;
  onEventCompleteRef.current = onEventComplete;

  // Subscribe to controllers
  useEffect(() => {
    const unsubState = stateMachine.subscribe((next) => setState(next));
    const unsubIdle = idleController.subscribe((scene) => setIdleScene(scene));
    const unsubDemo = sceneController.onDemoStep((step) => setDemoStep(step));
    const unsubEvent = sceneController.onEventStep((step) => setEventStep(step));
    const unsubWinner = sceneController.onWinner((w) => setWinner(w));
    const unsubTransition = transitionManager.subscribe((t) => setTransitionState(t));
    return () => {
      unsubState();
      unsubIdle();
      unsubDemo();
      unsubEvent();
      unsubWinner();
      unsubTransition();
    };
  }, [stateMachine, idleController, sceneController, transitionManager]);

  // ---- IDLE CONTROLLER: cycle scenes ----
  useEffect(() => {
    if (state !== 'idle') return;
    const interval = setInterval(() => {
      idleController.next();
      transitionManager.cycle();
    }, engineConfig.idleSceneInterval);
    return () => clearInterval(interval);
  }, [state, engineConfig.idleSceneInterval, idleController, transitionManager]);

  // ---- ATTRACT MODE: flash grand prize every 15s ----
  useEffect(() => {
    if (state !== 'idle') return;
    const interval = setInterval(() => {
      stateMachine.transition('attract');
      transitionManager.setTransition('zoom');
      // Return to idle after a short flash
      setTimeout(() => {
        if (stateMachine.getState() === 'attract') {
          stateMachine.transition('idle');
        }
      }, 2500);
    }, engineConfig.attractInterval);
    return () => clearInterval(interval);
  }, [state, engineConfig.attractInterval, stateMachine, transitionManager]);

  // ---- DEMO MODE: simulate draw every 45s ----
  useEffect(() => {
    if (state !== 'idle') return;
    const interval = setInterval(() => {
      stateMachine.transition('demo');
      setIsDemoRunning(true);
      transitionManager.setTransition('blur');
      sceneController.runDemoSequence(() => {
        stateMachine.transition('idle');
        setIsDemoRunning(false);
        idleController.reset();
      });
    }, engineConfig.demoInterval);
    return () => clearInterval(interval);
  }, [state, engineConfig.demoInterval, stateMachine, sceneController, transitionManager, idleController]);

  // ---- EVENT MODE: interrupt idle when participant starts ----
  const triggerEvent = useCallback(
    (eventWinner: WinnerData) => {
      // Interrupt any running sequence
      sceneController.clearTimers();
      setIsDemoRunning(false);
      // Transition to event state (interrupts idle/demo/attract)
      stateMachine.transition('event');
      setIsEventRunning(true);
      transitionManager.setTransition('wipe');
      onEventStartRef.current?.();
      sceneController.runEventSequence(eventWinner, () => {
        stateMachine.transition('idle');
        setIsEventRunning(false);
        idleController.reset();
        onEventCompleteRef.current?.();
      });
    },
    [stateMachine, sceneController, transitionManager, idleController]
  );

  // ---- Public API ----
  const triggerDemo = useCallback(() => {
    if (stateMachine.getState() !== 'idle') return;
    stateMachine.transition('demo');
    setIsDemoRunning(true);
    transitionManager.setTransition('blur');
    sceneController.runDemoSequence(() => {
      stateMachine.transition('idle');
      setIsDemoRunning(false);
      idleController.reset();
    });
  }, [stateMachine, sceneController, transitionManager, idleController]);

  const triggerAttract = useCallback(() => {
    if (stateMachine.getState() !== 'idle') return;
    stateMachine.transition('attract');
    transitionManager.setTransition('zoom');
    setTimeout(() => {
      if (stateMachine.getState() === 'attract') {
        stateMachine.transition('idle');
      }
    }, 2500);
  }, [stateMachine, transitionManager]);

  const returnToIdle = useCallback(() => {
    sceneController.clearTimers();
    setIsDemoRunning(false);
    setIsEventRunning(false);
    stateMachine.transition('idle');
    idleController.reset();
  }, [stateMachine, sceneController, idleController]);

  const setTransition = useCallback(
    (type: TransitionType) => transitionManager.setTransition(type),
    [transitionManager]
  );

  const goToScene = useCallback(
    (scene: IdleScene) => idleController.goTo(scene),
    [idleController]
  );

  const api = useMemo<LiveEventEngineApi>(
    () => ({
      state,
      idleScene,
      demoStep,
      eventStep,
      transition,
      winner,
      isDemoRunning,
      isEventRunning,
      triggerDemo,
      triggerEvent,
      triggerAttract,
      returnToIdle,
      setTransition,
      goToScene,
    }),
    [
      state,
      idleScene,
      demoStep,
      eventStep,
      transition,
      winner,
      isDemoRunning,
      isEventRunning,
      triggerDemo,
      triggerEvent,
      triggerAttract,
      returnToIdle,
      setTransition,
      goToScene,
    ]
  );

  return (
    <LiveEventEngineContext.Provider value={api}>{children}</LiveEventEngineContext.Provider>
  );
}
