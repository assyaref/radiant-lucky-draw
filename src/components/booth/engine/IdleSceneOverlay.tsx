/**
 * LiveEventEngine - Idle Scene Overlay
 * Renders the current idle scene with cinematic transitions.
 * Scenes: Hero, Prize Showcase, Sponsors, Company Profile, CSR, Products, Recruitment
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveEventEngine } from './LiveEventEngine';
import { IDLE_SCENES } from './idleController';
import { TRANSITION_VARIANTS, CINEMATIC_EASE } from './transitionManager';

export const IdleSceneOverlay = memo(function IdleSceneOverlay() {
  const { idleScene, transition } = useLiveEventEngine();
  const scene = IDLE_SCENES.find((s) => s.id === idleScene) ?? IDLE_SCENES[0];
  const variants = TRANSITION_VARIANTS[transition];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scene.id}
        className="pointer-events-none fixed inset-0 z-[7] flex items-center justify-center"
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ duration: 0.8, ease: CINEMATIC_EASE }}
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
          {IDLE_SCENES.map((s, i) => (
            <motion.div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i === IDLE_SCENES.findIndex((x) => x.id === idleScene)
                  ? 'w-6 bg-amber-400/60'
                  : 'w-1.5 bg-white/20'
              }`}
              animate={
                i === IDLE_SCENES.findIndex((x) => x.id === idleScene)
                  ? { opacity: [0.5, 1, 0.5] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 2 }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
