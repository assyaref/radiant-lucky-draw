import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useJourney } from './JourneyContext';
import { LandingScreen } from './screens/LandingScreen';
import { ScanScreen } from './screens/ScanScreen';
import { RegistrationScreen } from './screens/RegistrationScreen';
import { ValidationScreen } from './screens/ValidationScreen';
import { QueueScreen } from './screens/QueueScreen';
import { ReadyScreen } from './screens/ReadyScreen';
import { DrawScreen } from './screens/DrawScreen';
import { WinnerScreen } from './screens/WinnerScreen';
import { ClaimScreen } from './screens/ClaimScreen';

/**
 * JourneyFlow
 *
 * Orchestrates the participant journey state machine:
 * Landing → Scan → Registration → Validation → Queue → Ready
 * → Draw → Winner → Claim → Restart
 *
 * Uses JourneyContext to read the current step and render the
 * corresponding screen with a smooth animated transition.
 */
export const JourneyFlow = memo(function JourneyFlow() {
  const { step } = useJourney();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className="flex min-h-screen w-full flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {step === 'landing' && <LandingScreen />}
        {step === 'scan' && <ScanScreen />}
        {step === 'registration' && <RegistrationScreen />}
        {step === 'validation' && <ValidationScreen />}
        {step === 'queue' && <QueueScreen />}
        {step === 'ready' && <ReadyScreen />}
        {step === 'draw' && <DrawScreen />}
        {step === 'winner' && <WinnerScreen />}
        {step === 'claim' && <ClaimScreen />}
      </motion.div>
    </AnimatePresence>
  );
});
