// ============================================================
// Offline Indicator Component (Small Icon)
// ============================================================

import { motion } from 'framer-motion';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function OfflineIndicator({ className = '', size = 'md' }: OfflineIndicatorProps) {
  const { isOnline, reconnecting } = useOfflineStatus();


  const getColor = () => {
    if (reconnecting) return 'bg-blue-400';
    if (!isOnline) return 'bg-red-400';
    return 'bg-green-400';
  };

  const getLabel = () => {
    if (reconnecting) return 'Reconnecting...';
    if (!isOnline) return 'Offline';
    return 'Online';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} title={getLabel()}>
      <motion.div
        animate={{
          scale: reconnecting ? [1, 1.3, 1] : 1,
          opacity: reconnecting ? [1, 0.5, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: reconnecting ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className={`${sizeMap[size]} rounded-full ${getColor()} shadow-lg shadow-${getColor()}/50`}
      />
      <span className="text-xs text-dark-text-tertiary hidden sm:inline">{getLabel()}</span>
    </div>
  );
}
