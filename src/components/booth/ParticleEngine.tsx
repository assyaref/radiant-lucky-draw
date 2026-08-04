import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'gold' | 'blue' | 'star' | 'dust' | 'sparkle' | 'coin' | 'gift';
  drift: number;
}

const TYPES = ['gold', 'blue', 'star', 'dust', 'sparkle', 'coin', 'gift'] as const;
const ICONS: Record<string, string> = {
  coin: '🪙',
  gift: '🎁',
  star: '✨',
};

export const ParticleEngine = memo(function ParticleEngine() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      drift: (Math.random() - 0.5) * 40,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => {
        const isIcon = p.type === 'coin' || p.type === 'gift' || p.type === 'star';
        const color =
          p.type === 'gold'
            ? 'bg-amber-400/40'
            : p.type === 'blue'
              ? 'bg-blue-400/40'
              : p.type === 'sparkle'
                ? 'bg-white/60'
                : 'bg-white/20';

        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            animate={{
              y: [0, -120, 0],
              x: [0, p.drift, 0],
              opacity: [0, 0.8, 0],
              scale: isIcon ? [0.8, 1.2, 0.8] : [1, 1.3, 1],
              rotate: isIcon ? [0, 360] : 0,
            }}
            transition={{
              repeat: Infinity,
              duration: p.duration,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          >
            {isIcon ? (
              <span className="text-lg opacity-40">{ICONS[p.type]}</span>
            ) : (
              <div
                className={`rounded-full ${color} ${
                  p.type === 'sparkle' ? 'blur-[1px]' : ''
                }`}
                style={{ width: p.size, height: p.size }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
});
