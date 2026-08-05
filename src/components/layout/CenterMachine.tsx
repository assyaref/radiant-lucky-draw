import { memo } from 'react';
import { motion } from 'framer-motion';
import { zIndex } from '@design-system/index';
import { LuckyMachine, Countdown, HeroTitle, QRCode } from '@components/booth';

/**
 * Center panel — Lucky Draw Machine with glass effect, animated balls, glow, and START button.
 */
export const CenterMachine = memo(function CenterMachine() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-2"
      style={{ zIndex: zIndex.content }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
  );
});
