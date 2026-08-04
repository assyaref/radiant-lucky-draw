import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from './audio/AudioManager';

const BALL_COLORS = ['#fbbf24', '#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#f97316'];

// Pre-computed ball sizes for stable, varied ball dimensions
const BALL_SIZES = [34, 26, 40, 30, 22, 36, 28, 44, 32, 24, 38, 30];

export const LuckyMachine = memo(function LuckyMachine() {
  const { playSfx } = useAudio();

  // Play machine spin SFX periodically to simulate the rotating machine
  useEffect(() => {
    const interval = setInterval(() => {
      playSfx('machineSpin');
    }, 12000);
    return () => clearInterval(interval);
  }, [playSfx]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Shadow on floor */}
      <motion.div
        className="absolute -bottom-24 left-1/2 h-20 w-[36rem] -translate-x-1/2 rounded-full"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-radial from-blue-500/50 via-amber-400/25 to-transparent blur-2xl" />
      </motion.div>

      {/* Floor reflection */}
      <motion.div
        className="absolute -bottom-14 left-1/2 h-48 w-[32rem] -translate-x-1/2"
        animate={{ opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-to-b from-blue-500/20 via-amber-400/10 to-transparent blur-xl" />
      </motion.div>

      {/* Glow backdrop - breathing */}
      <motion.div
        className="absolute h-[42rem] w-[42rem] rounded-full"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-radial from-amber-400/30 via-blue-500/15 to-transparent blur-3xl" />
      </motion.div>

      {/* Machine body - floating rotation */}
      <motion.div
        className="relative z-10"
        animate={{
          y: [0, -18, 0],
          rotateY: [0, 8, 0, -8, 0],
        }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        style={{ perspective: 1000 }}
      >
        {/* Particle orbit ring */}
        <motion.div
          className="absolute -inset-12 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
        >
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 250;
            return (
              <motion.div
                key={i}
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * radius}px - 5px)`,
                  top: `calc(50% + ${Math.sin(angle) * radius}px - 5px)`,
                  background: i % 2 === 0 ? '#fbbf24' : '#60a5fa',
                  boxShadow: i % 2 === 0
                    ? '0 0 12px rgba(251,191,36,0.8)'
                    : '0 0 12px rgba(59,130,246,0.8)',
                }}
                animate={{
                  scale: [1, 2.4, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </motion.div>

        {/* Blue LED ring around dome */}
        <motion.div
          className="absolute -inset-5 rounded-full"
          animate={{
            opacity: [0.3, 0.9, 0.3],
            boxShadow: [
              '0 0 50px rgba(59,130,246,0.3)',
              '0 0 100px rgba(59,130,246,0.6)',
              '0 0 50px rgba(59,130,246,0.3)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <div className="h-full w-full rounded-full border-[5px] border-blue-400/60 shadow-[0_0_60px_rgba(59,130,246,0.4),inset_0_0_60px_rgba(59,130,246,0.25)]" />
        </motion.div>

        {/* Glass dome - enlarged ~20% */}
        <div className="relative mx-auto h-[36rem] w-[36rem] overflow-hidden rounded-full border-[5px] border-blue-400/50 bg-gradient-to-b from-blue-500/20 via-blue-400/10 to-transparent shadow-[0_0_200px_rgba(59,130,246,0.25)] backdrop-blur-sm">

          {/* Glass reflection - top primary */}
          <div className="pointer-events-none absolute left-10 top-8 h-40 w-20 rotate-12 rounded-full bg-gradient-to-b from-white/30 to-transparent blur-sm" />
          {/* Glass reflection - secondary */}
          <div className="pointer-events-none absolute right-16 top-12 h-10 w-10 rounded-full bg-white/20 blur-[3px]" />
          {/* Glass reflection - bottom */}
          <div className="pointer-events-none absolute bottom-12 left-1/3 h-24 w-12 -rotate-6 rounded-full bg-gradient-to-b from-white/12 to-transparent blur-sm" />
          {/* Glass reflection - diagonal sweep */}
          <div className="pointer-events-none absolute -left-12 top-1/2 h-48 w-28 rotate-[30deg] rounded-full bg-gradient-to-b from-white/10 to-transparent blur-md" />
          {/* Glass reflection - inner rim highlight */}
          <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10" />

          {/* Metal texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-12"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.05) 2px,
                  rgba(255,255,255,0.05) 4px
                )
              `,
            }}
          />

          {/* Internal shadow for depth - balls feel inside glass */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_20px_60px_rgba(0,0,0,0.5),inset_0_-20px_60px_rgba(0,0,0,0.4)]" />

          {/* Spinning balls - with depth, glow, varied sizes */}
          <motion.div
            className="flex h-full flex-wrap items-center justify-center gap-5 p-10"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
          >
            {BALL_COLORS.map((c, i) => (
              <motion.span
                key={i}
                className="inline-block rounded-full"
                style={{
                  backgroundColor: c,
                  width: BALL_SIZES[i % BALL_SIZES.length],
                  height: BALL_SIZES[i % BALL_SIZES.length],
                  boxShadow: `0 0 24px ${c}60, inset 0 -5px 8px rgba(0,0,0,0.35), inset 0 4px 6px rgba(255,255,255,0.4)`,
                }}
                animate={{
                  scale: [1, 1.4, 1],
                  y: [0, -10, 0],
                  x: [0, i % 2 === 0 ? 6 : -6, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8 + (i % 4) * 0.4,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>

          {/* Specular highlight overlay on balls */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />

          {/* Floating light particles inside */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-amber-300"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                boxShadow: '0 0 8px rgba(251,191,36,0.9)',
              }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0, 2.5, 0],
                y: [0, -55, 0],
                x: [0, Math.random() > 0.5 ? 28 : -28, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5 + Math.random() * 2,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Neck */}
        <div className="mx-auto h-14 w-44 rounded-b-lg bg-gradient-to-b from-blue-700/50 to-blue-900/70 backdrop-blur-sm shadow-[inset_0_8px_16px_rgba(0,0,0,0.35)]" />

        {/* Metallic gold base */}
        <div className="relative mx-auto flex h-28 w-[32rem] items-center justify-center overflow-hidden rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-600/30 via-amber-400/40 to-amber-600/30 shadow-[0_0_100px_rgba(251,191,36,0.25),inset_0_1px_0_rgba(251,191,36,0.3)] backdrop-blur-md">
          {/* Gold reflection */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-amber-400/20 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-amber-400/10 to-transparent" />

          {/* Metal texture on base */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 3px,
                  rgba(255,255,255,0.04) 3px,
                  rgba(255,255,255,0.04) 6px
                )
              `,
            }}
          />

          <span className="text-5xl font-black tracking-[0.15em] text-amber-300/90 drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]">
            LUCKY
          </span>
          <span className="ml-6 text-5xl font-black tracking-[0.15em] text-blue-300/80 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]">
            DRAW
          </span>
        </div>

        {/* Blue LED strip around base */}
        <motion.div
          className="mx-auto mt-2 h-2.5 w-[30rem] rounded-full"
          animate={{
            opacity: [0.3, 0.9, 0.3],
            boxShadow: [
              '0 0 25px rgba(59,130,246,0.3)',
              '0 0 55px rgba(59,130,246,0.6)',
              '0 0 25px rgba(59,130,246,0.3)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_30px_rgba(59,130,246,0.4)]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
