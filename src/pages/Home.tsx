import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ParticleEngine,
  Background,
  LuxuryLighting,
  Floor,
  FloatingObjects,
  AudioProvider,
  LightingEngine,
  CameraController,
  ScreenAttractMode,
  WinnerPreview,
  SponsorCarousel,
  Marquee,
  BoothProvider,
  useBooth,
  WelcomeMode,
  AttractionMode,
  CelebrationMode,
  DigitalSignage,
  EmergencyMode,
  AccessibilityProvider,
  SafeArea,
  FloatingHolographicUI,
} from '@components/booth';

import {
  TopBar,
  SidebarLeft,
  SidebarRight,
  CenterMachine,
  AnimatedBackground,
  FloatingParticles,
} from '@components/layout';

import { useBoothAudio } from '@components/booth/audio/useBoothAudio';

function BoothContent() {
  // Returns false during SSR and true on the client to avoid hydration mismatches.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { recordInteraction, mode } = useBooth();
  // Connect audio system to booth lifecycle events (SFX + voice lines)
  useBoothAudio();

  const handleInteraction = useCallback(() => {
    recordInteraction();
  }, [recordInteraction]);

  useEffect(() => {
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

  const isOverlayMode =
    mode === 'welcome' ||
    mode === 'attraction' ||
    mode === 'celebration' ||
    mode === 'digital' ||
    mode === 'emergency';

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          className="relative flex min-h-screen flex-col overflow-hidden bg-[#020617] font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* ---- Premium Animated Background Layers ---- */}
          <AnimatedBackground />
          <FloatingParticles />
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
            <SafeArea
              className={`relative z-10 flex flex-1 flex-col transition-opacity duration-500 ${isOverlayMode ? 'opacity-30' : 'opacity-100'}`}
            >
              {/* Top Bar: Logo + Status + Audio + Visualizer + Clock */}
              <TopBar />

              {/* ---- Balanced 3-Column Grid Layout ---- */}
              <div className="grid flex-1 grid-cols-[1fr_1.4fr_1fr] items-stretch gap-6 py-2">
                {/* ===== LEFT PANEL: Prizes ===== */}
                <SidebarLeft />

                {/* ===== CENTER PANEL: Machine + Hero + QR + Countdown ===== */}
                <CenterMachine />

                {/* ===== RIGHT PANEL: Live Widgets ===== */}
                <SidebarRight />
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
