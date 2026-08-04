import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooth } from '../modes/BoothContext';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Radiant Group',
    subtitle: 'Leading Innovation Since 2010',
    icon: '✦',
    gradient: 'from-amber-400/30 via-blue-500/20 to-transparent',
  },
  {
    id: 2,
    title: 'Our Products',
    subtitle: 'Premium Digital Solutions for Global Enterprises',
    icon: '💼',
    gradient: 'from-blue-400/30 via-purple-500/20 to-transparent',
  },
  {
    id: 3,
    title: 'Our Services',
    subtitle: 'Consulting • Development • Support • Training',
    icon: '⚡',
    gradient: 'from-emerald-400/30 via-blue-500/20 to-transparent',
  },
  {
    id: 4,
    title: 'CSR Initiatives',
    subtitle: 'Empowering Communities Through Technology',
    icon: '🌍',
    gradient: 'from-green-400/30 via-emerald-500/20 to-transparent',
  },
  {
    id: 5,
    title: 'Join Our Team',
    subtitle: 'Scan QR Code for Career Opportunities',
    icon: '📋',
    gradient: 'from-purple-400/30 via-pink-500/20 to-transparent',
  },
];

export function DigitalSignage() {
  const { mode } = useBooth();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (mode !== 'digital') return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [mode]);

  const slide = SLIDES[currentSlide];

  return (
    <AnimatePresence>
      {mode === 'digital' && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center bg-[#020617]/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              className="relative flex h-full w-full items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-radial ${slide.gradient} blur-3xl`}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />

              {/* Content */}
              <div className="relative z-10 text-center">
                <motion.div
                  className="mb-6 text-7xl"
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  {slide.icon}
                </motion.div>

                <motion.h2
                  className="mb-4 text-5xl font-black tracking-wider text-white/90 md:text-6xl"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  {slide.title}
                </motion.h2>

                <motion.p
                  className="text-xl font-light tracking-wide text-white/50 md:text-2xl"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
                >
                  {slide.subtitle}
                </motion.p>

                {/* Slide indicator */}
                <div className="mt-8 flex justify-center gap-2">
                  {SLIDES.map((s, i) => (
                    <motion.div
                      key={s.id}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentSlide ? 'w-8 bg-amber-400/60' : 'w-1.5 bg-white/20'
                      }`}
                      animate={i === currentSlide ? { opacity: [0.5, 1, 0.5] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}