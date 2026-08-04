import { motion } from 'framer-motion';

const BAR_COUNT = 24;

export function AudioVisualizer() {
  return (
    <div className="flex items-end gap-[3px]">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const height = 8 + Math.random() * 28;
        const delay = i * 0.08;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: `linear-gradient(to top, rgba(59,130,246,0.3), rgba(251,191,36,0.6))`,
            }}
            animate={{
              height: [
                height,
                height * (0.3 + Math.random() * 0.7),
                height * (0.5 + Math.random() * 0.5),
                height,
              ],
              opacity: [0.4, 0.8, 0.5, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2 + Math.random() * 0.8,
              delay,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}