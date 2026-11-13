/**
 * Name list helpers shared by Spin Nama and the Monitor wheel.
 */

/** Max segments drawn on the wheel; longer lists are sampled evenly. */
export const WHEEL_MAX_SEGMENTS = 60;

/** Trim, collapse whitespace, drop empties and case-insensitive duplicates (first wins). */
export function cleanNames(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const name = String(raw ?? '').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase('id-ID');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Evenly spaced sample so very long lists still fit on the wheel. */
export function sampleForWheel(names: string[], max = WHEEL_MAX_SEGMENTS): string[] {
  if (names.length <= max) return [...names];
  const step = names.length / max;
  return Array.from({ length: max }, (_, i) => names[Math.floor(i * step)]);
}
