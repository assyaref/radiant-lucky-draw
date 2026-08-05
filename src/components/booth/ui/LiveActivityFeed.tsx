import { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: number;
  type: 'register' | 'queue' | 'winner' | 'grand';
  text: string;
  time: string;
}

const ACTIVITY_POOL: Array<Omit<Activity, 'id' | 'time'>> = [
  { type: 'register', text: 'New participant registered' },
  { type: 'queue', text: 'Queue updated — 12 in line' },
  { type: 'winner', text: 'Winner announced — Gold Edition' },
  { type: 'grand', text: 'Grand Prize is now available' },
  { type: 'register', text: 'Participant #248 joined the draw' },
  { type: 'queue', text: 'Queue position advanced' },
  { type: 'winner', text: 'Winner claimed — Silver Gift Set' },
  { type: 'grand', text: 'Grand Prize spotlight activated' },
];

const TYPE_STYLES: Record<Activity['type'], { icon: string; color: string; glow: string }> = {
  register: { icon: '👥', color: 'text-blue-300', glow: 'rgba(59,130,246,0.4)' },
  queue: { icon: '🔢', color: 'text-cyan-300', glow: 'rgba(34,211,238,0.4)' },
  winner: { icon: '🏆', color: 'text-amber-300', glow: 'rgba(251,191,36,0.4)' },
  grand: { icon: '👑', color: 'text-amber-400', glow: 'rgba(251,191,36,0.5)' },
};

export const LiveActivityFeed = memo(function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const idRef = useRef(0);

  // Seed initial activities
  useEffect(() => {
    const seed = ACTIVITY_POOL.slice(0, 4).map((a) => ({
      ...a,
      id: idRef.current++,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    setActivities(seed);
  }, []);

  // Auto-scroll feed - add new activity every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const next = ACTIVITY_POOL[idRef.current % ACTIVITY_POOL.length];
      setActivities((prev) => {
        const newActivity: Activity = {
          ...next,
          id: idRef.current++,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        // Keep max 5 items for compact feed
        return [newActivity, ...prev].slice(0, 5);
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-3.5 backdrop-blur-md">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-sm"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            ⚡
          </motion.span>
          <span className="text-xs font-bold tracking-[0.15em] text-white/60 uppercase">
            Live Activity
          </span>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-red-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
          <span className="text-[9px] font-bold tracking-wider text-red-300/70">LIVE</span>
        </div>
      </div>

      {/* Activity list */}
      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {activities.map((activity) => {
            const style = TYPE_STYLES[activity.type];
            return (
              <motion.div
                key={activity.id}
                className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5"
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                layout
              >
                <motion.span
                  className="text-sm"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  {style.icon}
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-white/70">{activity.text}</p>
                </div>
                <motion.span
                  className="shrink-0 text-[9px] font-mono tabular-nums"
                  style={{ color: style.color, textShadow: `0 0 8px ${style.glow}` }}
                >
                  {activity.time}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0b1426]/80 to-transparent" />
    </div>
  );
});
