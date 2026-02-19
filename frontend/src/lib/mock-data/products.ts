import type { Product } from '@/types/product';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    attributes: {
      name: "Gas Gummies",
      sku: "GG-001",
      description: "Premium infused gummies with high potency and consistent dosing. Perfect for experienced users seeking reliable effects.",
      tagline: "Sweet relief, serious effects",
      category: "Hybrid",
      thc_content: "25-30%",
      base_price_per_pound: 2500,
      pricing_model: "per_pound",
      pricing_unit: "per_pound",
      pricing: [],
      customization_enabled: true,
      images: { data: [] },
      featured: true,
      on_sale: false,
      sort_order: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      publishedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  {
    id: 2,
    attributes: {
      name: "Purple Haze",
      sku: "PH-002",
      description: "Classic strain with vibrant purple hues and a sweet berry aroma. Known for its uplifting and creative effects.",
      tagline: "Elevate your experience",
      category: "Hybrid",
      thc_content: "20-25%",
      base_price_per_pound: 2300,
      pricing_model: "per_pound",
      pricing_unit: "per_pound",
      pricing: [],
      customization_enabled: true,
      images: { data: [] },
      featured: true,
      on_sale: false,
      sort_order: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      publishedAt: "2024-01-01T00:00:00.000Z"
    }
  }
];
