/**
 * Asset Storage Service
 *
 * Stores event branding files (logo images, spin/win sounds) in the public
 * Supabase Storage bucket `branding` and returns their public URL.
 * Files arrive as data URLs from the operator UI.
 */

import { ValidationError } from '../utils';

export type AssetKind = 'logo' | 'sound';

const BUCKET = 'branding';

const ALLOWED: Record<AssetKind, { types: Record<string, string>; maxBytes: number; label: string }> = {
  logo: {
    types: {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    },
    maxBytes: 2 * 1024 * 1024,
    label: 'Logo (PNG/JPG/WEBP/GIF, maks 2 MB)',
  },
  sound: {
    types: {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/wave': 'wav',
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/aac': 'aac',
    },
    maxBytes: 5 * 1024 * 1024,
    label: 'Suara (MP3/WAV/OGG/M4A, maks 5 MB)',
  },
};

function envVar(name: string): string | undefined {
  const g = globalThis as any;
  return g.Deno?.env?.get?.(name) ?? (typeof process !== 'undefined' ? process.env[name] : undefined);
}

function decodeBase64(b64: string): Uint8Array {
  const g = globalThis as any;
  if (typeof g.Buffer !== 'undefined') return new Uint8Array(g.Buffer.from(b64, 'base64'));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export class AssetStorageService {
  async upload(kind: AssetKind, dataUrl: string): Promise<{ url: string; contentType: string; size: number }> {
    const rule = ALLOWED[kind];
    const m = /^data:([\w.+-]+\/[\w.+-]+);base64,(.*)$/s.exec(dataUrl);
    if (!m) throw new ValidationError('Format file tidak valid');
    const contentType = m[1].toLowerCase();
    const ext = rule.types[contentType];
    if (!ext) throw new ValidationError(`Jenis file tidak didukung. ${rule.label}`);
    const bytes = decodeBase64(m[2]);
    if (bytes.length === 0) throw new ValidationError('File kosong');
    if (bytes.length > rule.maxBytes) throw new ValidationError(`File terlalu besar. ${rule.label}`);

    const base = envVar('SUPABASE_URL');
    const key = envVar('SUPABASE_SERVICE_ROLE_KEY');
    if (!base || !key) throw new Error('Penyimpanan file belum dikonfigurasi');

    const path = `${kind}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'x-upsert': 'false',
      },
      body: bytes,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Upload gagal (${res.status}) ${text.slice(0, 200)}`);
    }
    return {
      url: `${base}/storage/v1/object/public/${BUCKET}/${path}`,
      contentType,
      size: bytes.length,
    };
  }
}
