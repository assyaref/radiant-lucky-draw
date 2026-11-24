// ============================================================
// Winner Wall Page - Gallery of all winners with search & filter
// Live data from /api/booth/winners-public; refreshes on new winners
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUsers,
  HiOutlineTrophy,
  HiOutlineStar,
} from 'react-icons/hi2';
import { useSocketEvent, SOCKET_EVENTS } from '@services/socket';
import { normalizeImageUrl } from '@/utils';
import { boothApi } from '@api/booth';

interface Winner {
  id: string;
  participantName: string;
  participantCompany: string;
  participantPhotoUrl?: string;
  prizeName: string;
  prizeImageUrl?: string;
  prizeTier: string;
  prizeValue: number;
  announcedAt: string;
}

const tierColors: Record<string, string> = {
  gold: 'from-amber-400 to-yellow-500',
  grand: 'from-amber-400 to-yellow-500',
  silver: 'from-gray-300 to-gray-400',
  bronze: 'from-orange-500 to-orange-600',
  special: 'from-purple-400 to-pink-500',
};

const tierLabels: Record<string, string> = {
  gold: 'Gold',
  grand: 'Grand Prize',
  silver: 'Silver',
  bronze: 'Bronze',
  special: 'Special',
};

export default function WinnerWallPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const res = await boothApi.getPublicWinners(500);
      setWinners(
        (res.data ?? []).map((w) => ({
          id: w.id,
          participantName: w.participantName ?? '',
          participantCompany: w.participantCompany ?? '',
          participantPhotoUrl: w.participantPhotoUrl,
          prizeName: w.prizeName ?? '',
          prizeImageUrl: w.prizeImageUrl,
          prizeTier: w.prizeTier ?? 'special',
          prizeValue: Number(w.prizeValue) || 0,
          announcedAt: w.announcedAt,
        })),
      );
    } catch {
      // Keep the last list on a transient error; the poll retries.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  // A new winner was revealed: re-read the list from the database.
  const handleDrawWinner = useCallback(() => {
    setTimeout(() => void load(), 1500);
  }, [load]);

  useSocketEvent(SOCKET_EVENTS.DRAW_WINNER as any, handleDrawWinner);

  const filtered = winners.filter((w) => {
    const matchesSearch =
      w.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.participantCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.prizeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || w.prizeTier === filterTier;
    return matchesSearch && matchesTier;
  });

  const tierCounts = {
    all: winners.length,
    grand: winners.filter((w) => w.prizeTier === 'grand').length,
    gold: winners.filter((w) => w.prizeTier === 'gold').length,
    silver: winners.filter((w) => w.prizeTier === 'silver').length,
    bronze: winners.filter((w) => w.prizeTier === 'bronze').length,
    special: winners.filter((w) => w.prizeTier === 'special').length,
  };

  return (
    <div className="min-h-screen bg-dark-surface">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-dark-border bg-dark-surface-secondary">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-amber-500/5 to-purple-500/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <HiOutlineTrophy className="w-8 h-8 text-amber-400" />
                Winner Wall
              </h1>
              <p className="text-dark-text-tertiary mt-2">
                {loading ? 'Memuat pemenang…' : `${winners.length} pemenang diumumkan`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search winner or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-surface-secondary border border-dark-border text-white placeholder-dark-text-tertiary outline-none focus:border-primary-500/50 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2">
            {Object.entries(tierCounts).map(([tier, count]) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterTier === tier
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-surface-secondary text-dark-text-tertiary border border-dark-border hover:text-white'
                }`}
              >
                {tier === 'all' ? 'All' : tierLabels[tier] || tier}{' '}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Winners Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <HiOutlineUsers className="w-16 h-16 text-dark-text-tertiary/30 mx-auto mb-4" />
              <p className="text-dark-text-tertiary">No winners found</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((winner, i) => (
                <motion.div
                  key={winner.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="rounded-xl border border-dark-border bg-dark-surface-secondary overflow-hidden hover:border-dark-border/80 transition-colors group"
                >
                  <div
                    className={`h-1.5 bg-gradient-to-r ${tierColors[winner.prizeTier] || 'from-gray-400 to-gray-500'}`}
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {winner.participantPhotoUrl ? (
                        <img
                          src={normalizeImageUrl(winner.participantPhotoUrl)}
                          alt={winner.participantName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-dark-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-2 border-dark-border flex items-center justify-center">
                          <HiOutlineUsers className="w-5 h-5 text-dark-text-tertiary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate group-hover:text-primary-400 transition-colors">
                          {winner.participantName}
                        </p>
                        <p className="text-dark-text-tertiary text-xs truncate">
                          {winner.participantCompany}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-dark-surface-tertiary/50">
                      {winner.prizeImageUrl ? (
                        <img
                          src={normalizeImageUrl(winner.prizeImageUrl)}
                          alt={winner.prizeName}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-500/10 to-yellow-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                          <HiOutlineStar className="w-6 h-6 text-amber-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm">{winner.prizeName}</p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${tierColors[winner.prizeTier] || 'from-gray-400 to-gray-500'} text-white`}
                        >
                          {tierLabels[winner.prizeTier] || winner.prizeTier}
                        </span>
                      </div>
                    </div>
                    <p className="text-dark-text-tertiary/50 text-[10px] mt-3 text-right">
                      {new Date(winner.announcedAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
