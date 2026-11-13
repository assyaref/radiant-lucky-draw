/**
 * Spin Nama sounds.
 *
 * - Spin: a custom audio file looped while the wheel turns, or (default) a
 *   synthesized "tick" each time a segment passes the pointer.
 * - Win: a custom audio file played once, or (default) a synthesized fanfare.
 *
 * Browsers block audio until the page has had a click/tap/key press; until then
 * `locked` is true and the screen offers an "Aktifkan suara" button.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpinSoundOptions {
  enabled: boolean;
  spinUrl?: string | null;
  winUrl?: string | null;
}

class SpinAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private spinEl: HTMLAudioElement | null = null;
  private winEl: HTMLAudioElement | null = null;
  private spinUrl: string | null = null;
  private winUrl: string | null = null;
  private lastTick = 0;
  private fadeTimer: number | null = null;
  private listeners = new Set<() => void>();

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      (window as any).AudioContext ?? ((window as any).webkitAudioContext as typeof AudioContext);
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.ctx.onstatechange = () => this.emit();
    return this.ctx;
  }

  get locked(): boolean {
    return !this.ctx || this.ctx.state !== 'running';
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  /** Must run inside a user gesture the first time. */
  async unlock(): Promise<void> {
    const ctx = this.ensure();
    try {
      await ctx?.resume();
    } catch {
      /* ignore */
    }
    // Prime the media elements too (iOS/Safari needs a gesture per element).
    for (const el of [this.spinEl, this.winEl]) {
      if (!el) continue;
      try {
        el.muted = true;
        await el.play();
        el.pause();
        el.currentTime = 0;
      } catch {
        /* ignore */
      } finally {
        el.muted = false;
      }
    }
    this.emit();
  }

  setSources(spinUrl: string | null, winUrl: string | null) {
    if (spinUrl !== this.spinUrl) {
      this.spinEl?.pause();
      this.spinUrl = spinUrl;
      this.spinEl = spinUrl ? Object.assign(new Audio(spinUrl), { loop: true, preload: 'auto' }) : null;
    }
    if (winUrl !== this.winUrl) {
      this.winEl?.pause();
      this.winUrl = winUrl;
      this.winEl = winUrl ? Object.assign(new Audio(winUrl), { preload: 'auto' }) : null;
    }
  }

  startSpin() {
    this.ensure();
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
    if (this.spinEl) {
      this.spinEl.volume = 1;
      this.spinEl.currentTime = 0;
      void this.spinEl.play().catch(() => undefined);
    }
  }

  /** Segment passed the pointer (default spin sound only). */
  tick() {
    if (this.spinEl) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.master) return;
    const now = ctx.currentTime;
    if (now - this.lastTick < 0.035) return;
    this.lastTick = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  stopSpin(fadeMs = 700) {
    const el = this.spinEl;
    if (!el || el.paused) return;
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    const steps = 14;
    let i = 0;
    const start = el.volume;
    this.fadeTimer = window.setInterval(() => {
      i++;
      el.volume = Math.max(0, start * (1 - i / steps));
      if (i >= steps) {
        if (this.fadeTimer) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      }
    }, fadeMs / steps);
  }

  win() {
    if (this.winEl) {
      this.winEl.currentTime = 0;
      void this.winEl.play().catch(() => undefined);
      return;
    }
    this.fanfare();
  }

  /** Default win sound: bright arpeggio + held chord with a shimmer. */
  private fanfare() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.master) return;
    const t0 = ctx.currentTime + 0.02;
    const note = (freq: number, at: number, dur: number, vol: number, type: OscillatorType) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(vol, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(this.master!);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    };
    // C5 E5 G5 C6 arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, t0 + i * 0.11, 0.35, 0.28, 'triangle'));
    // Held major chord
    const chordAt = t0 + 0.48;
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => note(f, chordAt, 1.6, 0.16, 'sawtooth'));
    [261.63].forEach((f) => note(f, chordAt, 1.6, 0.2, 'triangle'));
    // Sparkle
    for (let i = 0; i < 8; i++) note(2093 + i * 220, chordAt + 0.1 + i * 0.07, 0.18, 0.06, 'sine');
  }

  stopAll() {
    this.spinEl?.pause();
    this.winEl?.pause();
  }
}

/** One engine per page so several components share the unlocked context. */
let shared: SpinAudioEngine | null = null;
export function getSpinAudio(): SpinAudioEngine {
  if (!shared) shared = new SpinAudioEngine();
  return shared;
}

/** Plays a sound file once (operator "Tes" button). */
export function previewSound(url: string): HTMLAudioElement {
  const el = new Audio(url);
  void el.play().catch(() => undefined);
  return el;
}

/** Plays the built-in sounds (operator "Tes" button without a custom file). */
export async function previewDefault(kind: 'spin' | 'win'): Promise<void> {
  const a = getSpinAudio();
  await a.unlock();
  if (kind === 'win') {
    a.setSources(null, null);
    a.win();
    return;
  }
  a.setSources(null, null);
  // ~1.6 s of ticks slowing down
  let delay = 40;
  let t = 0;
  for (let i = 0; i < 22; i++) {
    t += delay;
    window.setTimeout(() => a.tick(), t);
    delay *= 1.12;
  }
}

export function useSpinSound({ enabled, spinUrl, winUrl }: SpinSoundOptions) {
  const engine = getSpinAudio();
  const [locked, setLocked] = useState(engine.locked);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => engine.onChange(() => setLocked(engine.locked)), [engine]);

  useEffect(() => {
    engine.setSources(spinUrl ?? null, winUrl ?? null);
  }, [engine, spinUrl, winUrl]);

  // Any interaction with the page unlocks audio.
  useEffect(() => {
    if (!enabled) return;
    const unlock = () => void engine.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [engine, enabled]);

  useEffect(() => {
    if (!enabled) engine.stopAll();
  }, [engine, enabled]);

  return {
    locked,
    unlock: useCallback(() => engine.unlock(), [engine]),
    spinStart: useCallback(() => enabledRef.current && engine.startSpin(), [engine]),
    tick: useCallback(() => enabledRef.current && engine.tick(), [engine]),
    spinEnd: useCallback(() => {
      engine.stopSpin();
      if (enabledRef.current) engine.win();
    }, [engine]),
  };
}
