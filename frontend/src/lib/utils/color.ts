/**
 * Normalise a hex color string: strip '#', expand 3-char shorthand to 6-char.
 * Returns null if the result is not a valid 6-character hex string.
 */
function normaliseHex(hex: string | undefined | null): string | null {
  if (!hex) return null;
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return h.toLowerCase();
}

/**
 * Blends a hex colour with white at the given ratio (0 = full white, 1 = full colour).
 * Returns a 6-char hex string (no #).
 */
function blendWithWhite(h: string, ratio: number): string {
  const r = Math.round(Number.parseInt(h.slice(0, 2), 16) * ratio + 255 * (1 - ratio));
  const g = Math.round(Number.parseInt(h.slice(2, 4), 16) * ratio + 255 * (1 - ratio));
  const b = Math.round(Number.parseInt(h.slice(4, 6), 16) * ratio + 255 * (1 - ratio));
  return [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns a CSS linear-gradient string for a given hex colour.
 * The lighter stop is computed in JS (no color-mix) so html2canvas can parse it.
 * Falls back to a neutral gray gradient when hex is missing or malformed.
 */
export function hexToGradient(hex: string | undefined | null): string {
  const h = normaliseHex(hex);
  if (!h) return 'linear-gradient(135deg, #f0f0f0, #e0e0e0)';
  const lighter = blendWithWhite(h, 0.6);
  return `linear-gradient(135deg, #${h}, #${lighter})`;
}

/**
 * W3C relative-luminance check.  Returns true when the colour is dark
 * (luminance < 0.179), meaning white text should be used on top.
 * Returns true (safe default) when hex is missing or unparseable.
 */
export function isDarkColor(hex: string | undefined | null): boolean {
  const h = normaliseHex(hex);
  if (!h) return true;

  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance < 0.179;
}
