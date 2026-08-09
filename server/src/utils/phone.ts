/**
 * Normalize an Indonesian WhatsApp phone number to standard 62 prefix.
 *
 * Accepts: 082167472765, 6282167472765, +6282167472765,
 *          0821-6747-2765, 0821 6747 2765, (0821) 6747 2765
 * Returns: 6282167472765, or empty string if invalid.
 */
export function normalizeWhatsApp(phone: string): string {
  if (!phone) return '';

  // Remove whitespace, hyphens, and parentheses
  let normalized = phone.replace(/[\s\-()]/g, '');

  // Strip leading '+'
  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1);
  }

  // Convert leading '0' to '62' (Indonesian format)
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.slice(1);
  }

  // Validate: only digits allowed
  if (!/^\d+$/.test(normalized)) return '';

  // Indonesian numbers are typically 9-14 digits after country code
  if (normalized.length < 8 || normalized.length > 16) return '';

  return normalized;
}
