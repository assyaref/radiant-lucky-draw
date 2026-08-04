import { motion } from 'framer-motion';

const OBJECTS = [
  // Gift boxes
  { type: 'gift', x: '8%', y: '20%', size: 40, delay: 0, duration: 7 },
  { type: 'gift', x: '88%', y: '25%', size: 32, delay: 1.5, duration: 8 },
  { type: 'gift', x: '15%', y: '70%', size: 36, delay: 0.8, duration: 6 },
  { type: 'gift', x: '82%', y: '75%', size: 44, delay: 2.2, duration: 7.5 },
  // Coins
  { type: 'coin', x: '25%', y: '35%', size: 20, delay: 0.5, duration: 5 },
  { type: 'coin', x: '70%', y: '40%', size: 16, delay: 1.8, duration: 6 },
  { type: 'coin', x: '40%', y: '80%', size: 18, delay: 3, duration: 5.5 },
  // Stars
  { type: 'star', x: '60%', y: '15%', size: 14, delay: 1, duration: 4 },
  { type: 'star', x: '35%', y: '60%', size: 12, delay: 2.5, duration: 5 },
  { type: 'star', x: '75%', y: '55%', size: 16, delay: 0.3, duration: 4.5 },
  // Ribbons
  { type: 'ribbon', x: '5%', y: '45%', size: 30, delay: 1.2, duration: 9 },
  { type: 'ribbon', x: '92%', y: '50%', size: 28, delay: 2, duration: 8.5 },
];

function GiftIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="20" width="32" height="24" rx="2" />
      <path d="M8 20 L14 8 L34 8 L40 20" />
      <line x1="24" y1="8" x2="24" y2="44" />
      <line x1="8" y1="28" x2="40" y2="28" />
    </svg>
  );
}

function CoinIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">$</text>
    </svg>
  );
}

function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function RibbonIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20M4 8l8 4 8-4M4 16l8-4 8 4" />
    </svg>
  );
}

export function FloatingObjects() {
  return (
    <>
      {OBJECTS.map((obj, i) => {
        const IconComponent =
          obj.type === 'gift'
            ? GiftIcon
            : obj.type === 'coin'
              ? CoinIcon
              : obj.type === 'star'
                ? StarIcon
                : RibbonIcon;

        const opacity =
          obj.type === 'gift'
            ? 'text-amber-400/8'
            : obj.type === 'coin'
              ? 'text-amber-300/12'
              : obj.type === 'star'
                ? 'text-blue-300/15'
                : 'text-amber-400/6';

        return (
          <motion.div
            key={i}
            className={`pointer-events-none absolute z-[2] ${opacity}`}
            style={{ left: obj.x, top: obj.y }}
            animate={{
              y: [0, -25, 0],
              x: [0, Math.random() > 0.5 ? 15 : -15, 0],
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: obj.duration,
              delay: obj.delay,
              ease: 'easeInOut',
            }}
          >
            <IconComponent size={obj.size} />
          </motion.div>
        );
      })}

      {/* Golden sparkles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="pointer-events-none absolute z-[2] h-1 w-1 rounded-full bg-amber-300"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2 + Math.random() * 3,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Blue energy particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`energy-${i}`}
          className="pointer-events-none absolute z-[2] h-0.5 w-0.5 rounded-full bg-blue-400"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -30, 0],
            x: [0, Math.random() > 0.5 ? 20 : -20, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 2,
            delay: i * 0.6,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}