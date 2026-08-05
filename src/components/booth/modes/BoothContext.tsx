import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';

export type BoothMode =
  'welcome' | 'attraction' | 'celebration' | 'idle' | 'digital' | 'emergency' | 'normal';

interface CelebrationData {
  winnerName: string;
  prize: string;
}

interface BoothState {
  mode: BoothMode;
  isOnline: boolean;
  lastInteraction: number;
  celebrationData: CelebrationData | null;
  queueCount: number;
  nowServing: number;
  estimatedWait: number;
  visitorsToday: number;
  drawsCompleted: number;
  remainingPrizes: number;
  grandPrizeAvailable: boolean;
  setMode: (mode: BoothMode) => void;
  triggerCelebration: (data: CelebrationData) => void;
  triggerAttraction: () => void;
  triggerWelcome: () => void;
  recordInteraction: () => void;
  setOnline: (online: boolean) => void;
  updateQueue: (data: { queueCount: number; nowServing: number; estimatedWait: number }) => void;
  updateStats: (data: {
    visitorsToday: number;
    drawsCompleted: number;
    remainingPrizes: number;
    grandPrizeAvailable: boolean;
  }) => void;
}

const BoothContext = createContext<BoothState | null>(null);

export function useBooth() {
  const ctx = useContext(BoothContext);
  if (!ctx) throw new Error('useBooth must be used within BoothProvider');
  return ctx;
}

export function BoothProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<BoothMode>('normal');
  const [isOnline, setOnline] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(() => Date.now());
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [nowServing, setNowServing] = useState(1);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [visitorsToday, setVisitorsToday] = useState(1247);
  const [drawsCompleted, setDrawsCompleted] = useState(89);
  const [remainingPrizes, setRemainingPrizes] = useState(42);
  const [grandPrizeAvailable, setGrandPrizeAvailable] = useState(true);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const attractionTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const emergencyRetryRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adjust mode in response to online/offline transitions during render
  // (React 19 recommended pattern instead of calling setState in an effect).
  const [prevOnline, setPrevOnline] = useState(isOnline);
  if (isOnline !== prevOnline) {
    setPrevOnline(isOnline);
    if (!isOnline) {
      setMode('emergency');
    } else if (mode === 'emergency') {
      setMode('normal');
    }
  }

  const recordInteraction = useCallback(() => {
    setLastInteraction(Date.now());
    if (mode === 'welcome' || mode === 'digital') {
      setMode('normal');
    }
  }, [mode]);

  const triggerCelebration = useCallback((data: CelebrationData) => {
    setCelebrationData(data);
    setMode('celebration');
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => {
      setMode('normal');
      setCelebrationData(null);
    }, 6000);
  }, []);

  const triggerAttraction = useCallback(() => {
    if (mode === 'normal' || mode === 'idle') {
      setMode('attraction');
      setTimeout(() => setMode('normal'), 4000);
    }
  }, [mode]);

  const triggerWelcome = useCallback(() => {
    setMode('welcome');
    setTimeout(() => setMode('normal'), 3000);
  }, []);

  // Auto-attraction every 10-15s when idle
  useEffect(() => {
    attractionTimerRef.current = setInterval(
      () => {
        const idleTime = Date.now() - lastInteraction;
        if (idleTime > 5000 && idleTime < 60000 && mode === 'normal') {
          setMode('attraction');
          setTimeout(() => setMode('normal'), 4000);
        }
      },
      10000 + Math.random() * 5000,
    );

    return () => {
      if (attractionTimerRef.current) clearInterval(attractionTimerRef.current);
    };
  }, [lastInteraction, mode]);

  // Digital Signage Mode - 60s inactivity
  useEffect(() => {
    const checkIdle = () => {
      const idleTime = Date.now() - lastInteraction;
      if (idleTime > 60000 && isOnline && mode === 'normal') {
        setMode('digital');
      }
    };

    const idleInterval = setInterval(checkIdle, 5000);
    return () => clearInterval(idleInterval);
  }, [lastInteraction, isOnline, mode]);

  // Welcome mode on first load
  useEffect(() => {
    const timer = setTimeout(() => triggerWelcome(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emergency auto-retry: only manages the retry interval. Mode transitions
  // (emergency/normal) are handled during render above.
  useEffect(() => {
    if (!isOnline) {
      emergencyRetryRef.current = setInterval(() => {
        // Simulate connection check
        setOnline(Math.random() > 0.3);
      }, 5000);
    }

    return () => {
      if (emergencyRetryRef.current) clearInterval(emergencyRetryRef.current);
    };
  }, [isOnline]);

  // Simulate stats updates
  useEffect(() => {
    const statsInterval = setInterval(() => {
      setVisitorsToday((p) => p + Math.floor(Math.random() * 3));
      setDrawsCompleted((p) => p + (Math.random() > 0.7 ? 1 : 0));
      setQueueCount(Math.floor(Math.random() * 50) + 10);
      setNowServing((p) => p + (Math.random() > 0.6 ? 1 : 0));
      setEstimatedWait(Math.floor(Math.random() * 10) + 2);
    }, 8000);
    return () => clearInterval(statsInterval);
  }, []);

  return (
    <BoothContext.Provider
      value={{
        mode,
        isOnline,
        lastInteraction,
        celebrationData,
        queueCount,
        nowServing,
        estimatedWait,
        visitorsToday,
        drawsCompleted,
        remainingPrizes,
        grandPrizeAvailable,
        setMode,
        triggerCelebration,
        triggerAttraction,
        triggerWelcome,
        recordInteraction,
        setOnline,
        updateQueue: (data) => {
          setQueueCount(data.queueCount);
          setNowServing(data.nowServing);
          setEstimatedWait(data.estimatedWait);
        },
        updateStats: (data) => {
          setVisitorsToday(data.visitorsToday);
          setDrawsCompleted(data.drawsCompleted);
          setRemainingPrizes(data.remainingPrizes);
          setGrandPrizeAvailable(data.grandPrizeAvailable);
        },
      }}
    >
      {children}
    </BoothContext.Provider>
  );
}
