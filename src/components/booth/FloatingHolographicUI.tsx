import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function HolographicCard({
  children,
  x,
  y,
  delay,
  duration,
}: {
  children: React.ReactNode;
  x: string;
  y: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute z-[6]"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -15, 0],
        x: [0, Math.random() > 0.5 ? 8 : -8, 0],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        repeat: Infinity,
        duration,
        delay,
        ease: 'easeInOut',
      }}
    >
      {/* Holographic glass card */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.1)]">
        {/* Hologram shimmer */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}

export function FloatingHolographicUI() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      {/* Active players */}
      <HolographicCard x="5%" y="35%" delay={0} duration={4.5}>
        <div className="flex items-center gap-2">
          <motion.span
            className="flex h-2 w-2 rounded-full bg-emerald-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="text-[10px] font-bold tracking-wider text-emerald-300/80 uppercase">
            Live
          </span>
          <span className="text-xs font-bold text-white/60">42</span>
          <span className="text-[9px] text-white/30">players</span>
        </div>
      </HolographicCard>

      {/* Total draw value */}
      <HolographicCard x="75%" y="30%" delay={1.2} duration={5}>
        <div className="text-right">
          <p className="text-[9px] font-bold tracking-wider text-amber-400/60 uppercase">
            Total Value
          </p>
          <motion.p
            className="text-sm font-black text-amber-300"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            $25,000+
          </motion.p>
        </div>
      </HolographicCard>

      {/* Spin count */}
      <HolographicCard x="10%" y="60%" delay={2} duration={5.5}>
        <div className="flex items-center gap-2">
          <span className="text-sm">🎰</span>
          <div>
            <p className="text-[8px] font-bold tracking-wider text-blue-300/50 uppercase">
              Spins Today
            </p>
            <motion.p
              className="text-xs font-bold text-white/70"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              3,842
            </motion.p>
          </div>
        </div>
      </HolographicCard>

      {/* Next draw estimate */}
      <HolographicCard x="78%" y="65%" delay={0.8} duration={4}>
        <div className="text-right">
          <p className="text-[8px] font-bold tracking-wider text-amber-400/50 uppercase">
            Est. Jackpot
          </p>
          <motion.p
            className="text-xs font-black text-amber-300/80"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            $5,000
          </motion.p>
        </div>
      </HolographicCard>

      {/* Lucky hour badge */}
      <HolographicCard x="50%" y="15%" delay={1.5} duration={6}>
        <motion.div
          className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-amber-400/5 px-3 py-1"
          animate={{ boxShadow: ['0 0 10px rgba(251,191,36,0.1)', '0 0 25px rgba(251,191,36,0.3)', '0 0 10px rgba(251,191,36,0.1)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[10px]">✨</span>
          <span className="text-[9px] font-bold tracking-wider text-amber-300/80 uppercase">
            Lucky Hour
          </span>
          <motion.span
            className="text-[9px] font-black text-amber-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            NOW
          </motion.span>
        </motion.div>
      </HolographicCard>
    </>
  );
}