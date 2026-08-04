import { motion } from 'framer-motion';
import type { TVParticipant } from '../../../types/live-tv';

export function ParticipantScreen({ participant }: { participant: TVParticipant }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/10 via-blue-500/5 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Queue number badge */}
        <motion.div
          className="mb-6 rounded-full border border-amber-400/30 bg-amber-400/10 px-6 py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span className="text-sm font-bold tracking-[0.2em] text-amber-400 uppercase">
            Queue #{participant.number}
          </span>
        </motion.div>

        {/* Participant icon */}
        <motion.div
          className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        >
          <span className="text-5xl">🎯</span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="mb-2 text-5xl font-black tracking-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 12 }}
        >
          {participant.fullName}
        </motion.h1>

        {/* Company */}
        <motion.p
          className="text-xl font-light text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {participant.company}
        </motion.p>

        {/* Subtitle */}
        <motion.p
          className="mt-8 text-sm font-bold tracking-[0.2em] text-amber-400/60 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Get ready...
        </motion.p>
      </div>
    </div>
  );
}