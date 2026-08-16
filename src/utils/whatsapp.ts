/**
 * WhatsApp phone number display + deep-link helpers.
 *
 * Stored values are normalized digits (e.g. "6282167472765"), but these
 * helpers also tolerate "+62", leading "0", spaces and punctuation.
 */

/** Normalize to digits only (strip +, spaces, dashes, parentheses) and force 62 prefix. */
function normalizeDigits(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!digits.startsWith('62') && digits.length > 0 && digits.length <= 12) {
    digits = `62${digits}`;
  }
  return digits;
}

/**
 * Format a stored WhatsApp number into a readable display form.
 * "6282167472765" -> "+62 821-6747-2765"
 * null / undefined / empty -> "-"
 */
export function formatWhatsApp(phone?: string | null): string {
  if (!phone) return '-';
  const digits = normalizeDigits(phone);
  if (!digits) return phone;
  const rest = digits.startsWith('62') ? digits.slice(2) : digits;
  if (!rest) return `+${digits}`;

  const parts: string[] = [rest.slice(0, 3)];
  let i = 3;
  while (i < rest.length) {
    parts.push(rest.slice(i, i + 4));
    i += 4;
  }
  return `+62 ${parts.join('-')}`;
}

/** Build a wa.me deep link from the normalized digits (no punctuation in the URL). */
export function toWhatsAppLink(phone?: string | null): string | null {
  const digits = normalizeDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
