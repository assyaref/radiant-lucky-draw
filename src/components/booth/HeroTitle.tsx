import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  heroContainer,
  heroLine,
  heroSubtitle,
  lightSweep,
  glowLoop,
  floatLoop,
} from '@animations/index';

export const HeroTitle = memo(function HeroTitle() {
  return (
    <motion.div
      className="relative flex flex-col items-center"
      variants={heroContainer}
      initial="hidden"
      animate="show"
      whileInView="show"
      style={{ willChange: 'transform' }}
    >
      {/* Subtle floating motion for the whole title block */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        variants={floatLoop}
        animate="float"
      />

      {/* Main title - LUCKY DRAW (reduced ~12% from text-9xl to text-8xl, more spacing) */}
      <motion.div className="relative" variants={heroLine}>
        {/* Breathing glow behind title */}
        <motion.div
          className="pointer-events-none absolute -inset-10 rounded-full"
          variants={glowLoop}
          animate="glow"
        >
          <div className="h-full w-full rounded-full bg-gradient-radial from-amber-400/25 via-blue-500/12 to-transparent blur-3xl" />
        </motion.div>

        <motion.h1
          className="text-8xl font-black tracking-[0.18em]"
          style={{
            background:
              'linear-gradient(135deg, #fbbf24 0%, #f59e0b 20%, #fde68a 40%, #fbbf24 55%, #f59e0b 75%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.05,
            textShadow: 'none',
            filter: 'drop-shadow(0 0 50px rgba(251,191,36,0.4)) drop-shadow(0 4px 20px rgba(0,0,0,0.4))',
          }}
        >
          LUCKY DRAW
        </motion.h1>

        {/* Cinematic light sweep - every 6 seconds */}
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.8, 0, 0, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        >

          <motion.div
            className="absolute inset-0"
            variants={lightSweep}
            animate="sweep"
          >
            <div className="h-full w-1/4 skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Second line - DIGITAL BOOTH (kept slightly smaller) */}
      <motion.h2
        className="mt-4 text-5xl font-light tracking-[0.4em] text-blue-300/80"
        variants={heroLine}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{
          textShadow: '0 0 30px rgba(59,130,246,0.3)',
        }}
      >
        DIGITAL BOOTH
      </motion.h2>

      {/* Single subtitle - Scan QR Code to Win Amazing Prizes */}
      <motion.p
        className="mt-6 text-2xl font-medium tracking-[0.12em] text-white/55"
        variants={heroSubtitle}
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
      >
        Scan QR Code to Win Amazing Prizes
      </motion.p>
    </motion.div>
  );
});
