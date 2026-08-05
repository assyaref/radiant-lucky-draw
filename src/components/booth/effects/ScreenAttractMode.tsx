import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Scene {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
}

const SCENES: Scene[] = [
  {
    id: 1,
    title: 'LUCKY DRAW',
    subtitle: 'Spin & Win Amazing Prizes',
    icon: '🎰',
    gradient: 'from-amber-400/20 via-blue-500/10 to-transparent',
  },
  {
    id: 2,
    title: 'GRAND PRIZE',
    subtitle: 'Platinum Package Worth $5,000',
    icon: '👑',
    gradient: 'from-amber-400/20 via-amber-500/10 to-transparent',
  },
  {
    id: 3,
    title: 'PREVIOUS WINNERS',
    subtitle: 'Join Our Lucky Winners Community',
    icon: '🏆',
    gradient: 'from-blue-400/20 via-purple-500/10 to-transparent',
  },
  {
    id: 4,
    title: 'HOW TO PLAY',
    subtitle: '1. Scan QR • 2. Register • 3. Spin & Win',
    icon: '📱',
    gradient: 'from-emerald-400/20 via-blue-500/10 to-transparent',
  },
  {
    id: 5,
    title: 'OUR SPONSORS',
    subtitle: 'Proudly Supported by Industry Leaders',
    icon: '🤝',
    gradient: 'from-purple-400/20 via-pink-500/10 to-transparent',
  },
  {
    id: 6,
    title: 'NEXT DRAW',
    subtitle: 'Get Ready — Your Chance is Coming',
    icon: '⏰',
    gradient: 'from-red-400/20 via-amber-500/10 to-transparent',
  },
];

export function ScreenAttractMode() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const nextScene = useCallback(() => {
    setCurrentScene((prev) => (prev + 1) % SCENES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextScene, 15000);
    return () => clearInterval(interval);
  }, [nextScene]);

  // Pause when user interacts
  useEffect(() => {
    const show = () => setIsVisible(false);
    const hide = () => setTimeout(() => setIsVisible(true), 10000);
    document.addEventListener('click', show);
    document.addEventListener('touchstart', show);
    document.addEventListener('mousemove', hide);
    return () => {
      document.removeEventListener('click', show);
      document.removeEventListener('touchstart', show);
      document.removeEventListener('mousemove', hide);
    };
  }, []);

  const scene = SCENES[currentScene];

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={scene.id}
          className="pointer-events-none absolute inset-0 z-[7] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background gradient */}
          <motion.div
            className={`absolute inset-0 bg-gradient-radial ${scene.gradient} blur-3xl`}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.div
              className="mb-4 text-6xl"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              {scene.icon}
            </motion.div>
            <motion.h2
              className="mb-2 text-4xl font-black tracking-wider text-white/80"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              {scene.title}
            </motion.h2>
            <motion.p
              className="text-lg font-medium tracking-wide text-white/40"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
            >
              {scene.subtitle}
            </motion.p>
          </div>

          {/* Scene indicator dots */}
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {SCENES.map((s, i) => (
              <motion.div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentScene ? 'w-6 bg-amber-400/60' : 'w-1.5 bg-white/20'
                }`}
                animate={i === currentScene ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
