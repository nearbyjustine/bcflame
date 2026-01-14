import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackgroundFontSelector from './BackgroundFontSelector';

const mockBackgrounds = [
  { id: 1, attributes: { name: 'Dark Theme', description: 'Black background' } },
  { id: 2, attributes: { name: 'Light Theme', description: 'White background' } },
  { id: 3, attributes: { name: 'Colorful', description: 'Vibrant colors' } },
];

const mockFonts = [
  { id: 1, attributes: { name: 'Modern Sans', description: 'Clean sans-serif' } },
  { id: 2, attributes: { name: 'Classic Serif', description: 'Traditional serif' } },
  { id: 3, attributes: { name: 'Bold Display', description: 'Eye-catching display' } },
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    expect(screen.getByText('Light Theme')).toBeInTheDocument();
    expect(screen.getByText('Colorful')).toBeInTheDocument();
  });

  it('renders all font options', () => {
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[]}
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    expect(screen.getByText('Modern Sans')).toBeInTheDocument();
    expect(screen.getByText('Classic Serif')).toBeInTheDocument();
    expect(screen.getByText('Bold Display')).toBeInTheDocument();
  });

  it('allows background multi-selection when enabled', () => {
    const onToggleBackground = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[1]}
        selectedFontIds={[]}
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={onBackgroundChange}
        onToggleFont={vi.fn()}
      />
    );

    // Click second background
    fireEvent.click(screen.getByText('Light Theme'));
    expect(onBackgroundChange).toHaveBeenCalledWith([1, 2]);
  });

  it('allows background single-selection when disabled', () => {
    const onBackgroundChange = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[1]}
        selectedFontIds={[]}
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={onBackgroundChange}
        onToggleFont={vi.fn()}
      />
    );

    // Click second background - should replace, not add
    fireEvent.click(screen.getByText('Light Theme'));
    expect(onBackgroundChange).toHaveBeenCalledWith([2]);
  });

  it('allows font multi-selection when enabled', () => {
    const onFontChange = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[1]}
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={onFontChange}
      />
    );

    // Click second font
    fireEvent.click(screen.getByText('Classic Serif'));
    expect(onFontChange).toHaveBeenCalledWith([1, 2]);
  });

  it('allows font single-selection when disabled', () => {
    const onFontChange = vi.fn();
    render(
      <BackgroundFontSelector
        backgrounds={mockBackgrounds}
        fonts={mockFonts}
        selectedBackgroundIds={[]}
        selectedFontIds={[1]}
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={onFontChange}
      />
    );

    // Click second font - should replace, not add
    fireEvent.click(screen.getByText('Classic Serif'));
    expect(onFontChange).toHaveBeenCalledWith([2]);
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        onLogoUpload={onLogoUpload}
      />
    );

    const input = screen.getByLabelText(/upload business logo/i) as HTMLInputElement;

    // Create invalid file (PDF)
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        onLogoUpload={onLogoUpload}
      />
    );

    const input = screen.getByLabelText(/upload business logo/i) as HTMLInputElement;

    // Create file larger than 2MB
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        onLogoUpload={onLogoUpload}
      />
    );

    const input = screen.getByLabelText(/upload business logo/i) as HTMLInputElement;

    // Create valid PNG file
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
        userLogo="https://example.com/logo.png"
        onLogoUpload={vi.fn()}  // Must be provided for logo section to render
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
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
        backgroundLimits={mockBackgroundLimits}
        fontLimits={mockFontLimits}
        onToggleBackground={vi.fn()}
        onToggleFont={vi.fn()}
      />
    );

    const selectedBorders = container.querySelectorAll('.border-orange-500');
    expect(selectedBorders.length).toBeGreaterThanOrEqual(2);
  });
});
