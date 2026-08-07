// ============================================================
// Public Booth Page - Production Ready
// Digital Lucky Draw Booth Enterprise
// Flow: Landing -> Registration -> Camera -> Preview -> Ready -> Spin -> Result -> Reset
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import {
  HiOutlineCamera,
  HiOutlineArrowPath,
  HiOutlineArrowUturnLeft,
  HiOutlineUsers,
} from 'react-icons/hi2';
import { boothApi, type BoothConfig, type SpinResult } from '@/api/booth';

type Step = 'landing' | 'form' | 'camera' | 'preview' | 'ready' | 'spinning' | 'result';
type CameraFacing = 'user' | 'environment';

export default function PublicBoothPage() {
  const [config, setConfig] = useState<BoothConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('landing');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winW, setWinW] = useState(window.innerWidth);
  const [winH, setWinH] = useState(window.innerHeight);

  // ─── Audio ────────────────────────────────────────────────
  const audioRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((freq: number, dur: number, type: OscillatorType = 'sine') => {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + dur);
    } catch {
      /* audio not critical */
    }
  }, []);

  const playSpinSound = useCallback(() => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playBeep(300 + Math.random() * 500, 0.08, 'square'), i * 80);
    }
  }, [playBeep]);

  const playWinSound = useCallback(() => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playBeep(f, 0.35, 'triangle'), i * 130),
    );
  }, [playBeep]);

  useEffect(() => {
    let c = false;
    const h = () => {
      setWinW(window.innerWidth);
      setWinH(window.innerHeight);
    };
    window.addEventListener('resize', h);
    boothApi
      .getConfig()
      .then((configRes) => {
        if (!c) {
          setConfig(configRes.data);
          setTotalParticipants(configRes.data?.totalParticipants ?? 0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!c) {
          setError('Gagal memuat konfigurasi. Silakan refresh.');
          setLoading(false);
        }
      });
    return () => {
      c = true;
      window.removeEventListener('resize', h);
    };
  }, []);

  useEffect(
    () => () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nama wajib diisi';
    if (!company.trim()) e.company = 'Perusahaan wajib diisi';
    if (whatsapp.trim() && !/^[+]?[\\d\\s()-]{8,20}$/.test(whatsapp.trim()))
      e.whatsapp = 'Format tidak valid';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      if (!validate()) return;
      setError('');
      setSubmitting(true);
      try {
        const r = await boothApi.registerParticipant({
          name: name.trim(),
          company: company.trim(),
          whatsapp: whatsapp.trim() || undefined,
        });
        setParticipantId(r.data.id);
        setStep('camera');
      } catch (err: any) {
        setError(err?.message ?? 'Gagal mendaftar');
      } finally {
        setSubmitting(false);
      }
    },
    [name, company, whatsapp],
  );

  const startCamera = useCallback(async (facing: CameraFacing = 'user') => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCameraFacing(facing);
      setCameraActive(true);
    } catch {
      setCameraError('Tidak dapat mengakses kamera');
    }
  }, []);

  const flipCamera = useCallback(() => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(next);
  }, [cameraFacing, startCamera]);

  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const cv = document.createElement('canvas');
    cv.width = 480;
    cv.height = 480;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, 480, 480);
    setPhoto(cv.toDataURL('image/jpeg', 0.7));
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setStep('preview');
  }, []);

  const retake = useCallback(() => {
    setPhoto(null);
    setStep('camera');
    startCamera(cameraFacing);
  }, [startCamera, cameraFacing]);

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

  const handleSpin = useCallback(async () => {
    if (!participantId) return;
    setSpinning(true);
    setStep('spinning');
    setError('');
    playSpinSound();
    try {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await boothApi.spin({ participantId });
      setResult(res.data);
      setStep('result');
      setShowConfetti(true);
      playWinSound();
      setTimeout(() => setShowConfetti(false), 8000);
    } catch (err: any) {
      setError(err?.message ?? 'Gagal undian');
      setStep('ready');
    } finally {
      setSpinning(false);
    }
  }, [participantId, playSpinSound, playWinSound]);

  const handleDone = useCallback(() => {
    setStep('landing');
    setName('');
    setCompany('');
    setWhatsapp('');
    setParticipantId(null);
    setPhoto(null);
    setResult(null);
    setError('');
    setFieldErrors({});
  }, []);

  const prizes = config?.prizes ?? [];

  if (loading)
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm font-medium">Memuat booth...</p>
        </div>
      </div>
    );

  if (!config && !loading)
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl">😕</div>
          <h2 className="text-xl font-bold text-white">Tidak Dapat Terhubung</h2>
          <p className="text-white/50 text-sm">{error || 'Gagal memuat booth.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors inline-flex items-center gap-2"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );

  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl bg-white/5 border ${fieldErrors[field] ? 'border-red-500/50' : 'border-white/10'} text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors text-sm`;

  return (
    <div className="min-h-screen bg-dark-surface flex flex-col relative">
      {showConfetti && (
        <Confetti
          width={winW}
          height={winH}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
          colors={['#818cf8', '#c084fc', '#fbbf24', '#34d399', '#f472b6', '#38bdf8']}
          style={{ position: 'fixed', zIndex: 100 }}
        />
      )}

      <header className="px-4 py-3 text-center border-b border-white/5 bg-dark-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <h1 className="text-base font-bold text-white truncate">
          {config?.eventName ?? 'Lucky Draw'}
        </h1>
        <p className="text-[10px] text-white/30">Digital Lucky Draw Booth</p>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-7xl mb-5"
                >
                  🎰
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Lucky Draw Booth</h2>
                <p className="text-white/50 text-sm mb-4">
                  Ambil foto, putar undian, dan menangkan hadiah menarik!
                </p>
                <div className="flex items-center justify-center gap-2 mb-4 text-white/40 text-xs">
                  <HiOutlineUsers className="w-4 h-4" />
                  <span>{totalParticipants} peserta</span>
                </div>
                {prizes.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                    {prizes.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg"
                        title={p.name}
                      >
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          '🎁'
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setStep('form')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all text-sm"
                >
                  Mulai
                </button>
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="w-full max-w-sm"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">✍️</div>
                  <h2 className="text-lg font-bold text-white">Registrasi</h2>
                  <p className="text-white/40 text-xs mt-1">Isi data diri Anda</p>
                </div>
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    {error}
                  </div>
                )}
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      Nama Lengkap <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                      }}
                      placeholder="Nama lengkap Anda"
                      className={inputCls('name')}
                      disabled={submitting}
                      autoComplete="name"
                    />
                    {fieldErrors.name && (
                      <p className="text-red-400 text-[10px] mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      PT / Perusahaan <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        if (fieldErrors.company) setFieldErrors((p) => ({ ...p, company: '' }));
                      }}
                      placeholder="Nama perusahaan"
                      className={inputCls('company')}
                      disabled={submitting}
                      autoComplete="organization"
                    />
                    {fieldErrors.company && (
                      <p className="text-red-400 text-[10px] mt-1">{fieldErrors.company}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">
                      No. WhatsApp <span className="text-white/30">(opsional)</span>
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        if (fieldErrors.whatsapp) setFieldErrors((p) => ({ ...p, whatsapp: '' }));
                      }}
                      placeholder="0812-3456-7890"
                      className={inputCls('whatsapp')}
                      disabled={submitting}
                      autoComplete="tel"
                    />
                    {fieldErrors.whatsapp && (
                      <p className="text-red-400 text-[10px] mt-1">{fieldErrors.whatsapp}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all text-sm mt-2"
                  >
                    {submitting ? 'Mendaftar...' : 'Lanjut ke Foto'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-1">Ambil Foto</h2>
                <p className="text-white/40 text-xs mb-4">Pastikan wajah terlihat jelas</p>
                {cameraError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {cameraError}
                  </div>
                )}
                <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-white/10 bg-black/40 shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <HiOutlineCamera className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  {cameraActive && (
                    <button
                      onClick={flipCamera}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white/70 hover:text-white z-10"
                      title="Balik Kamera"
                    >
                      <HiOutlineArrowUturnLeft className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-5">
                  {!cameraActive ? (
                    <button
                      onClick={() => startCamera()}
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors inline-flex items-center gap-2"
                    >
                      <HiOutlineCamera className="w-5 h-5" />
                      Buka Kamera
                    </button>
                  ) : (
                    <button
                      onClick={capture}
                      className="w-20 h-20 mx-auto block rounded-full border-[3px] border-white/80 bg-white/10 hover:bg-white/20 transition-all active:scale-95 shadow-2xl"
                      title="Ambil Foto"
                    >
                      <span className="sr-only">Ambil</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'preview' && photo && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-1">Pratinjau Foto</h2>
                <p className="text-white/40 text-xs mb-4">Pastikan foto sudah sesuai</p>
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}
                <img
                  src={photo}
                  alt="Preview"
                  className="w-56 h-56 mx-auto rounded-2xl object-cover border-2 border-indigo-500/20 shadow-xl"
                />
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={retake}
                    disabled={photoSaving}
                    className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <HiOutlineArrowPath className="w-4 h-4" />
                    Ulangi
                  </button>
                  <button
                    onClick={savePhoto}
                    disabled={photoSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {photoSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-xl font-bold text-white mb-2">Siap!</h2>
                <p className="text-white/50 text-sm mb-8">
                  Data dan foto Anda sudah tersimpan.
                  <br />
                  Tekan MULAI untuk memutar undian!
                </p>
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSpin}
                  disabled={spinning}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-amber-500/25 transition-all"
                >
                  {spinning ? 'Memutar...' : '🎰 MULAI'}
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
              className="w-full max-w-sm text-center"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-2xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  className="w-28 h-28 mx-auto mb-6 rounded-full border-[5px] border-indigo-500/30 border-t-indigo-500 shadow-2xl"
                />
                <div className="h-8 overflow-hidden mb-4">
                  <motion.div
                    animate={{ y: [0, -32 * (prizes.length - 1), 0] }}
                    transition={{ repeat: Infinity, duration: prizes.length * 0.3, ease: 'linear' }}
                  >
                    {prizes.map((p) => (
                      <div key={p.id} className="h-8 flex items-center justify-center">
                        <span className="text-white/60 text-sm font-medium">{p.name}</span>
                      </div>
                    ))}
                    {prizes.length === 0 && (
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-white/60 text-sm">🎁</span>
                      </div>
                    )}
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1 animate-pulse">
                  Memutar Undian...
                </h2>
                <p className="text-white/40 text-sm">Semoga beruntung! 🤞</p>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-sm"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="text-7xl mb-4"
                >
                  🏆
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-white mb-1"
                >
                  Selamat!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/50 mb-6"
                >
                  {result.participantName}, Anda memenangkan:
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  {result.prizeImageUrl ? (
                    <img
                      src={result.prizeImageUrl}
                      alt={result.prizeName}
                      className="w-44 h-44 mx-auto mb-4 rounded-2xl object-cover border-2 border-amber-500/30 shadow-xl"
                    />
                  ) : (
                    <div className="w-44 h-44 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 flex items-center justify-center text-6xl shadow-xl">
                      🎁
                    </div>
                  )}
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mb-2"
                >
                  {result.prizeName}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="text-white/40 text-xs mb-8 flex items-center justify-center gap-3"
                >
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px]">
                    {result.prizeTier}
                  </span>
                  <span>Sisa: {result.remainingStock}</span>
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  onClick={handleDone}
                  className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors relative z-10"
                >
                  Selesai
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-4 py-3 text-center text-white/20 text-[10px] border-t border-white/5">
        {config?.eventName ?? 'Lucky Draw'} · Radiant
      </footer>
    </div>
  );
}
