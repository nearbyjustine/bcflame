import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestTextColors } from './color-extraction';

// Mock colorthief - it requires browser DOM APIs
vi.mock('colorthief', () => {
  return {
    default: class ColorThief {
      getColor() {
        return [255, 87, 51]; // Mock RGB value
      }
      getPalette() {
        return [
          [255, 87, 51],
          [51, 255, 87],
          [87, 51, 255],
          [255, 255, 51],
          [51, 255, 255],
        ];
      }
    },
  };
});

describe('suggestTextColors', () => {
  it('suggests white text for dark backgrounds', () => {
    const result = suggestTextColors('#000000');
    expect(result.textColor).toBe('#FFFFFF');
    expect(result.textBackground).toContain('rgba(0, 0, 0');
  });

  it('suggests black text for light backgrounds', () => {
    const result = suggestTextColors('#FFFFFF');
    expect(result.textColor).toBe('#000000');
    expect(result.textBackground).toContain('rgba(255, 255, 255');
  });

  it('suggests white text for medium-dark colors', () => {
    const result = suggestTextColors('#1a1a1a');
    expect(result.textColor).toBe('#FFFFFF');
  });

  it('handles colors without # prefix', () => {
    const result = suggestTextColors('FFFFFF');
    expect(result.textColor).toBe('#000000');
  });

  it('handles 3-character hex shorthand', () => {
    const result = suggestTextColors('#000');
    expect(result.textColor).toBe('#FFFFFF');
  });

  it('handles invalid colors gracefully', () => {
    const result = suggestTextColors('invalid');
    // isDarkColor returns true for invalid input (safe default)
    expect(result.textColor).toBe('#FFFFFF');
  });

  it('returns semi-transparent backgrounds', () => {
    const darkResult = suggestTextColors('#000000');
    expect(darkResult.textBackground).toContain('0.3');

    const lightResult = suggestTextColors('#FFFFFF');
    expect(lightResult.textBackground).toContain('0.3');
  });
});

// Note: extractDominantColor, extractColorPalette, and extractAndSuggestColors
// require real File objects and Image loading, which are difficult to test in
// a Node.js environment. These would typically be tested with integration tests
// in a real browser environment or with more complex mocking.
