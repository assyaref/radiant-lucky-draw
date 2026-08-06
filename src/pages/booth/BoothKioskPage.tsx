// Booth Kiosk Mode - Fullscreen, Touch Friendly, Idle Screen, Auto Reset
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

type KioskStep = 'idle' | 'countdown' | 'spinning' | 'result';

const IDLE_TIMEOUT_MS = 30000;
const COUNTDOWN_SECONDS = 5;

export default function BoothKioskPage() {
  const [step, setStep] = useState<KioskStep>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [result, setResult] = useState<{ name: string; prize: string } | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetToIdle = useCallback(() => {
    setStep('idle');
    setCountdown(COUNTDOWN_SECONDS);
    setResult(null);
  }, []);

  // Idle screen timer - reset to idle after inactivity
  useEffect(() => {
    if (step === 'idle') return;

    idleTimerRef.current = setTimeout(() => {
      resetToIdle();
    }, IDLE_TIMEOUT_MS);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [step, resetToIdle]);

  // Touch interaction handler
  const handleTouch = useCallback(() => {
    if (step === 'idle') {
      setStep('countdown');
    }
  }, [step]);

  // Countdown logic
  useEffect(() => {
    if (step !== 'countdown') return;

    if (countdown <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('spinning');
      setTimeout(() => {
        setResult({
          name: 'Budi Santoso',
          prize: 'Smartphone Premium',
        });
        setStep('result');
      }, 2000);
      return;
    }

    countdownRef.current = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [step, countdown]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#020617] overflow-hidden select-none"
      onTouchStart={handleTouch}
      onClick={handleTouch}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-dark-surface to-secondary-900/20" />

      {/* Fullscreen Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          {isFullscreen ? (
            <HiOutlineArrowsPointingIn className="w-5 h-5" />
          ) : (
            <HiOutlineArrowsPointingOut className="w-5 h-5" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="text-8xl mb-8"
              >
                🎯
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Lucky Draw</h1>
              <p className="text-xl text-dark-text-tertiary mb-8">Tap anywhere to start</p>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/10 text-white/80"
              >
                <span className="text-2xl">👆</span>
                <span>Tap to Draw</span>
              </motion.div>
            </motion.div>

            {/* Idle Timer Indicator */}
            <div className="absolute bottom-8 text-sm text-dark-text-tertiary/40">
              Auto-reset after {IDLE_TIMEOUT_MS / 1000}s of inactivity
            </div>
          </motion.div>
        )}

        {step === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-white/50 text-lg mb-4">Drawing in...</p>
              <p className="text-[120px] md:text-[160px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-secondary-400 leading-none">
                {countdown}
              </p>
            </motion.div>
          </motion.div>
        )}

        {step === 'spinning' && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-32 h-32 rounded-full border-4 border-primary-500/30 border-t-primary-400"
            />
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-7xl mb-6"
            >
              🏆
            </motion.div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Congratulations!</h2>
            <p className="text-lg text-dark-text-secondary mb-1">{result.name}</p>
            <p className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-8">
              {result.prize}
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetToIdle();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
                Draw Again
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-all"
              >
                {isFullscreen ? (
                  <HiOutlineArrowsPointingIn className="w-4 h-4" />
                ) : (
                  <HiOutlineArrowsPointingOut className="w-4 h-4" />
                )}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
