/**
 * VoiceLines - Predefined voice announcements for the exhibition booth.
 * Uses the browser's SpeechSynthesis API (no external audio files).
 */

export type VoiceLineName =
  | 'welcome'
  | 'scanQr'
  | 'winnerAnnouncement'
  | 'nextDraw'
  | 'systemReady';

export interface VoiceLine {
  en: string;
  id: string;
}

export const VOICE_LINES: Record<VoiceLineName, VoiceLine> = {
  welcome: {
    en: 'Welcome to Radiant Group Lucky Draw.',
    id: 'Selamat datang di Undian Berhadiah Radiant Group.',
  },
  scanQr: {
    en: 'Scan the QR code to participate and win exciting prizes.',
    id: 'Scan Kode QR untuk berpartisipasi dan menangkan hadiah menarik.',
  },
  winnerAnnouncement: {
    en: 'Congratulations to our lucky winner!',
    id: 'Selamat kepada pemenang beruntung kita!',
  },
  nextDraw: {
    en: 'The next Lucky Draw starts in five minutes.',
    id: 'Undian Berhadiah berikutnya dimulai dalam lima menit.',
  },
  systemReady: {
    en: 'System ready. Good luck everyone.',
    id: 'Sistem siap. Semoga beruntung semuanya.',
  },
};

/** Ambient announcement pool for periodic voice prompts. */
export const AMBIENT_ANNOUNCEMENTS: VoiceLine[] = [
  { en: 'Step right up and try your luck.', id: 'Silakan mencoba keberuntungan Anda.' },
  { en: 'Amazing prizes to be won today.', id: 'Hadiah luar biasa menanti Anda hari ini.' },
  { en: "Don't miss your chance to win big.", id: 'Jangan lewatkan kesempatan memenangkan hadiah besar.' },
  { en: 'Grand Prize is waiting for you.', id: 'Hadiah Utama menanti Anda.' },
  { en: 'Good luck.', id: 'Semoga beruntung.' },
];
