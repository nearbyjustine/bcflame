import ColorThief from 'colorthief';
import { isDarkColor } from './color';

/**
 * Convert RGB array to hex string
 */
function rgbToHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Extract dominant color from an image file
 * Returns hex color string (e.g., "#FF5733")
 */
export async function extractDominantColor(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const rgb = colorThief.getColor(img) as [number, number, number];
        URL.revokeObjectURL(url);
        resolve(rgbToHex(rgb));
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.crossOrigin = 'Anonymous';
    img.src = url;
  });
}

/**
 * Extract a color palette from an image file
 * Returns array of hex color strings
 */
export async function extractColorPalette(
  imageFile: File,
  count: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, count) as Array<[number, number, number]>;
        URL.revokeObjectURL(url);
        resolve(palette.map(rgbToHex));
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.crossOrigin = 'Anonymous';
    img.src = url;
  });
}

/**
 * Suggest text colors based on background color
 * Uses W3C luminance calculation to determine contrast
 */
export function suggestTextColors(bgColor: string): {
  textColor: string;
  textBackground: string;
} {
  const isDark = isDarkColor(bgColor);

  return {
    textColor: isDark ? '#FFFFFF' : '#000000',
    textBackground: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
  };
}

/**
 * Extract colors and suggest text colors for a background image
 * Combines extraction and suggestion in one call
 */
export async function extractAndSuggestColors(imageFile: File): Promise<{
  dominantColor: string;
  palette: string[];
  suggestedTextColor: string;
  suggestedTextBackground: string;
}> {
  const [dominantColor, palette] = await Promise.all([
    extractDominantColor(imageFile),
    extractColorPalette(imageFile, 5),
  ]);

  const { textColor, textBackground } = suggestTextColors(dominantColor);

  return {
    dominantColor,
    palette,
    suggestedTextColor: textColor,
    suggestedTextBackground: textBackground,
  };
}
