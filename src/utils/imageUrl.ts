/**
 * normalizeImageUrl - Google Drive & generic image URL normalizer.
 *
 * Rules:
 * - drive.google.com/file/d/{ID}/view → https://drive.google.com/thumbnail?id={ID}&sz=w1000
 * - drive.google.com/uc?id={ID}       → https://drive.google.com/thumbnail?id={ID}&sz=w1000
 * - Already thumbnail?id=             → leave as-is
 * - data:image/...                     → leave as-is
 * - Other URLs                         → leave as-is
 * - null/undefined/empty               → return empty string
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || url.trim() === '') return '';
  const u = url.trim();
  if (u.startsWith('data:')) return u;
  if (u.includes('/thumbnail?') || u.includes('/thumbnail?id=')) return u;

  const fileMatch = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\//);
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;

  const ucMatch = u.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1000`;

  return u;
}
