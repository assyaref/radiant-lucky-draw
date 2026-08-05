/**
 * SfxEngine - Synthesized Sound Effects using Web Audio API
 * No external audio files required - fully browser compatible.
 * All sounds are generated procedurally for instant, lightweight playback.
 */

export type SfxName =
  | 'countdown'
  | 'machineSpin'
  | 'buttonClick'
  | 'winnerReveal'
  | 'confetti'
  | 'fireworks'
  | 'prizePop';

type SfxContext = {
  ctx: AudioContext;
  master: GainNode;
};

let shared: SfxContext | null = null;

/**
 * Lazily create a shared AudioContext for SFX.
 * Must be called after a user gesture to satisfy autoplay policies.
 */
export function initSfx(ctx?: AudioContext): SfxContext {
  if (shared) return shared;
  const audioCtx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
  const master = audioCtx.createGain();
  master.gain.value = 0.6;
  master.connect(audioCtx.destination);
  shared = { ctx: audioCtx, master };
  return shared;
}

/** Reset the shared context (e.g. on unmount). */
export function disposeSfx() {
  if (shared) {
    try {
      shared.ctx.close();
    } catch {
      /* noop */
    }
    shared = null;
  }
}

/** Create a short envelope gain node. */
function env(ctx: AudioContext, peak: number, attack: number, decay: number): GainNode {
  const g = ctx.createGain();
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  return g;
}

/** Play a tone with frequency sweep. */
function tone(
  s: SfxContext,
  freqStart: number,
  freqEnd: number,
  duration: number,
  peak = 0.3,
  type: OscillatorType = 'sine',
  delay = 0,
) {
  const { ctx, master } = s;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + duration);
  const g = env(ctx, peak, 0.01, duration);
  osc.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/** Play a noise burst (for confetti / fireworks). */
function noiseBurst(s: SfxContext, duration: number, peak = 0.2, filterFreq = 4000, delay = 0) {
  const { ctx, master } = s;
  const now = ctx.currentTime + delay;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const g = env(ctx, peak, 0.005, duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(now);
}

/** Play a specific sound effect. */
export function playSfx(name: SfxName, volume = 1) {
  if (!shared) return;
  const s = shared;
  const v = Math.max(0, Math.min(1, volume));

  switch (name) {
    case 'buttonClick':
      tone(s, 600, 900, 0.08, 0.25 * v, 'square');
      tone(s, 1200, 1600, 0.05, 0.15 * v, 'sine', 0.02);
      break;

    case 'countdown':
      // Short beep - classic countdown tick
      tone(s, 880, 880, 0.12, 0.3 * v, 'sine');
      break;

    case 'machineSpin':
      // Rapid descending sweep - machine rotating
      tone(s, 400, 80, 0.6, 0.25 * v, 'sawtooth');
      tone(s, 300, 60, 0.6, 0.15 * v, 'square', 0.05);
      // Add a wobble
      for (let i = 0; i < 6; i++) {
        tone(s, 200 + i * 40, 120 + i * 20, 0.15, 0.08 * v, 'triangle', i * 0.1);
      }
      break;

    case 'winnerReveal':
      // Triumphant ascending arpeggio
      tone(s, 523, 523, 0.2, 0.3 * v, 'triangle');
      tone(s, 659, 659, 0.2, 0.3 * v, 'triangle', 0.12);
      tone(s, 784, 784, 0.25, 0.3 * v, 'triangle', 0.24);
      tone(s, 1046, 1046, 0.5, 0.35 * v, 'triangle', 0.36);
      tone(s, 1568, 1568, 0.6, 0.2 * v, 'sine', 0.5);
      break;

    case 'confetti':
      // Sparkly high-frequency pops
      for (let i = 0; i < 12; i++) {
        tone(
          s,
          1500 + Math.random() * 2000,
          800 + Math.random() * 1000,
          0.08,
          0.12 * v,
          'sine',
          i * 0.04,
        );
      }
      noiseBurst(s, 0.4, 0.1 * v, 6000);
      break;

    case 'fireworks':
      // Launch whistle + explosion
      tone(s, 200, 1200, 0.4, 0.2 * v, 'sine');
      noiseBurst(s, 0.6, 0.3 * v, 800, 0.4);
      noiseBurst(s, 0.8, 0.2 * v, 3000, 0.45);
      for (let i = 0; i < 8; i++) {
        tone(
          s,
          400 + Math.random() * 800,
          200 + Math.random() * 400,
          0.3,
          0.1 * v,
          'triangle',
          0.45 + i * 0.05,
        );
      }
      break;

    case 'prizePop':
      // Playful pop
      tone(s, 300, 600, 0.1, 0.3 * v, 'sine');
      tone(s, 600, 1200, 0.15, 0.25 * v, 'sine', 0.08);
      tone(s, 1200, 1800, 0.2, 0.15 * v, 'sine', 0.16);
      break;
  }
}
