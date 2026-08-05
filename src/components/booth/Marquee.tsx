import { memo } from 'react';
import { motion } from 'framer-motion';
import { glowLoop } from '@animations/index';

const TICKER_ITEMS = [
  { icon: '🏆', text: 'Congratulations to Sarah M. — Winner of the Platinum Package!' },
  { icon: '📢', text: 'Next draw in 5 minutes — Scan QR to participate!' },
  { icon: '🤝', text: 'Proudly sponsored by TECHNOVA, AURUM GROUP & NEXUS LABS' },
  { icon: '🎉', text: 'Over 1,200 participants joined today!' },
  { icon: '💎', text: 'Grand Prize: Platinum Package worth $5,000' },
  { icon: '⏰', text: "Event closes at 6:00 PM — Don't miss your chance!" },
];

export const Marquee = memo(function Marquee() {
  return (
    <motion.div
      className="relative flex h-10 items-center overflow-hidden rounded-lg border border-blue-400/15 bg-[#0a1120]/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {/* Breathing glow */}
      <motion.div
        className="pointer-events-none absolute -inset-1 rounded-lg"
        variants={glowLoop}
        animate="glow"
      >
        <div className="h-full w-full rounded-lg bg-gradient-radial from-blue-400/10 to-transparent blur-md" />
      </motion.div>

      {/* LED edge glow */}
      <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" />

      {/* LED dot-matrix texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(96,165,250,0.9) 1px, transparent 1px)',
          backgroundSize: '6px 6px',
        }}
      />

      {/* LIVE badge */}
      <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-0.5 backdrop-blur-sm">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-red-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
        />
        <span className="text-[10px] font-bold tracking-widest text-red-300">LIVE</span>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#0a1120] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#0a1120] to-transparent" />

      {/* LED ticker content - infinite smooth loop */}
      <motion.div
        className="flex items-center gap-10 whitespace-nowrap pl-20"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm">{item.icon}</span>
            <span className="text-sm font-medium tracking-wide text-blue-200/70">{item.text}</span>
            <span className="ml-6 text-blue-400/30">•</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
});
