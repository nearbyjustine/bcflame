import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types/product';

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 1,
    attributes: {
      name: 'Blue Dream',
      sku: 'BD-001',
      category: 'Hybrid',
      tagline: 'Balanced and uplifting',
      description: 'A balanced hybrid strain',
      on_sale: false,
      featured: false,
      sort_order: 0,
      thc_content: '18-24%',
      pricing: [
        {
          id: 1,
          weight: '1g',
          amount: 10.0,
          currency: 'USD',
        },
        {
          id: 2,
          weight: '3.5g',
          amount: 30.0,
          currency: 'USD',
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  };

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Blue Dream')).toBeInTheDocument();
  });

  it('renders product category', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('renders product tagline when provided', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Balanced and uplifting')).toBeInTheDocument();
  });

  it('does not render tagline when not provided', () => {
    const productWithoutTagline: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        tagline: undefined,
      },
    };
    render(<ProductCard product={productWithoutTagline} />);
    expect(screen.queryByText('Balanced and uplifting')).not.toBeInTheDocument();
  });

  it('renders THC content when provided', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/18-24%/)).toBeInTheDocument();
  });

  it('renders price range from pricing array', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/\$10\.00/)).toBeInTheDocument();
  });

  it('displays "On Sale" badge when on_sale is true', () => {
    const onSaleProduct: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        on_sale: true,
      },
    };
    render(<ProductCard product={onSaleProduct} />);
    expect(screen.getByText('On Sale')).toBeInTheDocument();
  });

  it('displays "Featured" badge when featured is true', () => {
    const featuredProduct: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        featured: true,
      },
    };
    render(<ProductCard product={featuredProduct} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('renders product with images data structure', () => {
    const productWithImage: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        images: {
          data: [
            {
              id: 1,
              name: 'product-image.jpg',
              alternativeText: 'Blue Dream product',
              width: 800,
              height: 600,
              hash: 'hash123',
              ext: '.jpg',
              mime: 'image/jpeg',
              size: 123.45,
              url: '/uploads/product.jpg',
              provider: 'local',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        pricing: [
          {
            id: 1,
            weight: '1g',
            amount: 10.0,
            currency: 'USD',
          },
          {
            id: 2,
            weight: '3.5g',
            amount: 30.0,
            currency: 'USD',
          },
        ],
      },
    };
    render(<ProductCard product={productWithImage} />);
    // In test environment without Next.js bundler, NEXT_PUBLIC_* env vars aren't replaced
    // So we just verify the component renders without crashing when images are provided
    expect(screen.getByText('Blue Dream')).toBeInTheDocument();
  });

  it('renders placeholder when no image provided', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('displays category-specific styling', () => {
    render(<ProductCard product={mockProduct} />);
    const categoryBadge = screen.getByText('Hybrid');
    expect(categoryBadge).toHaveClass('bg-purple-100');
  });

  it('displays Indica category styling', () => {
    const indicaProduct: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        category: 'Indica',
      },
    };
    render(<ProductCard product={indicaProduct} />);
    const categoryBadge = screen.getByText('Indica');
    expect(categoryBadge).toHaveClass('bg-blue-100');
  });

  it('displays per-pound pricing when pricing_model is per_pound', () => {
    const perPoundProduct: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        base_price_per_pound: 3234.21,
        pricing_model: 'per_pound',
      },
    };
    render(<ProductCard product={perPoundProduct} />);
    expect(screen.getByText(/Starting at/)).toBeInTheDocument();
    expect(screen.getByText(/\$3,234\.21\/P/)).toBeInTheDocument();
  });

  it('displays tiered pricing when pricing_model is tiered', () => {
    const tieredProduct: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        pricing_model: 'tiered',
        pricing: [
          {
            id: 1,
            weight: '7g',
            amount: 50.0,
            currency: 'USD',
          },
          {
            id: 2,
            weight: '14g',
            amount: 90.0,
            currency: 'USD',
          },
        ],
      },
    };
    render(<ProductCard product={tieredProduct} />);
    expect(screen.getByText('Select Size:')).toBeInTheDocument();
    expect(screen.getByText('7g')).toBeInTheDocument();
    expect(screen.getByText('14g')).toBeInTheDocument();
  });

  it('renders customize button when customization is enabled', () => {
    const customizableProduct: Product = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        customization_enabled: true,
      },
    };
    const onCustomizeMock = vi.fn();
    render(<ProductCard product={customizableProduct} onCustomize={onCustomizeMock} />);
    expect(screen.getByText('Customize')).toBeInTheDocument();
  });
});
