import { useState } from 'react';
import { motion } from 'framer-motion';

const BAR_COUNT = 24;

interface BarData {
  height: number;
  mid1: number;
  mid2: number;
  duration: number;
}

export function AudioVisualizer() {
  // Generate bars once using lazy state initialization (React 19 recommended
  // pattern for impure values like Math.random).
  const [bars] = useState<BarData[]>(() =>
    Array.from({ length: BAR_COUNT }, () => {
      const height = 8 + Math.random() * 28;
      return {
        height,
        mid1: height * (0.3 + Math.random() * 0.7),
        mid2: height * (0.5 + Math.random() * 0.5),
        duration: 1.2 + Math.random() * 0.8,
      };
    }),
  );

  return (
    <div className="flex items-end gap-[3px]">
      {bars.map((bar, i) => {
        const delay = i * 0.08;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: `linear-gradient(to top, rgba(59,130,246,0.3), rgba(251,191,36,0.6))`,
            }}
            animate={{
              height: [bar.height, bar.mid1, bar.mid2, bar.height],
              opacity: [0.4, 0.8, 0.5, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: bar.duration,
              delay,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}
