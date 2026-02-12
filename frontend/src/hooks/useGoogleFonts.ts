import { useEffect, useRef } from 'react';
import type { FontStyle } from '@/types/customization';

const FALLBACK_LINK_ID = 'bcflame-google-fonts';
const CUSTOM_URL_PREFIX = 'bcflame-custom-font-url-';

/**
 * Type guard to check if input is a FontStyle array
 */
function isFontStyleArray(input: string[] | FontStyle[]): input is FontStyle[] {
  return input.length > 0 && typeof input[0] === 'object' && 'attributes' in input[0];
}

/**
 * Generate a stable hash-based ID for a custom URL
 */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Injects (or updates) Google Fonts into the document <head>.
 *
 * Supports two input types:
 * 1. string[] - Array of font family names (backward compatible)
 * 2. FontStyle[] - Array of font style objects with optional custom Google Fonts URLs
 *
 * When FontStyle objects are provided:
 * - Fonts with custom `google_fonts_url` are injected as separate <link> elements
 * - Fonts without custom URLs are batched into a fallback URL with default weights (400, 700, 400 italic)
 *
 * No-ops during SSR (typeof window === 'undefined').
 * Links are never removed on unmount - other components may still reference the loaded fonts.
 */
export function useGoogleFonts(input: string[] | FontStyle[]): void {
  const prevFallbackUrl = useRef<string | null>(null);
  const prevCustomUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (input.length === 0) return;

    // Handle backward compatibility: string[] input
    if (!isFontStyleArray(input)) {
      const valid = input.filter(Boolean);
      if (valid.length === 0) return;

      const unique = Array.from(new Set(valid));
      const families = unique
        .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,700;1,400`)
        .join('&');
      const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;

      if (url === prevFallbackUrl.current) return;
      prevFallbackUrl.current = url;

      let link = document.getElementById(FALLBACK_LINK_ID) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = FALLBACK_LINK_ID;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = url;
      return;
    }

    // Handle FontStyle[] input
    const customUrls = new Set<string>();
    const fallbackFontFamilies: string[] = [];

    for (const fontStyle of input) {
      const customUrl = fontStyle.attributes.google_fonts_url;
      if (customUrl && customUrl.trim()) {
        customUrls.add(customUrl.trim());
      } else {
        const fontFamily = fontStyle.attributes.font_family;
        if (fontFamily) {
          fallbackFontFamilies.push(fontFamily);
        }
      }
    }

    // Inject custom URLs as separate <link> elements
    const currentCustomUrls = new Set<string>();
    customUrls.forEach((url) => {
      const urlId = `${CUSTOM_URL_PREFIX}${hashUrl(url)}`;
      currentCustomUrls.add(urlId);

      let link = document.getElementById(urlId) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.id = urlId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      if (link.href !== url) {
        link.href = url;
      }
    });

    // Remove old custom URL links that are no longer needed
    prevCustomUrls.current.forEach((oldUrlId) => {
      if (!currentCustomUrls.has(oldUrlId)) {
        const oldLink = document.getElementById(oldUrlId);
        if (oldLink) {
          oldLink.remove();
        }
      }
    });
    prevCustomUrls.current = currentCustomUrls;

    // Build fallback URL for fonts without custom URLs
    if (fallbackFontFamilies.length > 0) {
      const unique = Array.from(new Set(fallbackFontFamilies));
      const families = unique
        .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,700;1,400`)
        .join('&');
      const fallbackUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`;

      if (fallbackUrl !== prevFallbackUrl.current) {
        prevFallbackUrl.current = fallbackUrl;

        let link = document.getElementById(FALLBACK_LINK_ID) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.id = FALLBACK_LINK_ID;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = fallbackUrl;
      }
    } else {
      // No fallback fonts needed, remove fallback link if it exists
      const fallbackLink = document.getElementById(FALLBACK_LINK_ID);
      if (fallbackLink) {
        fallbackLink.remove();
      }
      prevFallbackUrl.current = null;
    }
  }, [input]);
}

/**
 * Injects a @font-face rule for a custom font hosted on Strapi.
 * Idempotent: calling with the same fontName is a no-op.
 */
export function injectCustomFont(fontName: string, url: string): void {
  if (typeof window === 'undefined') return;
  const id = `bcflame-custom-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `@font-face { font-family: '${fontName}'; src: url('${url}') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }`;
  document.head.appendChild(style);
}
