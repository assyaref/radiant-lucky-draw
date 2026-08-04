import { memo } from 'react';
import { motion } from 'framer-motion';
import QRCodeSVG from 'react-qr-code';
import { floatLoop, pulseLoop, glowLoop } from '@animations/index';
import { env } from '@config/env';

// Registration URL used to encode the QR code.
// Development: http://localhost:5173/register
// Production:  VITE_PUBLIC_URL + /register
const REGISTRATION_URL = `${env.PUBLIC_URL}/register`;

export const QRCode = memo(function QRCode() {
  return (

    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      {/* Premium QR Card */}
      <motion.div
        className="group relative"
        variants={floatLoop}
        animate="float"
      >

        {/* Breathing glow behind card */}
        <motion.div
          className="pointer-events-none absolute -inset-5 rounded-2xl"
          variants={glowLoop}
          animate="glow"
        >
          <div className="h-full w-full rounded-2xl bg-gradient-radial from-blue-400/25 via-amber-400/12 to-transparent blur-2xl" />
        </motion.div>


        {/* Animated border */}
        <motion.div
          className="absolute -inset-[2px] rounded-2xl"
          animate={{
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="h-full w-full rounded-2xl border border-blue-400/50 shadow-[0_0_40px_rgba(59,130,246,0.25),inset_0_0_40px_rgba(59,130,246,0.12)]" />
        </motion.div>

        {/* Glass card - enlarged ~30% (h-52 w-52 -> h-[17rem] w-[17rem]) */}
        <div className="relative h-[17rem] w-[17rem] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Glass reflections */}
          <div className="pointer-events-none absolute -left-4 -top-4 h-20 w-20 rotate-12 rounded-full bg-gradient-to-b from-white/20 to-transparent blur-sm" />
          <div className="pointer-events-none absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-white/10 blur-[2px]" />
          <div className="pointer-events-none absolute right-8 top-6 h-6 w-6 rounded-full bg-white/10 blur-[2px]" />

          {/* Animated scan line */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 z-10 h-1.5"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(59,130,246,0.9), transparent)',
              boxShadow: '0 0 25px rgba(59,130,246,0.7)',
            }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />

          {/* Corner highlights */}
          <div className="pointer-events-none absolute left-2 top-2 z-20 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-amber-400/90" />
          <div className="pointer-events-none absolute right-2 top-2 z-20 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-amber-400/90" />
          <div className="pointer-events-none absolute bottom-2 left-2 z-20 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-amber-400/90" />
          <div className="pointer-events-none absolute bottom-2 right-2 z-20 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-amber-400/90" />

          {/* Real QR Code - SVG, high error correction, quiet zone, retina-ready */}
          <div className="flex h-full items-center justify-center p-6">
            <div className="relative h-full w-full">
              <QRCodeSVG
                value={REGISTRATION_URL}
                size={256}
                level="H"
                bgColor="transparent"
                fgColor="#ffffff"
                style={{
                  height: '100%',
                  width: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  padding: '0.5rem', // quiet zone
                }}
              />


              {/* Center logo */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-br from-amber-400 to-blue-500 shadow-lg shadow-amber-400/30">
                <div className="flex h-full items-center justify-center text-base font-black text-white">
                  L
                </div>
              </div>
            </div>
          </div>


          {/* Blue neon edge glow */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_40px_rgba(59,130,246,0.2)]" />
        </div>

        {/* Gold pulse ring */}
        <motion.div
          className="absolute -inset-4 rounded-2xl"
          animate={{
            boxShadow: [
              '0 0 25px rgba(251,191,36,0.1)',
              '0 0 50px rgba(251,191,36,0.3)',
              '0 0 25px rgba(251,191,36,0.1)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* SCAN TO PLAY text with arrow */}
      <div className="mt-5 flex items-center gap-2">
        <motion.span
          className="text-xl font-bold tracking-[0.2em] text-blue-300/90"
          variants={pulseLoop}
          animate="pulse"
          style={{ textShadow: '0 0 20px rgba(59,130,246,0.4)' }}
        >
          SCAN TO PLAY
        </motion.span>
        <motion.span
          className="text-2xl text-amber-400"
          animate={{ x: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          →
        </motion.span>
      </div>

      {/* Fallback: registration URL below QR */}
      <a
        href={REGISTRATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 max-w-[16rem] truncate text-xs font-medium tracking-wide text-blue-200/60 transition-colors hover:text-blue-200"
        title={REGISTRATION_URL}
      >
        {REGISTRATION_URL}
      </a>

    </motion.div>
  );
});


