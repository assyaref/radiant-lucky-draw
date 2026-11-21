/**
 * Spin Nama sounds.
 *
 * - Spin: a custom audio file looped while the wheel turns, or (default) a
 *   synthesized "tick" each time a segment passes the pointer.
 * - Win: one of the custom audio files picked at random each win, or a built-in
 *   synthesized sound (fanfare / chime / jackpot, or a random one of them).
 *
 * Browsers block audio until the page has had a click/tap/key press; until then
 * `locked` is true and the screen offers an "Aktifkan suara" button.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type BuiltInWinSound = 'fanfare' | 'chime' | 'jackpot';
export type WinSoundStyle = BuiltInWinSound | 'random';
const BUILT_IN_WIN: BuiltInWinSound[] = ['fanfare', 'chime', 'jackpot'];

export interface SpinSoundOptions {
  enabled: boolean;
  spinUrl?: string | null;
  /** Theme `winSoundUrl`: one or more sounds + built-in style, see encodeWinSound. */
  winUrl?: string | null;
}

/**
 * The win-sound setting is stored in the theme's single `winSoundUrl` text:
 * several links separated by "|" (one is picked at random per win), plus an
 * optional marker for the built-in style used when there are no files.
 * A plain single link (older setting) still works.
 */
const STYLE_MARK = 'https://builtin.sound/';
export const WIN_SOUND_MAX_LENGTH = 2000;

export interface WinSoundSetting {
  urls: string[];
  style: WinSoundStyle;
}

export function decodeWinSound(value?: string | null): WinSoundSetting {
  const out: WinSoundSetting = { urls: [], style: 'fanfare' };
  for (const part of (value ?? '').split('|')) {
    const v = part.trim();
    if (!v) continue;
    if (v.startsWith(STYLE_MARK)) {
      const st = v.slice(STYLE_MARK.length) as WinSoundStyle;
      if (st === 'random' || (BUILT_IN_WIN as string[]).includes(st)) out.style = st;
    } else if (!out.urls.includes(v)) out.urls.push(v);
  }
  return out;
}

export function encodeWinSound({ urls, style }: WinSoundSetting): string | null {
  const parts = Array.from(
    new Set(urls.map((u) => u.trim().replace(/\|/g, '%7C')).filter(Boolean)),
  );
  if (style !== 'fanfare') parts.push(STYLE_MARK + style);
  return parts.length ? parts.join('|') : null;
}

/** Random index in [0, n), avoiding `last` when there is a choice. */
function pickIndex(n: number, last: number): number {
  if (n <= 1) return 0;
  let i = Math.floor(Math.random() * (n - 1));
  if (i >= last && last >= 0) i++;
  return i;
}

class SpinAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private spinEl: HTMLAudioElement | null = null;
  private winEls: HTMLAudioElement[] = [];
  private spinUrl: string | null = null;
  private winKey = '';
  private lastWin = -1;
  private winStyle: WinSoundStyle = 'fanfare';
  private lastBuiltIn = -1;
  private lastTick = 0;
  private fadeTimer: number | null = null;
  private listeners = new Set<() => void>();

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      (window as any).AudioContext ?? ((window as any).webkitAudioContext as typeof AudioContext);
    if (!Ctor) return null;
    const ctx: AudioContext = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    ctx.onstatechange = () => this.emit();
    this.ctx = ctx;
    this.master = master;
    return ctx;
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
    for (const el of [this.spinEl, ...this.winEls]) {
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

  setSources(spinUrl: string | null, winUrls: string[] = [], winStyle: WinSoundStyle = 'fanfare') {
    this.winStyle = winStyle;
    if (spinUrl !== this.spinUrl) {
      this.spinEl?.pause();
      this.spinUrl = spinUrl;
      this.spinEl = spinUrl
        ? Object.assign(new Audio(spinUrl), { loop: true, preload: 'auto' })
        : null;
    }
    const key = winUrls.join('\n');
    if (key !== this.winKey) {
      this.winEls.forEach((el) => el.pause());
      this.winKey = key;
      this.lastWin = -1;
      this.winEls = winUrls.map((u) => Object.assign(new Audio(u), { preload: 'auto' }));
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
    if (this.winEls.length) {
      const i = pickIndex(this.winEls.length, this.lastWin);
      this.lastWin = i;
      const el = this.winEls[i];
      el.currentTime = 0;
      void el.play().catch(() => undefined);
      return;
    }
    this.playBuiltIn(this.winStyle);
  }

  /** Plays a built-in win sound; 'random' picks a different one each time. */
  playBuiltIn(style: WinSoundStyle) {
    let kind: BuiltInWinSound;
    if (style === 'random') {
      const i = pickIndex(BUILT_IN_WIN.length, this.lastBuiltIn);
      this.lastBuiltIn = i;
      kind = BUILT_IN_WIN[i];
    } else kind = style;
    if (kind === 'chime') this.chime();
    else if (kind === 'jackpot') this.jackpot();
    else this.fanfare();
  }

  private note(freq: number, at: number, dur: number, vol: number, type: OscillatorType) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain).connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /** Built-in: soft bell chimes descending then rising. */
  private chime() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t0 = ctx.currentTime + 0.02;
    [1567.98, 1318.51, 1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => {
      this.note(f, t0 + i * 0.14, 1.1, 0.22, 'sine');
      this.note(f * 2, t0 + i * 0.14, 0.5, 0.05, 'sine');
    });
    [523.25, 783.99, 1046.5].forEach((f) => this.note(f, t0 + 0.9, 1.8, 0.12, 'sine'));
  }

  /** Built-in: slot-machine coin burst ending in a big chord. */
  private jackpot() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t0 = ctx.currentTime + 0.02;
    for (let i = 0; i < 16; i++) {
      const f = 1200 + ((i * 7) % 5) * 260;
      this.note(f, t0 + i * 0.045, 0.09, 0.14, 'square');
    }
    const at = t0 + 0.8;
    [392, 493.88, 587.33, 783.99].forEach((f) => this.note(f, at, 1.4, 0.15, 'sawtooth'));
    this.note(196, at, 1.4, 0.22, 'triangle');
    for (let i = 0; i < 10; i++) this.note(2349 + i * 180, at + 0.1 + i * 0.06, 0.15, 0.05, 'sine');
  }

  /** Default win sound: bright arpeggio + held chord with a shimmer. */
  private fanfare() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.master) return;
    const t0 = ctx.currentTime + 0.02;
    const note = this.note.bind(this);
    // C5 E5 G5 C6 arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      note(f, t0 + i * 0.11, 0.35, 0.28, 'triangle'),
    );
    // Held major chord
    const chordAt = t0 + 0.48;
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => note(f, chordAt, 1.6, 0.16, 'sawtooth'));
    [261.63].forEach((f) => note(f, chordAt, 1.6, 0.2, 'triangle'));
    // Sparkle
    for (let i = 0; i < 8; i++) note(2093 + i * 220, chordAt + 0.1 + i * 0.07, 0.18, 0.06, 'sine');
  }

  stopAll() {
    this.spinEl?.pause();
    this.winEls.forEach((el) => el.pause());
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
export async function previewDefault(
  kind: 'spin' | 'win',
  winStyle: WinSoundStyle = 'fanfare',
): Promise<void> {
  const a = getSpinAudio();
  await a.unlock();
  if (kind === 'win') {
    a.playBuiltIn(winStyle);
    return;
  }
  a.setSources(null);
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
    const win = decodeWinSound(winUrl);
    engine.setSources(spinUrl ?? null, win.urls, win.style);
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
