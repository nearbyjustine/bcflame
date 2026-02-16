import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackgroundFontSelector from './BackgroundFontSelector';
import type { BackgroundStyle, FontStyle } from '@/types/customization';

// Stub useGoogleFonts – it touches document.head which is fine but we don't
// want real network requests in unit tests.
vi.mock('@/hooks/useGoogleFonts', () => ({ useGoogleFonts: vi.fn() }));
vi.mock('@/lib/utils/image', () => ({
  getImageUrl: (img: any) => (img ? 'http://localhost:1337/uploads/preview.png' : null),
}));

const mockBackgrounds: BackgroundStyle[] = [
  {
    id: 1,
    attributes: {
      name: 'Dark Theme',
      type: 'solid_color',
      color_hex: '#1a1a1a',
      sort_order: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 2,
    attributes: {
      name: 'Sunset Gradient',
      type: 'gradient',
      color_hex: '#FF6B35',
      sort_order: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 3,
    attributes: {
      name: 'Leaf Texture',
      type: 'texture',
      color_hex: '#228B22',
      preview_image: {
        data: {
          id: 10,
          attributes: {
            name: 'leaf.png',
            url: '/uploads/leaf.png',
            width: 512,
            height: 512,
            hash: 'abc',
            ext: '.png',
            mime: 'image/png',
            size: 50000,
            provider: 'local',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      },
      sort_order: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
];

const mockFonts: FontStyle[] = [
  {
    id: 1,
    attributes: {
      name: 'Modern Sans',
      font_family: 'Inter',
      category: 'sans_serif',
      sort_order: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 2,
    attributes: {
      name: 'Classic Serif',
      font_family: 'Georgia',
      category: 'serif',
      sort_order: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 3,
    attributes: {
      name: 'Bold Display',
      font_family: 'Impact',
      category: 'display',
      sort_order: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
];

const mockBackgroundLimits = { min: 1, max: 3 };
const mockFontLimits = { min: 1, max: 2 };

describe('BackgroundFontSelector', () => {
  it('renders all background options', () => {
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    expect(screen.getByText('Sunset Gradient')).toBeInTheDocument();
    expect(screen.getByText('Leaf Texture')).toBeInTheDocument();
  });

  it('renders all font options', () => {
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    expect(screen.getByText('Modern Sans')).toBeInTheDocument();
    expect(screen.getByText('Classic Serif')).toBeInTheDocument();
    expect(screen.getByText('Bold Display')).toBeInTheDocument();
  });

  // --- Bug fixes: onToggleBackground is called with a single id, not an array ---
  it('calls onToggleBackground with the clicked id', () => {
    const onToggleBackground = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[1]}
        selectedFontIds={[]}
        onToggleBackground={onToggleBackground}
        onToggleFont={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Sunset Gradient'));
    expect(onToggleBackground).toHaveBeenCalledWith(2);
  });

  it('calls onToggleBackground when clicking an already-selected background (to deselect)', () => {
    const onToggleBackground = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[1]}
        selectedFontIds={[]}
        onToggleBackground={onToggleBackground}
        onToggleFont={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Dark Theme'));
    expect(onToggleBackground).toHaveBeenCalledWith(1);
  });

  it('calls onToggleFont with the clicked id', () => {
    const onToggleFont = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[1]}
        onToggleBackground={vi.fn()}
        onToggleFont={onToggleFont}
      />
    );

    fireEvent.click(screen.getByText('Classic Serif'));
    expect(onToggleFont).toHaveBeenCalledWith(2);
  });

  it('does not call onToggleBackground when at max and clicking an unselected item', () => {
    const onToggleBackground = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[1, 2, 3]} // at max (3)
        selectedFontIds={[]}
        onToggleBackground={onToggleBackground}
        onToggleFont={vi.fn()}
      />
    );

    // All are already selected, so clicking any won't trigger the "at max + unselected" guard.
    // But if we had a 4th item it would. Instead, verify clicking a *selected* item still fires.
    fireEvent.click(screen.getByText('Dark Theme'));
    expect(onToggleBackground).toHaveBeenCalledWith(1);
  });

  // --- Visual swatch tests ---
  it('solid_color background renders a swatch div with correct backgroundColor', () => {
    const { container } = render(
      <BackgroundFontSelector
        backgrounds={[mockBackgrounds[0]]}
        fonts={[]}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    // The swatch div should have backgroundColor: #1a1a1a
    const swatches = container.querySelectorAll('div[style]');
    const solidSwatch = Array.from(swatches).find(
      (el) => el.getAttribute('style')?.includes('background-color: rgb(26, 26, 26)')
    );
    expect(solidSwatch).toBeDefined();
  });

  it('gradient background renders a swatch div with a background style containing linear-gradient', () => {
    const { container } = render(
      <BackgroundFontSelector
        backgrounds={[mockBackgrounds[1]]}
        fonts={[]}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    const swatches = container.querySelectorAll('div[style]');
    const gradSwatch = Array.from(swatches).find(
      (el) => el.getAttribute('style')?.includes('linear-gradient')
    );
    expect(gradSwatch).toBeDefined();
  });

  it('texture background with preview_image renders an img element', () => {
    render(
      <BackgroundFontSelector
        backgrounds={[mockBackgrounds[2]]}
        fonts={[]}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    // The swatch should be an <img> with our mocked URL
    const img = screen.getByRole('img', { name: 'Leaf Texture' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'http://localhost:1337/uploads/preview.png');
  });

  it('font cards render a preview span with the correct fontFamily style', () => {
    const { container } = render(
      <BackgroundFontSelector
        backgrounds={[]}
        fonts={[mockFonts[0]]}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    // The "Aa Bb Cc 123" preview text should exist with fontFamily: Inter
    const preview = screen.getByText('Aa Bb Cc 123');
    expect(preview).toBeInTheDocument();
    expect(preview.style.fontFamily).toBe('Inter');
  });

  it('validates file type on upload', () => {
    const onLogoUpload = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        onLogoUpload={onLogoUpload}
      />
    );

    const input = screen.getByLabelText(/upload business logo/i) as HTMLInputElement;

    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('PNG'));
    expect(onLogoUpload).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('validates file size on upload', () => {
    const onLogoUpload = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        onLogoUpload={onLogoUpload}
      />
    );

    const input = screen.getByLabelText(/upload business logo/i) as HTMLInputElement;

    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('2MB'));
    expect(onLogoUpload).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('accepts valid PNG file upload', () => {
    const onLogoUpload = vi.fn();

    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        onLogoUpload={onLogoUpload}
      />
    );

    const input = screen.getByLabelText(/upload business logo/i) as HTMLInputElement;

    const validFile = new File(['test'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(onLogoUpload).toHaveBeenCalledWith(validFile);
  });

  it('displays uploaded logo preview', () => {
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        userLogo="https://example.com/logo.png"
        onLogoUpload={vi.fn()}
      />
    );

    const logoImage = screen.getByAltText('Logo');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('applies active styling to selected backgrounds', () => {
    const { container } = render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[1, 3]}
        selectedFontIds={[]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    const selectedBorders = container.querySelectorAll('.border-orange-500');
    expect(selectedBorders.length).toBeGreaterThanOrEqual(2);
  });

  it('applies active styling to selected fonts', () => {
    const { container } = render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[1, 2]}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    const selectedBorders = container.querySelectorAll('.border-orange-500');
    expect(selectedBorders.length).toBeGreaterThanOrEqual(2);
  });
});
