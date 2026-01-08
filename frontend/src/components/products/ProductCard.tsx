'use client';

import type { Product } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductCardProps {
  product: Product;
}

const getCategoryStyles = (category: 'Indica' | 'Hybrid' | 'Sativa') => {
  const styles = {
    Indica: 'bg-blue-100 text-blue-800',
    Hybrid: 'bg-purple-100 text-purple-800',
    Sativa: 'bg-green-100 text-green-800',
  };
  return styles[category];
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export function ProductCard({ product }: ProductCardProps) {
  const { attributes } = product;
  const firstImage = attributes.images?.data?.[0];
  const imageUrl = firstImage?.url && process.env.NEXT_PUBLIC_STRAPI_URL
    ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${firstImage.url}`
    : null;
  const lowestPrice = attributes.pricing.reduce(
    (min, p) => (p.price < min ? p.price : min),
    attributes.pricing[0].price
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={firstImage?.alternativeText || attributes.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {attributes.on_sale && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              On Sale
            </span>
          )}
          {attributes.featured && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{attributes.name}</CardTitle>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${getCategoryStyles(
              attributes.category
            )}`}
          >
            {attributes.category}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {attributes.tagline && (
          <p className="text-sm text-muted-foreground mb-2">{attributes.tagline}</p>
        )}
        {attributes.thc_content && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground">THC:</span>
            <span className="text-xs font-semibold">{attributes.thc_content}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Starting from</p>
          <p className="text-lg font-bold">{formatPrice(lowestPrice)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
