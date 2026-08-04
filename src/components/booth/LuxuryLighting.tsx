import { motion } from 'framer-motion';

export function LuxuryLighting() {
  return (
    <>
      {/* Sweeping spotlight - top */}
      <motion.div
        className="pointer-events-none absolute z-[4] h-[700px] w-[900px]"
        animate={{
          x: ['-60%', '-40%', '-60%'],
          y: ['-35%', '-25%', '-35%'],
          scale: [1, 1.05, 1],
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        style={{ left: '50%', top: '-30%' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-radial from-amber-400/15 via-blue-500/8 to-transparent blur-3xl" />
      </motion.div>

      {/* Sweeping spotlight - bottom */}
      <motion.div
        className="pointer-events-none absolute z-[4] h-[600px] w-[700px]"
        animate={{
          x: ['-50%', '-60%', '-50%', '-40%', '-50%'],
          y: ['10%', '15%', '10%', '5%', '10%'],
          scale: [1, 1.08, 1, 0.95, 1],
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        style={{ left: '50%', bottom: '-20%' }}
      >
        <div className="h-full w-full rounded-full bg-gradient-radial from-blue-500/12 via-blue-400/6 to-transparent blur-3xl" />
      </motion.div>

      {/* Sweeping cross spotlight */}
      <motion.div
        className="pointer-events-none absolute z-[4] h-[500px] w-[200px]"
        animate={{
          x: ['-50%', '50%', '-50%'],
          rotate: [-15, 15, -15],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
        style={{ left: '0%', top: '20%' }}
      >
        <div className="h-full w-full bg-gradient-to-b from-amber-400/10 via-blue-500/5 to-transparent blur-2xl skew-x-12" />
      </motion.div>

      {/* God rays - left */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-[4] h-full w-1/3"
        animate={{
          opacity: [0.2, 0.5, 0.2],
          x: [0, 10, 0],
        }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-to-r from-amber-400/6 via-transparent to-transparent" />
      </motion.div>

      {/* God rays - right */}
      <motion.div
        className="pointer-events-none absolute right-0 top-0 z-[4] h-full w-1/3"
        animate={{
          opacity: [0.15, 0.4, 0.15],
          x: [0, -10, 0],
        }}
        transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-to-l from-blue-500/6 via-transparent to-transparent" />
      </motion.div>

      {/* Ambient transition overlay - subtle color shift */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[4]"
        animate={{
          background: [
            'radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.03) 0%, transparent 60%)',
            'radial-gradient(ellipse at 70% 30%, rgba(59,130,246,0.03) 0%, transparent 60%)',
            'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.02) 0%, transparent 60%)',
            'radial-gradient(ellipse at 30% 20%, rgba(251,191,36,0.03) 0%, transparent 60%)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-[#020617]/60 via-transparent to-[#020617]/40" />
      <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r from-[#020617]/30 via-transparent to-[#020617]/30" />

      {/* Animated bloom overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[5]"
        animate={{ opacity: [0, 0.04, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <div className="h-full w-full bg-gradient-radial from-amber-400/20 via-blue-500/10 to-transparent blur-[100px]" />
      </motion.div>
    </>
  );
}