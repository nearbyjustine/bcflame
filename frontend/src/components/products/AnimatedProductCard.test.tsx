import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedProductCard } from './AnimatedProductCard';
import type { Product } from '@/types/product';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useInView: () => true,
}));

// Mock ProductCard
vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }: any) => (
    <div data-testid="product-card">{product.attributes.name}</div>
  ),
}));

describe('AnimatedProductCard', () => {
  const mockProduct: Product = {
    id: 1,
    attributes: {
      name: 'Test Product',
      sku: 'test-product',
      category: 'Indica',
      description: 'Test description',
      tagline: 'Test tagline',
      thc_content: '20-25%',
      pricing_model: 'per_pound',
      base_price_per_pound: 100,
      pricing_unit: 'per_pound',
      pricing: [],
      customization_enabled: true,
      featured: false,
      on_sale: false,
      sort_order: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      publishedAt: '2024-01-01',
    },
  };

  it('renders ProductCard with product data', () => {
    render(<AnimatedProductCard product={mockProduct} index={0} />);

    expect(screen.getByTestId('product-card')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('passes stockStatus prop correctly', () => {
    const { ProductCard } = require('./ProductCard');
    const spy = vi.fn();
    ProductCard.mockImplementation(({ stockStatus }: any) => {
      spy(stockStatus);
      return <div>Card</div>;
    });

    render(
      <AnimatedProductCard
        product={mockProduct}
        stockStatus="available"
        index={0}
      />
    );

    expect(spy).toHaveBeenCalledWith('available');
  });

  it('passes onCustomize callback correctly', () => {
    const { ProductCard } = require('./ProductCard');
    const onCustomize = vi.fn();
    const spy = vi.fn();

    ProductCard.mockImplementation(({ onCustomize }: any) => {
      spy(onCustomize);
      return <div>Card</div>;
    });

    render(
      <AnimatedProductCard
        product={mockProduct}
        index={0}
        onCustomize={onCustomize}
      />
    );

    expect(spy).toHaveBeenCalledWith(onCustomize);
  });

  it('handles different index values', () => {
    const { rerender } = render(
      <AnimatedProductCard product={mockProduct} index={0} />
    );

    expect(screen.getByTestId('product-card')).toBeInTheDocument();

    rerender(<AnimatedProductCard product={mockProduct} index={5} />);

    expect(screen.getByTestId('product-card')).toBeInTheDocument();
  });

  it('renders multiple cards with different indices', () => {
    const products: Product[] = [
      { ...mockProduct, id: 1, attributes: { ...mockProduct.attributes, name: 'Product 1' } },
      { ...mockProduct, id: 2, attributes: { ...mockProduct.attributes, name: 'Product 2' } },
      { ...mockProduct, id: 3, attributes: { ...mockProduct.attributes, name: 'Product 3' } },
    ];

    const { ProductCard } = require('./ProductCard');
    ProductCard.mockImplementation(({ product }: any) => (
      <div data-testid="product-card">{product.attributes.name}</div>
    ));

    const { container } = render(
      <div>
        {products.map((product, index) => (
          <AnimatedProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    );

    const cards = container.querySelectorAll('[data-testid="product-card"]');
    expect(cards).toHaveLength(3);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });
});
