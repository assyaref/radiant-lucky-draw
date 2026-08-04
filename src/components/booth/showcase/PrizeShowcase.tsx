import { motion } from 'framer-motion';
import { useBooth } from '../modes/BoothContext';

interface Prize {
  id: number;
  name: string;
  value: string;
  emoji: string;
  color: string;
  isGrand: boolean;
}

const PRIZES: Prize[] = [
  { id: 1, name: 'Platinum Package', value: '$5,000', emoji: '👑', color: 'from-amber-400 to-amber-600', isGrand: true },
  { id: 2, name: 'Luxury Smartphone', value: '$1,200', emoji: '📱', color: 'from-blue-400 to-blue-600', isGrand: false },
  { id: 3, name: 'Premium Smartwatch', value: '$800', emoji: '⌚', color: 'from-purple-400 to-purple-600', isGrand: false },
  { id: 4, name: 'Designer Bag', value: '$500', emoji: '👜', color: 'from-pink-400 to-pink-600', isGrand: false },
  { id: 5, name: 'Gift Voucher', value: '$300', emoji: '🎫', color: 'from-emerald-400 to-emerald-600', isGrand: false },
];

export function PrizeShowcase() {
  const { grandPrizeAvailable } = useBooth();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Prize Showcase
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {PRIZES.map((prize, i) => (
          <motion.div
            key={prize.id}
            className={`relative flex shrink-0 flex-col items-center gap-2 rounded-xl border p-4 backdrop-blur-sm ${
              prize.isGrand
                ? 'border-amber-400/30 bg-amber-400/5 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
                : 'border-white/10 bg-white/[0.03]'
            }`}
            initial={{ opacity: 0, y: 20, rotateY: -30 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.05, rotateY: 10 }}
            style={{ perspective: '800px' }}
          >
            {/* Grand prize badge */}
            {prize.isGrand && (
              <motion.div
                className="absolute -top-2 -right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-bold text-slate-900"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                GRAND
              </motion.div>
            )}

            {/* 3D rotating card effect */}
            <motion.div
              className="text-3xl"
              animate={{ rotateY: [0, 360] }}
              transition={{ repeat: Infinity, duration: prize.isGrand ? 4 : 6, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {prize.emoji}
            </motion.div>

            <p className="text-xs font-bold text-white/70 text-center whitespace-nowrap">{prize.name}</p>
            <p className={`text-sm font-black ${prize.isGrand ? 'text-amber-300' : 'text-white/50'}`}>
              {prize.value}
            </p>

            {/* Availability indicator */}
            {prize.isGrand && (
              <motion.div
                className={`mt-1 rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider ${
                  grandPrizeAvailable ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'
                }`}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {grandPrizeAvailable ? 'Available' : 'Claimed'}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}