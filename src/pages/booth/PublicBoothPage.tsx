// ============================================================
// Public Booth Page
//
// QR Code landing page for the Digital Lucky Draw Booth.
// Flow:
//   1. Participant fills registration form (name, company, whatsapp)
//   2. Browser opens front camera to capture face photo
//   3. After photo saved, MULAI button activates
//   4. Participant presses MULAI -> lucky draw spins
//   5. Result screen shows the won prize
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { boothApi, type BoothConfig, type SpinResult } from '@/api/booth';

type Step = 'form' | 'camera' | 'ready' | 'spinning' | 'result';

export default function PublicBoothPage() {
  const [config, setConfig] = useState<BoothConfig | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Registration form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  // Spin state
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);

  // Load booth config on mount
  useEffect(() => {
    let mounted = true;
    boothApi
      .getConfig()
      .then((res) => {
        if (mounted) setConfig(res.data);
      })
      .catch(() => {
        if (mounted) setError('Gagal memuat konfigurasi booth');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ─── Step 1: Registration ────────────────────────────────────────────
  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !company.trim()) {
        setError('Nama lengkap dan PT / Perusahaan wajib diisi');
        return;
      }
      setError('');
      setSubmitting(true);
      try {
        const res = await boothApi.registerParticipant({
          name: name.trim(),
          company: company.trim(),
          whatsapp: whatsapp.trim() || undefined,
        });
        setParticipantId(res.data.id);
        setStep('camera');
      } catch (err: any) {
        setError(err?.message ?? 'Gagal mendaftar, silakan coba lagi');
      } finally {
        setSubmitting(false);
      }
    },
    [name, company, whatsapp],
  );

  // ─── Step 2: Camera capture ──────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(dataUrl);
    // Stop camera after capture
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setStep('camera');
    startCamera();
  }, [startCamera]);

  const savePhoto = useCallback(async () => {
    if (!participantId || !photo) return;
    setPhotoSaving(true);
    setError('');
    try {
      await boothApi.uploadPhoto({ participantId, photo });
      setStep('ready');
    } catch (err: any) {
      setError(err?.message ?? 'Gagal menyimpan foto');
    } finally {
      setPhotoSaving(false);
    }
  }, [participantId, photo]);

  // ─── Step 3: Spin ────────────────────────────────────────────────────
  const handleSpin = useCallback(async () => {
    if (!participantId) return;
    setSpinning(true);
    setError('');
    setStep('spinning');
    try {
      const res = await boothApi.spin({ participantId });
      setResult(res.data);
      setStep('result');
    } catch (err: any) {
      setError(err?.message ?? 'Gagal melakukan undian');
      setStep('ready');
    } finally {
      setSpinning(false);
    }
  }, [participantId]);

  const handleDone = useCallback(() => {
    // Reset the whole flow for the next participant
    setStep('form');
    setName('');
    setCompany('');
    setWhatsapp('');
    setParticipantId(null);
    setPhoto(null);
    setResult(null);
    setError('');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950">
        <div className="text-white/60 animate-pulse">Memuat booth...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/20 to-gray-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {config?.eventName ?? 'Lucky Draw'}
        </h1>
        <p className="text-white/50 mt-1 text-sm">Digital Lucky Draw Booth</p>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-md w-full px-4 mb-4"
          >
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold text-white mb-1">Daftar Peserta</h2>
                <p className="text-white/50 text-sm mb-6">
                  Isi data diri Anda untuk mengikuti undian
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">
                      Nama Lengkap <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">
                      PT / Perusahaan <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Masukkan nama perusahaan"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">
                      Nomor WhatsApp <span className="text-white/30">(opsional)</span>
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+62 812 3456 7890"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Mendaftar...' : 'Lanjutkan'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold text-white mb-1">Ambil Foto Wajah</h2>
                <p className="text-white/50 text-sm mb-6">
                  Arahkan kamera depan ke wajah Anda
                </p>

                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black mb-4">
                  {photo ? (
                    <img src={photo} alt="Foto wajah" className="w-full h-full object-cover" />
                  ) : (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!cameraActive && !photo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={startCamera}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
                      >
                        Buka Kamera
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {!photo ? (
                    <button
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ambil Foto
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={retakePhoto}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                      >
                        Ulangi
                      </button>
                      <button
                        onClick={savePhoto}
                        disabled={photoSaving}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {photoSaving ? 'Menyimpan...' : 'Simpan Foto'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">Siap Beruntung!</h2>
                <p className="text-white/50 mb-8">
                  {name}, tekan tombol MULAI untuk memutar mesin Lucky Draw
                </p>
                <button
                  onClick={handleSpin}
                  disabled={spinning}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  {spinning ? 'Memutar...' : 'MULAI'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'spinning' && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-indigo-500 border-t-transparent"
                />
                <h2 className="text-2xl font-bold text-white mb-2">Memutar Undian...</h2>
                <p className="text-white/50">Semoga beruntung!</p>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-6xl mb-4"
                >
                  🏆
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1">Selamat!</h2>
                <p className="text-white/50 mb-6">
                  {result.participantName}, Anda memenangkan:
                </p>

                {result.prizeImageUrl ? (
                  <img
                    src={result.prizeImageUrl}
                    alt={result.prizeName}
                    className="w-40 h-40 mx-auto mb-4 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-40 h-40 mx-auto mb-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-5xl">
                    🎁
                  </div>
                )}

                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-2">
                  {result.prizeName}
                </h3>
                <p className="text-white/40 text-sm mb-8">
                  Tier: {result.prizeTier} · Sisa stok: {result.remainingStock}
                </p>

                <button
                  onClick={handleDone}
                  className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-white/30 text-xs">
        {config?.eventName ?? 'Lucky Draw'} · Radiant Lucky Draw Booth
      </footer>
    </div>
  );
}
