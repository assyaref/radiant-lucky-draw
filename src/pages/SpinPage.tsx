/**
 * Spin Page - Prize & Name Wheel
 *
 * Halaman untuk roda putar (wheel of fortune) yang dapat memilih
 * hadiah atau nama peserta secara acak dengan bobot probabilitas.
 *
 * @modes: 'prize' (hadiah) | 'name' (nama peserta)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiUsers, FiRotateCcw, FiAlertCircle } from 'react-icons/fi';
import { useSpin } from '@/features/spin/hooks/useSpin';
import { PrizeWheel } from '@/features/spin/components/PrizeWheel';
import { NameWheel } from '@/features/spin/components/NameWheel';
import type { WheelSegment } from '@/features/spin/types';

function ModeButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </button>
  );
}

export default function SpinPage() {
  const [manualSegments, setManualSegments] = useState<WheelSegment[]>([]);
  const [showResult, setShowResult] = useState(false);

  const {
    mode,
    segments,
    isSpinning,
    result,
    history,
    error,
    config,
    spinPrize,
    spinName,
    resetSpin,
    clearResult,
    setSpinMode,
    setSegments,
  } = useSpin();

  const handleSpin = useCallback(() => {
    if (mode === 'prize') {
      spinPrize();
    } else {
      spinName();
    }
    setShowResult(false);
  }, [mode, spinPrize, spinName]);

  const handleReset = useCallback(() => {
    resetSpin();
    setShowResult(false);
    setManualSegments([]);
  }, [resetSpin]);

  const handleAddManualSegment = useCallback(() => {
    const label = window.prompt('Masukkan nama segmen:');
    if (!label) return;
    const newSegment: WheelSegment = {
      id: `manual-${Date.now()}`,
      label,
      value: `manual-${Date.now()}`,
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`,
      weight: 1,
    };
    setManualSegments((prev) => [...prev, newSegment]);
    setSegments([...segments, newSegment]);
  }, [setSegments, segments]);

  const hasSegments = segments.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950">
      {/* Header */}
      <div className="relative border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FiGift className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Spin Wheel</h1>
                <p className="text-white/50 text-sm">Roda putar hadiah dan nama peserta</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
            >
              <FiRotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-8">
          <ModeButton
            active={mode === 'prize'}
            label="Hadiah"
            icon={<FiGift className="w-5 h-5" />}
            onClick={() => setSpinMode('prize')}
          />
          <ModeButton
            active={mode === 'name'}
            label="Nama Peserta"
            icon={<FiUsers className="w-5 h-5" />}
            onClick={() => setSpinMode('name')}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Wheel */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-md">
              {mode === 'prize' ? (
                <PrizeWheel
                  segments={segments}
                  isSpinning={isSpinning}
                  result={
                    result && mode === 'prize'
                      ? {
                          segment: result.segment,
                          rotationAngle: result.rotationAngle,
                        }
                      : null
                  }
                  duration={config.duration}
                  onSpinComplete={() => {
                    setShowResult(true);
                  }}
                />
              ) : (
                <NameWheel
                  segments={segments}
                  isSpinning={isSpinning}
                  result={
                    result && mode === 'name'
                      ? {
                          segment: result.segment,
                          rotationAngle: result.rotationAngle,
                        }
                      : null
                  }
                  duration={config.duration}
                />
              )}
            </div>

            {/* Spin Button */}
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSpin}
                disabled={isSpinning || !hasSegments}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSpinning
                    ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/30'
                    : !hasSegments
                      ? 'bg-white/10 text-white/40 border border-white/10'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 hover:shadow-indigo-500/60'
                }`}
              >
                {isSpinning
                  ? 'Memutar...'
                  : hasSegments
                    ? 'PUTAR RODA'
                    : 'Tambah Segmen Terlebih Dahulu'}
              </button>
              {!hasSegments && (
                <button
                  onClick={handleAddManualSegment}
                  className="px-4 py-5 rounded-2xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                >
                  +
                </button>
              )}
            </div>

            {/* Manual segments info */}
            {manualSegments.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-white/5 text-white/60 text-sm border border-white/10">
                {manualSegments.length} segmen manual ditambahkan
              </div>
            )}
          </div>

          {/* Right: Result & History */}
          <div className="lg:col-span-5">
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm mb-6"
              >
                <FiAlertCircle className="w-4 h-4 mr-2" /> {error}
              </motion.div>
            )}

            {/* Result Card */}
            {result && result.success && showResult && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-2xl mb-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <FiGift className="w-16 h-16" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-indigo-100 text-xs font-medium uppercase tracking-wider">
                      {mode === 'prize' ? 'Hadiah yang Diundikan' : 'Peserta Terpilih'}
                    </span>
                    <span className="text-white/60 text-xs">
                      {new Date(result.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {mode === 'prize' ? result.prizeName : result.participantName}
                  </div>
                  <div className="text-indigo-200 text-sm">
                    {mode === 'prize'
                      ? `Hadiah: ${result.prizeName}`
                      : `Peserta: ${result.participantName}`}
                  </div>
                  <button
                    onClick={clearResult}
                    className="mt-4 px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors text-sm"
                  >
                    Tutup Hasil
                  </button>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Segments List */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiUsers className="w-4 h-4" /> Segmen Roda ({segments.length})
              </h3>
              {segments.length === 0 ? (
                <div className="text-center py-6 text-white/40 text-sm">
                  Belum ada segmen. Tambah hadiah melalui Manajemen Hadiah atau tambah segmen
                  manual.
                </div>
              ) : (
                <div className="space-y-2">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-white text-sm">{segment.label}</span>
                        <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                          W{segment.weight}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          // Remove segment - need to implement in store
                          const updated = segments.filter((s) => s.id !== segment.id);
                          setSegments(updated);
                        }}
                        className="text-white/30 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4">
                <h3 className="text-white font-semibold mb-3">Riwayat Undian</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {history.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded bg-white/5 text-sm">
                      <span className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs">
                        #{i + 1}
                      </span>
                      <span className="text-white flex-1">
                        {item.mode === 'prize' ? item.prizeName : item.participantName}
                      </span>
                      <span className="text-white/40 text-xs">
                        {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
