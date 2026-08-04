import { memo } from 'react';
import { motion } from 'framer-motion';

const SPONSORS = [
  'TECHNOVA',
  'AURUM GROUP',
  'NEXUS LABS',
  'ORBITAL',
  'LUMINA',
  'VERTEX',
  'PRISMA',
  'HELIX',
];

export const SponsorCarousel = memo(function SponsorCarousel() {
  return (
    <div className="relative flex h-9 items-center overflow-hidden rounded-lg border border-white/8 bg-white/[0.04] backdrop-blur-md">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#0b1426] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#0b1426] to-transparent" />

      {/* Glass sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent" />

      {/* Infinite carousel */}
      <motion.div
        className="flex items-center gap-12 whitespace-nowrap px-6"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
      >
        {[...SPONSORS, ...SPONSORS].map((sponsor, i) => (
          <span
            key={i}
            className="text-xs font-bold tracking-[0.2em] text-white/30 transition-colors hover:text-white/60"
          >
            {sponsor}
          </span>
        ))}
      </motion.div>
    </div>
  );
});
