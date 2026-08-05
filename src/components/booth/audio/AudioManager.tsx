import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { initSfx, playSfx, disposeSfx, type SfxName } from './SfxEngine';
import { VOICE_LINES, AMBIENT_ANNOUNCEMENTS, type VoiceLineName } from './VoiceLines';

interface AudioContextType {
  isMuted: boolean;
  volume: number;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  sfxEnabled: boolean;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  toggleMusic: () => void;
  toggleVoice: () => void;
  toggleSfx: () => void;
  playAnnouncement: (text: string, lang: 'en' | 'id') => void;
  playVoiceLine: (name: VoiceLineName, lang?: 'en' | 'id') => void;
  playSfx: (name: SfxName) => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: false,
  volume: 0.2,
  musicEnabled: true,
  voiceEnabled: true,
  sfxEnabled: true,
  toggleMute: () => {},
  setVolume: () => {},
  toggleMusic: () => {},
  toggleVoice: () => {},
  toggleSfx: () => {},
  playAnnouncement: () => {},
  playVoiceLine: () => {},
  playSfx: () => {},
});

export function useAudio() {
  return useContext(AudioContext);
}

// Generate looping ambient music using Web Audio API
function createAmbientMusic(ctx: AudioContext) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.2;
  masterGain.connect(ctx.destination);

  // Pad 1 - deep drone
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 55;
  const gain1 = ctx.createGain();
  gain1.gain.value = 0.08;
  const lfo1 = ctx.createOscillator();
  lfo1.frequency.value = 0.1;
  const lfo1Gain = ctx.createGain();
  lfo1Gain.gain.value = 0.03;
  lfo1.connect(lfo1Gain);
  lfo1Gain.connect(gain1.gain);
  osc1.connect(gain1);
  gain1.connect(masterGain);

  // Pad 2 - warm pad
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = 110;
  const gain2 = ctx.createGain();
  gain2.gain.value = 0.04;
  const lfo2 = ctx.createOscillator();
  lfo2.frequency.value = 0.15;
  const lfo2Gain = ctx.createGain();
  lfo2Gain.gain.value = 0.02;
  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(gain2.gain);
  const filter2 = ctx.createBiquadFilter();
  filter2.type = 'lowpass';
  filter2.frequency.value = 400;
  filter2.Q.value = 5;
  osc2.connect(filter2);
  filter2.connect(gain2);
  gain2.connect(masterGain);

  // Pad 3 - shimmer
  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.value = 220;
  const gain3 = ctx.createGain();
  gain3.gain.value = 0.02;
  const lfo3 = ctx.createOscillator();
  lfo3.frequency.value = 0.2;
  const lfo3Gain = ctx.createGain();
  lfo3Gain.gain.value = 0.015;
  lfo3.connect(lfo3Gain);
  lfo3Gain.connect(gain3.gain);
  const filter3 = ctx.createBiquadFilter();
  filter3.type = 'bandpass';
  filter3.frequency.value = 1000;
  filter3.Q.value = 1;
  osc3.connect(filter3);
  filter3.connect(gain3);
  gain3.connect(masterGain);

  // Pad 4 - sub bass
  const osc4 = ctx.createOscillator();
  osc4.type = 'sine';
  osc4.frequency.value = 27.5;
  const gain4 = ctx.createGain();
  gain4.gain.value = 0.06;
  const lfo4 = ctx.createOscillator();
  lfo4.frequency.value = 0.05;
  const lfo4Gain = ctx.createGain();
  lfo4Gain.gain.value = 0.02;
  lfo4.connect(lfo4Gain);
  lfo4Gain.connect(gain4.gain);
  osc4.connect(gain4);
  gain4.connect(masterGain);

  // Noise pad - subtle wind (loops)
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.015;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 200;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  // Rhythmic pulse - soft futuristic heartbeat (corporate ambient)
  const pulseOsc = ctx.createOscillator();
  pulseOsc.type = 'sine';
  pulseOsc.frequency.value = 82.5; // E2 - warm pulse
  const pulseGain = ctx.createGain();
  pulseGain.gain.value = 0;
  // LFO to create a slow rhythmic pulse
  const pulseLfo = ctx.createOscillator();
  pulseLfo.frequency.value = 0.5; // 2-second pulse cycle
  const pulseLfoGain = ctx.createGain();
  pulseLfoGain.gain.value = 0.05;
  pulseLfo.connect(pulseLfoGain);
  pulseLfoGain.connect(pulseGain.gain);
  const pulseFilter = ctx.createBiquadFilter();
  pulseFilter.type = 'lowpass';
  pulseFilter.frequency.value = 300;
  pulseOsc.connect(pulseFilter);
  pulseFilter.connect(pulseGain);
  pulseGain.connect(masterGain);

  // Sparkle arpeggio - subtle high shimmer notes (futuristic)
  const arpOsc = ctx.createOscillator();
  arpOsc.type = 'triangle';
  arpOsc.frequency.value = 440;
  const arpGain = ctx.createGain();
  arpGain.gain.value = 0;
  const arpLfo = ctx.createOscillator();
  arpLfo.frequency.value = 0.25; // 4-second arpeggio cycle
  const arpLfoGain = ctx.createGain();
  arpLfoGain.gain.value = 0.012;
  arpLfo.connect(arpLfoGain);
  arpLfoGain.connect(arpGain.gain);
  const arpFilter = ctx.createBiquadFilter();
  arpFilter.type = 'bandpass';
  arpFilter.frequency.value = 2000;
  arpFilter.Q.value = 2;
  arpOsc.connect(arpFilter);
  arpFilter.connect(arpGain);
  arpGain.connect(masterGain);

  // All oscillators loop indefinitely (start once, run forever)
  osc1.start();
  osc2.start();
  osc3.start();
  osc4.start();
  noise.start();
  pulseOsc.start();
  pulseLfo.start();
  arpOsc.start();
  arpLfo.start();

  return {
    masterGain,
    oscillators: [osc1, osc2, osc3, osc4, noise, pulseOsc, pulseLfo, arpOsc, arpLfo],
  };
}

