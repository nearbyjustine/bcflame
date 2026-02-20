import { describe, it, expect } from 'vitest';
import { hexToGradient, isDarkColor } from './color';

// ---------------------------------------------------------------------------
// hexToGradient
// ---------------------------------------------------------------------------
describe('hexToGradient', () => {
  it('returns a linear-gradient string for a valid 6-char hex', () => {
    const result = hexToGradient('#6B3FA0');
    expect(result).toMatch(/^linear-gradient\(135deg,/);
    expect(result).toContain('#6b3fa0');
    // Lighter stop is computed in JS (no color-mix) so html2canvas can render it
    expect(result).toMatch(/#[0-9a-f]{6}/);
  });

  it('expands 3-char shorthand hex', () => {
    const result = hexToGradient('#fff');
    expect(result).toContain('#ffffff');
  });

  it('works without the # prefix', () => {
    const result = hexToGradient('FF6B35');
    expect(result).toContain('#ff6b35');
  });

  // Seed colours
  const seedColors = ['#FFFFFF', '#000000', '#228B22', '#6B3FA0', '#FF6B35', '#0077B6', '#EEEEEE', '#2D5016'];
  seedColors.forEach((color) => {
    it(`produces a gradient for seed color ${color}`, () => {
      const result = hexToGradient(color);
      expect(result).toMatch(/^linear-gradient/);
      expect(result).toContain(color.toLowerCase());
    });
  });

  // Fallback cases
  it('returns neutral gray gradient for undefined', () => {
    expect(hexToGradient(undefined)).toBe('linear-gradient(135deg, #f0f0f0, #e0e0e0)');
  });

  it('returns neutral gray gradient for null', () => {
    expect(hexToGradient(null)).toBe('linear-gradient(135deg, #f0f0f0, #e0e0e0)');
  });

  it('returns neutral gray gradient for empty string', () => {
    expect(hexToGradient('')).toBe('linear-gradient(135deg, #f0f0f0, #e0e0e0)');
  });

  it('returns neutral gray gradient for malformed string', () => {
    expect(hexToGradient('notacolor')).toBe('linear-gradient(135deg, #f0f0f0, #e0e0e0)');
  });
});

// ---------------------------------------------------------------------------
// isDarkColor
// ---------------------------------------------------------------------------
describe('isDarkColor', () => {
  it('returns true for black (#000000)', () => {
    expect(isDarkColor('#000000')).toBe(true);
  });

  it('returns false for white (#FFFFFF)', () => {
    expect(isDarkColor('#FFFFFF')).toBe(false);
  });

  it('returns false for light gray (#EEEEEE)', () => {
    expect(isDarkColor('#EEEEEE')).toBe(false);
  });

  it('returns true for dark green (#2D5016)', () => {
    expect(isDarkColor('#2D5016')).toBe(true);
  });

  it('returns true for purple (#6B3FA0)', () => {
    expect(isDarkColor('#6B3FA0')).toBe(true);
  });

  it('returns false for medium green (#228B22)', () => {
    // #228B22 relative luminance ≈ 0.196 — above 0.179
    expect(isDarkColor('#228B22')).toBe(false);
  });

  it('returns true for dark blue (#0077B6)', () => {
    expect(isDarkColor('#0077B6')).toBe(true);
  });

  it('returns false for orange (#FF6B35)', () => {
    // Orange relative luminance ≈ 0.33 — above 0.179
    expect(isDarkColor('#FF6B35')).toBe(false);
  });

  // Fallback cases – must return true (safe default), never throw
  it('returns true for undefined', () => {
    expect(isDarkColor(undefined)).toBe(true);
  });

  it('returns true for null', () => {
    expect(isDarkColor(null)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isDarkColor('')).toBe(true);
  });

  it('returns true for malformed string', () => {
    expect(isDarkColor('notacolor')).toBe(true);
  });

  // 3-char shorthand
  it('handles 3-char shorthand #fff as white (not dark)', () => {
    expect(isDarkColor('#fff')).toBe(false);
  });

  it('handles 3-char shorthand #000 as black (dark)', () => {
    expect(isDarkColor('#000')).toBe(true);
  });
});
