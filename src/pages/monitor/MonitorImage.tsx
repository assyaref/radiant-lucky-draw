/**
 * MonitorImage — memory-safe, self-healing image for the long-running Monitor.
 *
 * The Monitor runs for hours on a TV/PC and accumulates winners. Two things
 * used to make the center logo and winner photos disappear:
 *  1. Full-size images: every 480×480 webcam photo (and a 1536×1024 logo) was
 *     decoded at full resolution even when shown at 56–144 px. GPU/texture
 *     memory filled up and the browser stopped painting images.
 *  2. `onError → display:none`: one failed decode hid the <img> for good.
 *
 * MonitorImage downsamples data-URL photos to the size actually displayed
 * (cached, so list refreshes reuse the same small bitmap), and on error it
 * retries a few times instead of hiding itself permanently.
 */

import { useEffect, useState, type ReactNode } from 'react';

// ─── Downsampling cache ──────────────────────────────────────────────

const MAX_CACHE = 200;
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function remember(key: string, value: string): void {
  cache.set(key, value);
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

/** Downscale a data: URL image so its longest side is `size` px (device-pixel aware). */
export function downscaleImage(src: string, size: number): Promise<string> {
  if (!src.startsWith('data:image/')) return Promise.resolve(src); // external URLs: leave as-is
  const px = Math.round(size * Math.min(window.devicePixelRatio || 1, 2));
  const key = `${px}:${src}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(key);
  if (inflight) return inflight;

  const job = new Promise<string>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const scale = Math.min(1, px / Math.max(img.naturalWidth, img.naturalHeight));
        if (scale >= 1) return resolve(src);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(src);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL('image/jpeg', 0.85);
        canvas.width = canvas.height = 0; // release backing store
        resolve(out);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  }).then((out) => {
    pending.delete(key);
    remember(key, out);
    return out;
  });
  pending.set(key, job);
  return job;
}

function useDownscaled(src: string | null | undefined, size?: number): string | null {
  const key = src && size ? `${size}:${src.length}:${src.slice(-64)}` : src ?? null;
  const [out, setOut] = useState<string | null>(() => {
    if (!src) return null;
    if (!size || !src.startsWith('data:image/')) return src;
    const px = Math.round(size * Math.min(window.devicePixelRatio || 1, 2));
    return cache.get(`${px}:${src}`) ?? null;
  });

  useEffect(() => {
    let alive = true;
    if (!src) {
      setOut(null);
      return;
    }
    if (!size) {
      setOut(src);
      return;
    }
    downscaleImage(src, size).then((v) => alive && setOut(v));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return out;
}

// ─── Component ───────────────────────────────────────────────────────

const MAX_RETRIES = 3;

export function MonitorImage({
  src,
  alt,
  className,
  displaySize,
  fallback = null,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Rendered size in CSS px (longest side). Data-URL images are downsampled to it. */
  displaySize?: number;
  /** Shown while loading/after repeated failures. */
  fallback?: ReactNode;
}) {
  const shown = useDownscaled(src, displaySize);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // New image → fresh state.
  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [shown]);

  // Self-heal: after giving up, try again later (memory pressure is usually transient).
  useEffect(() => {
    if (!failed) return;
    const t = window.setTimeout(() => {
      setAttempt(0);
      setFailed(false);
    }, 30000);
    return () => window.clearTimeout(t);
  }, [failed]);

  if (!shown || failed) return <>{fallback}</>;

  return (
    <img
      key={attempt}
      src={shown}
      alt={alt}
      className={className}
      decoding="async"
      draggable={false}
      onError={() => {
        if (attempt + 1 >= MAX_RETRIES) {
          setFailed(true);
          return;
        }
        window.setTimeout(() => setAttempt((a) => a + 1), 1500 * (attempt + 1));
      }}
    />
  );
}
