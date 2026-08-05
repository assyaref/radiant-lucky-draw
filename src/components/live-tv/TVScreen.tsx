import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveTVStore } from '../../store/live-tv/liveTVStore';
import { useQueueStore } from '../../store/queue/queueStore';
import { IdleScreen } from './screens/IdleScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ParticipantScreen } from './screens/ParticipantScreen';
import { CountdownScreen } from './screens/CountdownScreen';
import { MachineScreen } from './screens/MachineScreen';
import { DrawingScreen } from './screens/DrawingScreen';
import { WinnerScreen } from './screens/WinnerScreen';
import { PrizeRevealScreen } from './screens/PrizeRevealScreen';
import { CongratulationsScreen } from './screens/CongratulationsScreen';
import { ConfettiEffect } from './effects/ConfettiEffect';
import type { TVStage, TVParticipant } from '../../types/live-tv';

function renderScreen(stage: TVStage, participant: TVParticipant | null) {
  switch (stage) {
    case 'idle':
      return <IdleScreen />;
    case 'loading':
      return <LoadingScreen />;
    case 'participant':
      return participant ? <ParticipantScreen participant={participant} /> : <LoadingScreen />;
    case 'countdown':
      return <CountdownScreen />;
    case 'machine':
      return <MachineScreen />;
    case 'drawing':
      return <DrawingScreen />;
    case 'winner':
      return <WinnerScreen />;
    case 'confetti':
      return <WinnerScreen />;
    case 'prize':
      return <PrizeRevealScreen />;
    case 'congratulations':
      return <CongratulationsScreen />;
    default:
      return <IdleScreen />;
  }
}

const CONFETTI_STAGES: TVStage[] = ['winner', 'confetti', 'prize', 'congratulations'];

const STAGE_DURATIONS: Record<TVStage, number> = {
  idle: 0,
  loading: 2000,
  participant: 3000,
  countdown: 0,
  machine: 3000,
  drawing: 3000,
  winner: 4000,
  confetti: 3000,
  prize: 4000,
  congratulations: 5000,
};

export function TVScreen() {
  const { stage, participant, isPlaying, nextStage, startDraw } = useLiveTVStore();
  const currentQueue = useQueueStore((s) => s.currentQueue);
  const prevQueueRef = useRef<string | null>(null);

  // Watch for queue changes - when a new participant becomes current
  useEffect(() => {
    if (!currentQueue) return;
    if (prevQueueRef.current === currentQueue.id) return;
    prevQueueRef.current = currentQueue.id;

    const tvParticipant: TVParticipant = {
      id: currentQueue.id,
      number: currentQueue.number,
      fullName: currentQueue.fullName,
      company: currentQueue.company,
      phone: currentQueue.phone,
      email: currentQueue.email,
    };

    startDraw(tvParticipant);
  }, [currentQueue, startDraw]);

  // Auto-advance through stages
  useEffect(() => {
    if (!isPlaying || stage === 'idle') return;

    const duration = STAGE_DURATIONS[stage];
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      nextStage();
    }, duration);

    return () => clearTimeout(timer);
  }, [stage, isPlaying, nextStage]);

  const showConfetti = CONFETTI_STAGES.includes(stage);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      <ConfettiEffect active={showConfetti} />

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          {renderScreen(stage, participant)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
