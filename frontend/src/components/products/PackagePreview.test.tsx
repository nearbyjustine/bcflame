import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PackagePreview from './PackagePreview';
import type { BackgroundStyle, FontStyle } from '@/types/customization';

// useGoogleFonts is fire-and-forget; stub it out
vi.mock('@/hooks/useGoogleFonts', () => ({ useGoogleFonts: vi.fn() }));

// getImageUrl: return a deterministic URL for any truthy input
vi.mock('@/lib/utils/image', () => ({
  getImageUrl: (img: any) => (img ? 'http://localhost:1337/uploads/preview.png' : null),
}));

const solidBackground: BackgroundStyle = {
  id: 1,
  attributes: {
    name: 'Ocean Blue',
    type: 'solid_color',
    color_hex: '#0077B6',
    sort_order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
};

const gradientBackground: BackgroundStyle = {
  id: 2,
  attributes: {
    name: 'Sunset',
    type: 'gradient',
    color_hex: '#FF6B35',
    sort_order: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
};

const textureBackground: BackgroundStyle = {
  id: 3,
  attributes: {
    name: 'Leaf Pattern',
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
};

const sampleFont: FontStyle = {
  id: 1,
  attributes: {
    name: 'Dancing Script',
    font_family: 'Dancing Script',
    category: 'script',
    sort_order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
};

describe('PackagePreview', () => {
  it('renders without error when ALL props are undefined', () => {
    const { container } = render(<PackagePreview />);
    // Should produce an SVG
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders "YOUR BRAND" when companyName is undefined', () => {
    render(<PackagePreview />);
    expect(screen.getByText('YOUR BRAND')).toBeDefined();
  });

  it('renders "YOUR BRAND" when companyName is empty string', () => {
    render(<PackagePreview companyName="" />);
    expect(screen.getByText('YOUR BRAND')).toBeDefined();
  });

  it('renders the provided companyName', () => {
    render(<PackagePreview companyName="Acme Co" />);
    expect(screen.getByText('Acme Co')).toBeDefined();
  });

  it('renders solid_color background with correct fill', () => {
    const { container } = render(<PackagePreview background={solidBackground} />);
    // The bag body rect should have fill="#0077B6"
    const rects = container.querySelectorAll('rect');
    const bagBody = Array.from(rects).find((r) => r.getAttribute('fill') === '#0077B6');
    expect(bagBody).toBeDefined();
  });

  it('renders gradient background with a linearGradient reference', () => {
    const { container } = render(<PackagePreview background={gradientBackground} />);
    const gradientDef = container.querySelector('linearGradient');
    expect(gradientDef).not.toBeNull();
  });

  it('renders texture background with a pattern containing an image', () => {
    const { container } = render(<PackagePreview background={textureBackground} />);
    const pattern = container.querySelector('pattern');
    expect(pattern).not.toBeNull();
    const img = pattern?.querySelector('image');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('href')).toBe('http://localhost:1337/uploads/preview.png');
  });

  it('renders without error when background type is texture but preview_image is null', () => {
    const bg: BackgroundStyle = {
      ...textureBackground,
      attributes: { ...textureBackground.attributes, preview_image: { data: null } },
    };
    const { container } = render(<PackagePreview background={bg} />);
    // Falls back to color_hex solid fill
    const rects = container.querySelectorAll('rect');
    const bagBody = Array.from(rects).find((r) => r.getAttribute('fill') === '#228B22');
    expect(bagBody).toBeDefined();
  });

  it('renders without error when background is provided but color_hex is undefined', () => {
    const bg: BackgroundStyle = {
      id: 99,
      attributes: {
        name: 'No Color',
        type: 'solid_color',
        sort_order: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };
    const { container } = render(<PackagePreview background={bg} />);
    // Falls back to #f0f0f0
    const rects = container.querySelectorAll('rect');
    const bagBody = Array.from(rects).find((r) => r.getAttribute('fill') === '#f0f0f0');
    expect(bagBody).toBeDefined();
  });

  it('applies font-family from the selected font on the text element', () => {
    const { container } = render(<PackagePreview font={sampleFont} companyName="Test" />);
    const text = container.querySelector('text');
    expect(text).not.toBeNull();
    expect(text?.getAttribute('font-family')).toBe('Dancing Script');
  });

  it('logo image is absent when logoUrl is null', () => {
    const { container } = render(
      <PackagePreview background={solidBackground} font={sampleFont} logoUrl={null} />
    );
    // Only the label text <text> should exist; no <image> for logo
    const images = container.querySelectorAll('image');
    // texture pattern images don't apply here (solid bg), so 0 images
    expect(images.length).toBe(0);
  });

  it('logo image is rendered when logoUrl is provided', () => {
    const { container } = render(
      <PackagePreview background={solidBackground} logoUrl="http://example.com/logo.png" />
    );
    const images = container.querySelectorAll('image');
    const logoImg = Array.from(images).find(
      (i) => i.getAttribute('href') === 'http://example.com/logo.png'
    );
    expect(logoImg).toBeDefined();
  });

  it('respects custom width and height', () => {
    const { container } = render(<PackagePreview width={400} height={300} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('400');
    expect(svg?.getAttribute('height')).toBe('300');
  });
});
