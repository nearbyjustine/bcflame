'use client';

import { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import type { Product, ProductPricing } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  onCustomize?: () => void;
}

const getCategoryStyles = (category: 'Indica' | 'Hybrid' | 'Sativa') => {
  const styles = {
    Indica: 'bg-blue-100 text-blue-800',
    Hybrid: 'bg-purple-100 text-purple-800',
    Sativa: 'bg-green-100 text-green-800',
  };
  return styles[category];
};

const formatPrice = (price: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

export function ProductCard({ product, onCustomize }: ProductCardProps) {
  const { attributes } = product;
  const images = attributes.images?.data || [];

  // State for selected size (default to first available pricing)
  const [selectedPricing, setSelectedPricing] = useState<ProductPricing | null>(
    attributes.pricing?.[0] || null
  );

  // State for current image index in carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const currentImage = images[currentImageIndex];
  const imageUrl = currentImage?.attributes?.url && process.env.NEXT_PUBLIC_STRAPI_URL
    ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${currentImage.attributes.url}`
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative bg-muted group">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={currentImage?.attributes?.alternativeText || attributes.name}
              className="w-full h-full object-cover"
            />

            {/* Carousel Navigation - Only show if multiple images */}
            {images.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-4'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Badges */}
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

        {/* Size selector and price display - only show if pricing is available */}
        {selectedPricing && attributes.pricing?.length > 0 && (
          <>
            {/* Size selector - button group/pills */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Select Size:</p>
              <div className="flex gap-2">
                {attributes.pricing.map((pricing) => (
                  <button
                    key={pricing.id}
                    onClick={() => setSelectedPricing(pricing)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedPricing.id === pricing.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50'
                    }`}
                  >
                    {pricing.weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic price display */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-xl font-bold">{formatPrice(selectedPricing.amount, selectedPricing.currency)}</p>
            </div>
          </>
        )}

        {/* Customize button - only show if customization is enabled */}
        {attributes.customization_enabled && onCustomize && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={onCustomize}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:opacity-90 transition-opacity"
            >
              <Settings className="mr-2 h-4 w-4" />
              Customize & Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
