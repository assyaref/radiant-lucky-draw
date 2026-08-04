// ============================================================
// Offline Banner Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { usePendingActions } from '../hooks/usePendingActions';

interface OfflineBannerProps {
  className?: string;
  showSyncButton?: boolean;
  showPendingCount?: boolean;
}

export function OfflineBanner({
  className = '',
  showSyncButton = true,
  showPendingCount = true,
}: OfflineBannerProps) {
  const { status, scenario, isOnline, reconnecting, reconnectAttempts } = useOfflineStatus();

  const { pendingCount: pendingActions } = usePendingActions();

  const isOffline = !isOnline || status === 'offline' || status === 'server-down' || status === 'socket-disconnected';

  const getBannerInfo = () => {
    if (status === 'offline') {
      return {
        icon: '🔴',
        title: 'You are offline',
        message: scenario === 'internet-lost'
          ? 'Internet connection lost. Changes will be saved locally.'
          : 'Connection lost. Working in offline mode.',
        color: 'bg-red-500/10 border-red-500/30 text-red-400',
      };
    }
    if (status === 'server-down') {
      return {
        icon: '⚠️',
        title: 'Server unavailable',
        message: 'The server is currently unreachable. Your data is safe locally.',
        color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      };
    }
    if (status === 'socket-disconnected') {
      return {
        icon: '🔌',
        title: 'Real-time connection lost',
        message: 'Live updates are paused. Reconnecting...',
        color: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      };
    }
    if (status === 'reconnecting') {
      return {
        icon: '🔄',
        title: 'Reconnecting...',
        message: `Attempt ${reconnectAttempts} to restore connection`,
        color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      };
    }
    return null;
  };

  const bannerInfo = getBannerInfo();

  return (
    <AnimatePresence>
      {(isOffline || reconnecting) && bannerInfo && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[9999] ${className}`}
        >
          <div className={`mx-auto max-w-7xl px-4 py-3 ${bannerInfo.color} border-b backdrop-blur-sm`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{bannerInfo.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{bannerInfo.title}</p>
                  <p className="text-xs opacity-80 truncate">{bannerInfo.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {showPendingCount && pendingActions > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                    {pendingActions} pending
                  </span>
                )}

                {reconnecting && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}

                {showSyncButton && isOffline && (
                  <button
                    onClick={() => {/* Manual sync trigger */}}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
