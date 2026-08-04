import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ParticleEngine,
  Background,
  LuxuryLighting,
  Floor,
  LuckyMachine,
  HeroTitle,
  QRCode,
  PrizePanel,
  LiveStatus,
  Clock,
  Countdown,
  Marquee,
  FloatingObjects,
  AudioVisualizer,
  FloatingHolographicUI,
  AudioProvider,
  AudioControls,
  LightingEngine,
  CameraController,
  ScreenAttractMode,
  WinnerPreview,
  StatusBar,

  WinnerWall,
  SponsorCarousel,
  BoothProvider,
  useBooth,
  WelcomeMode,
  AttractionMode,
  CelebrationMode,
  QueueVisualization,
  PrizeShowcase,
  LiveStatistics,
  LiveActivityFeed,
  DigitalSignage,
  EmergencyMode,
  AccessibilityProvider,
  SafeArea,
} from '@components/booth';

import { useBoothAudio } from '@components/booth/audio/useBoothAudio';

function BoothContent() {
  const [mounted, setMounted] = useState(false);
  const { recordInteraction, mode } = useBooth();
  // Connect audio system to booth lifecycle events (SFX + voice lines)
  useBoothAudio();


  const handleInteraction = useCallback(() => {
    recordInteraction();
  }, [recordInteraction]);

  useEffect(() => {
    setMounted(true);
    // Record initial interaction
    const timer = setTimeout(() => recordInteraction(), 100);
    return () => clearTimeout(timer);
  }, [recordInteraction]);

  // Listen for user interactions to exit digital/welcome modes
  useEffect(() => {
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [handleInteraction]);

  const isOverlayMode = mode === 'welcome' || mode === 'attraction' || mode === 'celebration' || mode === 'digital' || mode === 'emergency';

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          className="relative flex min-h-screen flex-col overflow-hidden bg-[#020617] font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* ---- Background Layers ---- */}
          <Background />
          <ParticleEngine />
          <LuxuryLighting />
          <LightingEngine />
          <FloatingObjects />
          <Floor />

          {/* ---- Screen Attract Mode (overlay) ---- */}
          <ScreenAttractMode />

          {/* ---- Floating Holographic UI ---- */}
          <FloatingHolographicUI />

          {/* ---- Camera Controller wraps main content for cinematic parallax ---- */}
          <CameraController className="absolute inset-0 z-[5]">
            {/* ---- Main Content (wrapped in TV Safe Area to prevent edge clipping) ---- */}
            <SafeArea className={`relative z-10 flex flex-1 flex-col transition-opacity duration-500 ${isOverlayMode ? 'opacity-30' : 'opacity-100'}`}>
              {/* Top Bar: Logo + Status Bar + Audio Controls + Clock */}
              <motion.header
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="22" stroke="url(#logoGrad)" strokeWidth="3" />
                    <path d="M24 8 L28 18 L38 18 L30 24 L33 34 L24 28 L15 34 L18 24 L10 18 L20 18 Z" fill="url(#logoGrad)" />
                    <defs>
                      <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                        <stop stopColor="#fbbf24" />
                        <stop offset="1" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div>
                    <h2 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">
                      Radiant Group
                    </h2>
                    <p className="text-[9px] tracking-[0.3em] text-amber-400/40 uppercase">
                      Lucky Draw Digital Booth
                    </p>
                  </div>
                </div>

                {/* Right side: Status Bar + Audio + Visualizer + Clock */}
                <div className="flex items-center gap-4">
                  <StatusBar />
                  <div className="h-4 w-px bg-white/10" />
                  <AudioControls />
                  <AudioVisualizer />
                  <Clock />
                </div>
              </motion.header>

              {/* ---- Balanced 3-Column Grid Layout ---- */}
              <div className="grid flex-1 grid-cols-[1fr_1.4fr_1fr] items-stretch gap-6 py-2">
                {/* ===== LEFT PANEL: Prizes ===== */}
                <motion.div
                  className="flex flex-col justify-center gap-4 overflow-hidden"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <PrizePanel />
                  <PrizeShowcase />
                </motion.div>

                {/* ===== CENTER PANEL: Machine + Hero + QR + Countdown ===== */}
                <motion.div
                  className="flex flex-col items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {/* Lucky Machine + Countdown beside machine */}
                  <div className="flex items-center justify-center gap-6">
                    {/* Lucky Machine - center attraction */}
                    <div className="scale-[0.7] md:scale-[0.85] lg:scale-100">
                      <LuckyMachine />
                    </div>
                    {/* Countdown beside machine */}
                    <Countdown />
                  </div>

                  {/* Hero Title - moved up ~60px for stronger visual balance */}
                  <div className="-mt-16">
                    <HeroTitle />
                  </div>

                  {/* QR Code - always visible during idle */}
                  <div className="mt-2 flex items-center justify-center">
                    <QRCode />
                  </div>
                </motion.div>



                {/* ===== RIGHT PANEL: Live Widgets ===== */}
                <motion.div
                  className="flex flex-col justify-center gap-4 overflow-hidden"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <LiveStatus />
                  <WinnerWall />
                  <QueueVisualization />
                  <LiveStatistics />
                  <LiveActivityFeed />
                </motion.div>

              </div>
            </SafeArea>
          </CameraController>

          {/* ---- Mode Overlays ---- */}
          <WelcomeMode />
          <AttractionMode />
          <CelebrationMode />
          <DigitalSignage />
          <EmergencyMode />

          {/* ---- Idle Winner Preview (demo winner every 30s) ---- */}
          <WinnerPreview />


          {/* Bottom: Sponsor Carousel */}
          <div className="relative z-10 border-t border-white/5 bg-dark-surface/60 backdrop-blur-sm">
            <SponsorCarousel />
          </div>

          {/* Bottom: Winner Marquee */}
          <Marquee />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <AudioProvider>
      <BoothProvider>
        <AccessibilityProvider>
          <BoothContent />
        </AccessibilityProvider>
      </BoothProvider>
    </AudioProvider>
  );
}
