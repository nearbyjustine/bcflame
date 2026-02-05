import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGoogleFonts, injectCustomFont } from './useGoogleFonts';

const LINK_ID = 'bcflame-google-fonts';

function getLink(): HTMLLinkElement | null {
  return document.getElementById(LINK_ID) as HTMLLinkElement | null;
}

beforeEach(() => {
  const el = document.getElementById(LINK_ID);
  if (el) el.remove();
  document.querySelectorAll('[id^="bcflame-custom-font-"]').forEach((e) => e.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGoogleFonts', () => {
  it('injects a <link> with the correct Google Fonts URL', () => {
    renderHook(() => useGoogleFonts(['Inter', 'Georgia']));

    const link = getLink();
    expect(link).not.toBeNull();
    expect(link!.href).toContain('fonts.googleapis.com');
    expect(link!.href).toContain('Inter');
    expect(link!.href).toContain('Georgia');
    expect(link!.getAttribute('rel')).toBe('stylesheet');
  });

  it('does not inject a link when array is empty', () => {
    renderHook(() => useGoogleFonts([]));
    expect(getLink()).toBeNull();
  });

  it('filters out undefined/null/empty entries', () => {
    renderHook(() => useGoogleFonts(['Inter', '', 'Georgia'] as any));

    const link = getLink();
    expect(link).not.toBeNull();
    expect(link!.href).toContain('Inter');
    expect(link!.href).toContain('Georgia');
  });

  it('deduplicates font families', () => {
    renderHook(() => useGoogleFonts(['Inter', 'Inter', 'Georgia']));

    const link = getLink();
    expect(link).not.toBeNull();
    const matches = link!.href.match(/Inter/g);
    expect(matches).toHaveLength(1);
  });

  it('reuses the existing link element on re-render with different fonts', () => {
    const { rerender } = renderHook(({ fonts }: { fonts: string[] }) => useGoogleFonts(fonts), {
      initialProps: { fonts: ['Inter'] },
    });

    const link1 = getLink();
    expect(link1).not.toBeNull();
    expect(link1!.href).toContain('Inter');

    rerender({ fonts: ['Georgia'] });

    const link2 = getLink();
    expect(link2).toBe(link1);
    expect(link2!.href).toContain('Georgia');
  });

  it('does not duplicate links on multiple renders with same fonts', () => {
    const { rerender } = renderHook(({ fonts }: { fonts: string[] }) => useGoogleFonts(fonts), {
      initialProps: { fonts: ['Inter'] },
    });

    rerender({ fonts: ['Inter'] });
    rerender({ fonts: ['Inter'] });

    const links = document.querySelectorAll(`#${LINK_ID}`);
    expect(links.length).toBe(1);
  });
});

describe('injectCustomFont', () => {
  it('injects a <style> element with @font-face rule', () => {
    injectCustomFont('My Font', 'http://localhost:1337/uploads/myfont.ttf');

    const style = document.getElementById('bcflame-custom-font-my-font');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain("font-family: 'My Font'");
    expect(style!.textContent).toContain('http://localhost:1337/uploads/myfont.ttf');
  });

  it('is idempotent – calling twice does not duplicate the style', () => {
    injectCustomFont('Test Font', 'http://example.com/test.ttf');
    injectCustomFont('Test Font', 'http://example.com/test.ttf');

    const styles = document.querySelectorAll('#bcflame-custom-font-test-font');
    expect(styles.length).toBe(1);
  });
});
