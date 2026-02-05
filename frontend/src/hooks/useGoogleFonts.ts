import { useEffect, useRef } from 'react';

const LINK_ID = 'bcflame-google-fonts';

/**
 * Injects (or updates) a single <link> element in <head> that loads the
 * requested font families from Google Fonts.  The link is never removed on
 * unmount — other components may still reference the loaded fonts.
 *
 * No-ops during SSR (typeof window === 'undefined').
 */
export function useGoogleFonts(fontFamilies: string[]): void {
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const valid = fontFamilies.filter(Boolean);
    if (valid.length === 0) return;

    const unique = Array.from(new Set(valid));

    const families = unique
      .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,700;1,400`)
      .join('&');
    const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;

    if (url === prevUrl.current) return;
    prevUrl.current = url;

    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [fontFamilies]);
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
