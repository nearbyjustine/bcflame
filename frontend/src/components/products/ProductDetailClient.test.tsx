import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductDetailClient } from './ProductDetailClient';
import type { Product } from '@/types/product';

// Mock the components
vi.mock('./ProductImageGallery', () => ({
  ProductImageGallery: ({ productName }: { productName: string }) => (
    <div data-testid="image-gallery">{productName} Gallery</div>
  ),
}));

vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-card-${product.id}`}>{product.attributes.name}</div>
  ),
}));

vi.mock('./CustomizationModal', () => ({
  CustomizationModal: ({ isOpen, product }: { isOpen: boolean; product: Product }) =>
    isOpen ? <div data-testid="customization-modal">{product.attributes.name}</div> : null,
}));

vi.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: Array<{ label: string }> }) => (
    <nav data-testid="breadcrumb">{items.map((i) => i.label).join(' > ')}</nav>
  ),
}));

const mockProduct: Product = {
  id: 1,
  attributes: {
    name: 'Premium Indica Strain',
    sku: 'IND-001',
    category: 'Indica',
    tagline: 'Relaxing and soothing',
    description: 'A premium indica strain for relaxation',
    full_description: '<p>Full description here</p>',
    best_for: 'Evening use, relaxation',
    warning: 'Keep away from children',
    thc_content: '22-25%',
    flavor_profile: 'Earthy, Pine',
    product_url: undefined,
    on_sale: true,
    featured: true,
    sort_order: 1,
    pricing: [
      { id: 1, weight: '1 P', amount: 1000, currency: 'USD' },
      { id: 2, weight: '5 P', amount: 4500, currency: 'USD' },
    ],
    base_price_per_pound: undefined,
    pricing_model: 'tiered',
    features: [
      { id: 1, text: 'Organic cultivation' },
      { id: 2, text: 'Lab tested' },
    ],
    images: {
      data: [
        {
          id: 1,
          attributes: {
            name: 'product.jpg',
            alternativeText: 'Product image',
            width: 800,
            height: 800,
            url: '/uploads/product.jpg',
            hash: 'hash',
            ext: '.jpg',
            mime: 'image/jpeg',
            size: 100,
            provider: 'local',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        },
      ],
    },
    customization_enabled: true,
    selection_limits: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    publishedAt: '2024-01-01',
  },
};

const mockRelatedProducts: Product[] = [
  {
    ...mockProduct,
    id: 2,
    attributes: {
      ...mockProduct.attributes,
      name: 'Related Product 1',
      sku: 'IND-002',
    },
  },
  {
    ...mockProduct,
    id: 3,
    attributes: {
      ...mockProduct.attributes,
      name: 'Related Product 2',
      sku: 'IND-003',
    },
  },
];

describe('ProductDetailClient', () => {
  it('renders product name and details', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('Premium Indica Strain')).toBeInTheDocument();
    expect(screen.getByText('SKU: IND-001')).toBeInTheDocument();
    expect(screen.getByText('Relaxing and soothing')).toBeInTheDocument();
  });

  it('displays correct stock status badge for available product', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('displays correct stock status badge for unavailable product', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="unavailable"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('shows customize button when product is customizable and in stock', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByRole('button', { name: /Customize & Order/i })).toBeInTheDocument();
  });

  it('hides customize button when product is out of stock', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="unavailable"
        relatedProducts={[]}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Customize & Order/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/This product is currently unavailable/i)
    ).toBeInTheDocument();
  });

  it('hides customize button when customization is disabled', () => {
    const nonCustomizableProduct = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        customization_enabled: false,
      },
    };

    render(
      <ProductDetailClient
        product={nonCustomizableProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Customize & Order/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/doesn't support customization/i)).toBeInTheDocument();
  });

  it.skip('opens customization modal when customize button is clicked', async () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    const customizeButton = screen.getByRole('button', { name: /Customize & Order/i });
    fireEvent.click(customizeButton);

    await waitFor(() => {
      expect(screen.getByTestId('customization-modal')).toBeInTheDocument();
    });
  });

  it('displays breadcrumb navigation', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    expect(screen.getByText(/Products > Indica > Premium Indica Strain/)).toBeInTheDocument();
  });

  it('displays on-sale and featured badges', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('On Sale')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('displays THC content and flavor profile', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('22-25%')).toBeInTheDocument();
    expect(screen.getByText('Earthy, Pine')).toBeInTheDocument();
  });

  it('displays pricing for tiered pricing model', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('1 P')).toBeInTheDocument();
    expect(screen.getByText('5 P')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$4,500.00')).toBeInTheDocument();
  });

  it('displays pricing for per-pound pricing model', () => {
    const perPoundProduct = {
      ...mockProduct,
      attributes: {
        ...mockProduct.attributes,
        pricing_model: 'per_pound' as const,
        base_price_per_pound: 1200,
        pricing: [],
      },
    };

    render(
      <ProductDetailClient
        product={perPoundProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.getByText('$1,200.00/P')).toBeInTheDocument();
  });

  it('renders related products section', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={mockRelatedProducts}
      />
    );

    expect(screen.getByText('You May Also Like')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
  });

  it('excludes current product from related products', () => {
    const relatedWithCurrent = [...mockRelatedProducts, mockProduct];

    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={relatedWithCurrent}
      />
    );

    // Should only show 2 related products (excluding current product with id 1)
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
    expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    // Initially on Details tab
    expect(screen.getByText('Full Description')).toBeInTheDocument();

    // Click Features tab
    const featuresTab = screen.getByRole('button', { name: 'Features' });
    fireEvent.click(featuresTab);
    expect(screen.getByText('Product Features')).toBeInTheDocument();
    expect(screen.getByText('Organic cultivation')).toBeInTheDocument();

    // Click Specifications tab
    const specsTab = screen.getByRole('button', { name: 'Specifications' });
    fireEvent.click(specsTab);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Keep away from children')).toBeInTheDocument();
  });

  it('displays product features when available', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    // Go to Features tab
    const featuresTab = screen.getByRole('button', { name: 'Features' });
    fireEvent.click(featuresTab);

    expect(screen.getByText('Organic cultivation')).toBeInTheDocument();
    expect(screen.getByText('Lab tested')).toBeInTheDocument();
  });

  it('hides related products section when no related products', () => {
    render(
      <ProductDetailClient
        product={mockProduct}
        stockStatus="available"
        relatedProducts={[]}
      />
    );

    expect(screen.queryByText('You May Also Like')).not.toBeInTheDocument();
  });
});
