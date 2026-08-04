import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function StatusBar() {
  const [time, setTime] = useState(new Date());
  const [serverStatus, setServerStatus] = useState<'online' | 'connected'>('connected');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    // Simulate server status
    const statusTimer = setInterval(() => {
      setServerStatus(Math.random() > 0.1 ? 'connected' : 'online');
    }, 5000);
    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  const statusConfig = {
    online: { dot: 'bg-emerald-400', text: 'text-emerald-300', label: 'ONLINE' },
    connected: { dot: 'bg-blue-400', text: 'text-blue-300', label: 'CONNECTED' },
  };

  const status = statusConfig[serverStatus];

  return (
    <div className="flex items-center gap-4">
      {/* LIVE badge */}
      <motion.div
        className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <motion.span
          className="flex h-1.5 w-1.5 rounded-full bg-red-500"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
        <span className="text-[9px] font-bold tracking-wider text-red-400 uppercase">LIVE</span>
      </motion.div>

      {/* Server Status */}
      <motion.div
        className="flex items-center gap-1.5"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <motion.span
          className={`flex h-1.5 w-1.5 rounded-full ${status.dot}`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <span className={`text-[9px] font-bold tracking-wider ${status.text} uppercase`}>
          {status.label}
        </span>
      </motion.div>

      {/* Divider */}
      <div className="h-3 w-px bg-white/10" />

      {/* Clock */}
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-bold tracking-wider text-white/60 tabular-nums">
          {hours}:{minutes}
        </span>
      </div>

      {/* Date */}
      <span className="text-[8px] font-medium text-white/30">
        {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    </div>
  );
}