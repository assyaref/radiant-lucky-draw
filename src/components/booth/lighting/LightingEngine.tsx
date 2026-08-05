import { memo } from 'react';
import { motion } from 'framer-motion';

export const LightingEngine = memo(function LightingEngine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Moving spotlight */}
      <motion.div
        className="absolute left-1/2 top-0 h-[120%] w-64 -translate-x-1/2"
        style={{
          background: 'linear-gradient(to bottom, rgba(251,191,36,0.15), transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ x: ['-30%', '30%', '-30%'] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />

      {/* Blue ambient light */}
      <motion.div
        className="absolute left-0 top-0 h-full w-1/3"
        style={{
          background: 'linear-gradient(to right, rgba(59,130,246,0.12), transparent)',
          filter: 'blur(30px)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      />

      {/* Gold spotlight */}
      <motion.div
        className="absolute right-0 top-0 h-full w-1/3"
        style={{
          background: 'linear-gradient(to left, rgba(251,191,36,0.12), transparent)',
          filter: 'blur(30px)',
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
      />

      {/* Bloom overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(59,130,246,0.08), transparent 60%)',
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      />
    </div>
  );
});