// Text-to-Speech announcement
function speakText(text: string, lang: 'en' | 'id', volume: number) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'id' ? 'id-ID' : 'en-US';
  utterance.volume = volume;
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  // Find a good voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) =>
      (v.lang.startsWith(lang === 'id' ? 'id' : 'en') && v.name.includes('Google')) ||
      v.name.includes('Microsoft'),
  );
  if (preferredVoice) utterance.voice = preferredVoice;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.2);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const announceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);

  // Initialize audio on first user interaction (lazy load)
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    // Initialize SFX engine with the same context
    initSfx(ctx);
    if (musicEnabled) {
      const { masterGain } = createAmbientMusic(ctx);
      masterGainRef.current = masterGain;
      if (isMuted) masterGain.gain.value = 0;
    }
  }, [musicEnabled, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = prev ? volume : 0;
      }
      return !prev;
    });
  }, [volume]);

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      if (masterGainRef.current && !isMuted) {
        masterGainRef.current.gain.value = v;
      }
    },
    [isMuted],
  );

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = next && !isMuted ? volume : 0;
      }
      return next;
    });
  }, [isMuted, volume]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return !prev;
    });
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => !prev);
  }, []);

  const playAnnouncement = useCallback(
    (text: string, lang: 'en' | 'id') => {
      if (isMuted || !voiceEnabled) return;
      const utterance = speakText(text, lang, volume * 0.8);
      if (utterance) {
        announceQueueRef.current.push(utterance);
      }
    },
    [isMuted, voiceEnabled, volume],
  );

  const playVoiceLine = useCallback(
    (name: VoiceLineName, lang: 'en' | 'id' = 'en') => {
      const line = VOICE_LINES[name];
      if (!line) return;
      playAnnouncement(line[lang], lang);
    },
    [playAnnouncement],
  );

  const playSfxSound = useCallback(
    (name: SfxName) => {
      if (isMuted || !sfxEnabled) return;
      playSfx(name, volume);
    },
    [isMuted, sfxEnabled, volume],
  );

  // Auto-announcement timer (ambient voice prompts)
  useEffect(() => {
    const interval = setInterval(
      () => {
        const useId = Math.random() > 0.5;
        const pool = AMBIENT_ANNOUNCEMENTS;
        const line = pool[Math.floor(Math.random() * pool.length)];
        playAnnouncement(useId ? line.id : line.en, useId ? 'id' : 'en');
      },
      20000 + Math.random() * 10000,
    );
    return () => clearInterval(interval);
  }, [playAnnouncement]);

  // Init audio on any user interaction
  useEffect(() => {
    const handler = () => initAudio();
    document.addEventListener('click', handler, { once: true });
    document.addEventListener('touchstart', handler, { once: true });
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [initAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposeSfx();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        volume,
        musicEnabled,
        voiceEnabled,
        sfxEnabled,
        toggleMute,
        setVolume,
        toggleMusic,
        toggleVoice,
        toggleSfx,
        playAnnouncement,
        playVoiceLine,
        playSfx: playSfxSound,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function AudioControls() {
  const {
    isMuted,
    volume,
    musicEnabled,
    voiceEnabled,
    sfxEnabled,
    toggleMute,
    setVolume,
    toggleMusic,
    toggleVoice,
    toggleSfx,
    playSfx,
  } = useAudio();
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      {/* Mute toggle */}
      <button
        onClick={() => {
          toggleMute();
          playSfx('buttonClick');
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:text-white/80"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        )}
      </button>

      {/* Settings panel toggle */}
      <button
        onClick={() => {
          setShowPanel(!showPanel);
          playSfx('buttonClick');
        }}
        className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-[10px] font-bold tracking-wider text-white/40 transition-all hover:border-white/20 hover:text-white/70"
        title="Audio settings"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        {Math.round(volume * 100)}%
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[#0b1426]/95 p-3 backdrop-blur-xl shadow-xl">
          {/* Volume slider */}
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[9px] font-bold tracking-wider text-white/40">
              <span>VOLUME</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-400"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-1.5">
            <ToggleRow label="Music" enabled={musicEnabled} onToggle={toggleMusic} />
            <ToggleRow label="Voice" enabled={voiceEnabled} onToggle={toggleVoice} />
            <ToggleRow label="Sound FX" enabled={sfxEnabled} onToggle={toggleSfx} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
    >
      <span className="text-[10px] font-bold tracking-wider text-white/50">{label}</span>
      <span
        className={`relative h-4 w-8 rounded-full transition-colors ${
          enabled ? 'bg-amber-400/70' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            enabled ? 'left-4.5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}
