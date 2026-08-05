// ============================================================
// Booth QR Code
//
// Generates a QR code pointing to the Public Booth page.
// Used by admins to print/display the booth QR for participants
// to scan and register.
// ============================================================

import { memo } from 'react';
import QRCodeSVG from 'react-qr-code';
import { env } from '@config/env';

// Public booth URL used to encode the QR code.
// Resolved from env.PUBLIC_URL (development or production).
const BOOTH_URL = `${env.PUBLIC_URL}/booth`;

interface BoothQRCodeProps {
  size?: number;
  fgColor?: string;
  bgColor?: string;
  showUrl?: boolean;
}

export const BoothQRCode = memo(function BoothQRCode({
  size = 200,
  fgColor = '#ffffff',
  bgColor = 'transparent',
  showUrl = true,
}: BoothQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <QRCodeSVG
          value={BOOTH_URL}
          size={size}
          level="H"
          bgColor={bgColor}
          fgColor={fgColor}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
        />
      </div>
      {showUrl && (
        <a
          href={BOOTH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[16rem] truncate text-xs font-medium tracking-wide text-primary-400/70 transition-colors hover:text-primary-400"
          title={BOOTH_URL}
        >
          {BOOTH_URL}
        </a>
      )}
    </div>
  );
});

export default BoothQRCode;
