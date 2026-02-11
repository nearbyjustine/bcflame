import type { Product } from '@/types/product';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    attributes: {
      name: "Gas Gummies",
      description: "Premium infused gummies with high potency and consistent dosing. Perfect for experienced users seeking reliable effects.",
      tagline: "Sweet relief, serious effects",
      category: "Hybrid",
      thc_content: "25-30%",
      base_price_per_pound: 2500,
      pricing_model: "per_pound",
      pricing_unit: "per_pound",
      customization_enabled: true,
      images: { data: [] },
      featured: true,
      on_sale: false,
      createdAt: "",
      updatedAt: "",
      publishedAt: ""
    }
  },
  {
    id: 2,
    attributes: {
      name: "Purple Haze",
      description: "Classic strain with vibrant purple hues and a sweet berry aroma. Known for its uplifting and creative effects.",
      tagline: "Elevate your experience",
      category: "Sativa",
      thc_content: "20-25%",
      base_price_per_pound: 2300,
      pricing_model: "per_pound",
      pricing_unit: "per_pound",
      customization_enabled: true,
      images: { data: [] },
      featured: true,
      on_sale: false,
      createdAt: "",
      updatedAt: "",
      publishedAt: ""
    }
  }
];
