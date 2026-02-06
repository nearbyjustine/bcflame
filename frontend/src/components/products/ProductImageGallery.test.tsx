import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProductImageGallery } from './ProductImageGallery';
import type { ProductImage } from '@/types/product';

// Mock the dialog component
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="lightbox">{children}</div>,
}));

const mockImages: ProductImage[] = [
  {
    id: 1,
    name: 'product-1.jpg',
    alternativeText: 'Product image 1',
    width: 800,
    height: 800,
    url: '/uploads/product-1.jpg',
    hash: 'hash1',
    ext: '.jpg',
    mime: 'image/jpeg',
    size: 100,
    provider: 'local',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    name: 'product-2.jpg',
    alternativeText: 'Product image 2',
    width: 800,
    height: 800,
    url: '/uploads/product-2.jpg',
    hash: 'hash2',
    ext: '.jpg',
    mime: 'image/jpeg',
    size: 100,
    provider: 'local',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 3,
    name: 'product-3.jpg',
    alternativeText: 'Product image 3',
    width: 800,
    height: 800,
    url: '/uploads/product-3.jpg',
    hash: 'hash3',
    ext: '.jpg',
    mime: 'image/jpeg',
    size: 100,
    provider: 'local',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

describe('ProductImageGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main image and thumbnails', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Check main image is rendered
    const mainImage = screen.getAllByAltText(/Product image 1|Test Product/i)[0];
    expect(mainImage).toBeInTheDocument();

    // Check image counter
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Check thumbnails are rendered
    const thumbnails = screen.getAllByRole('button', { name: /View image/i });
    expect(thumbnails).toHaveLength(3);
  });

  it('changes main image when thumbnail is clicked', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Click second thumbnail
    const secondThumbnail = screen.getByRole('button', { name: 'View image 2' });
    fireEvent.click(secondThumbnail);

    // Check image counter updated
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates with next button', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Click next button
    const nextButton = screen.getByRole('button', { name: 'Next image' });
    fireEvent.click(nextButton);

    // Check image counter
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates with previous button', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Click previous button (should wrap to last image)
    const prevButton = screen.getByRole('button', { name: 'Previous image' });
    fireEvent.click(prevButton);

    // Check image counter shows last image
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('opens lightbox when main image is clicked', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Click main image
    const mainImage = screen.getAllByAltText(/Product image 1|Test Product/i)[0];
    fireEvent.click(mainImage);

    // Check lightbox is opened
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
  });

  it('handles keyboard navigation in lightbox', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Open lightbox
    const mainImage = screen.getAllByAltText(/Product image 1|Test Product/i)[0];
    fireEvent.click(mainImage);

    // Verify lightbox is open
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();

    // Get all counters - there will be 2: one in gallery, one in lightbox
    let counters = screen.getAllByText('1 / 3');
    expect(counters).toHaveLength(2);

    // Create and dispatch keyboard events on window wrapped in act
    act(() => {
      const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      window.dispatchEvent(rightArrowEvent);
    });

    // Both counters should now show 2 / 3
    counters = screen.getAllByText('2 / 3');
    expect(counters).toHaveLength(2);

    // Simulate left arrow key
    act(() => {
      const leftArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      window.dispatchEvent(leftArrowEvent);
    });

    // Both counters should be back to 1 / 3
    counters = screen.getAllByText('1 / 3');
    expect(counters).toHaveLength(2);
  });

  it('shows placeholder when no images provided', () => {
    render(<ProductImageGallery images={[]} productName="Test Product" />);

    // Check placeholder is shown
    expect(screen.getByText('No images available')).toBeInTheDocument();
  });

  it('hides navigation arrows when only one image', () => {
    const singleImage = [mockImages[0]];
    render(<ProductImageGallery images={singleImage} productName="Test Product" />);

    // Navigation arrows should not be rendered
    expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument();
  });

  it('displays correct image counter', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Initially shows 1 / 3
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Click next
    const nextButton = screen.getByRole('button', { name: 'Next image' });
    fireEvent.click(nextButton);

    // Now shows 2 / 3
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('wraps around when navigating past last image', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Navigate to last image
    const nextButton = screen.getByRole('button', { name: 'Next image' });
    fireEvent.click(nextButton); // Image 2
    fireEvent.click(nextButton); // Image 3
    fireEvent.click(nextButton); // Should wrap to image 1

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('wraps around when navigating before first image', () => {
    render(<ProductImageGallery images={mockImages} productName="Test Product" />);

    // Click previous from first image (should go to last)
    const prevButton = screen.getByRole('button', { name: 'Previous image' });
    fireEvent.click(prevButton);

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});
