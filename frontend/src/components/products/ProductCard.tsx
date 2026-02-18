'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import type { Product, ProductPricing } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getImageUrl, getImageAlt } from '@/lib/utils/image';
import { HALF_WEIGHT_UNIT_DISPLAY, WEIGHT_UNIT_DISPLAY } from '@/lib/utils/units';

export type StockStatus = 'available' | 'unavailable';

interface ProductCardProps {
  product: Product;
  onCustomize?: () => void;
  stockStatus?: StockStatus;
}

function useProductCustomize(productId: number) {
  const router = useRouter();
  return useCallback(() => {
    router.push(`/products/${productId}/customize`);
  }, [router, productId]);
}

const getCategoryStyles = (category: 'Indica' | 'Hybrid') => {
  const styles = {
    Indica: 'bg-blue-100 text-blue-800',
    Hybrid: 'bg-purple-100 text-purple-800',
  };
  return styles[category];
};

const formatPrice = (price: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

const getStockBadge = (status?: StockStatus) => {
  if (!status) return null;

  const styles = {
    available: 'bg-green-500 text-white',
    unavailable: 'bg-neutral-500 text-white',
  };

  const labels = {
    available: 'Available',
    unavailable: 'Currently Unavailable',
  };

  return (
    <span className={`text-xs font-bold px-2 py-1 rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export function ProductCard({ product, onCustomize, stockStatus }: ProductCardProps) {
  const navigateToCustomize = useProductCustomize(product.id);
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
  const imageUrl = getImageUrl(currentImage);

  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card className="overflow-hidden bg-[#111] border border-white/10 rounded-sm hover:border-[hsl(var(--gold))]/50 transition-colors cursor-pointer">
        <div className="aspect-square relative bg-[#0d0d0d] group">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={getImageAlt(currentImage, attributes.name)}
              className="w-full h-full object-contain"
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
          {getStockBadge(stockStatus)}
          {attributes.on_sale && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
              On Sale
            </span>
          )}
          {attributes.featured && (
            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-xl font-medium text-white">{attributes.name}</CardTitle>
          <span
            className={`text-luxury-label px-2 py-1 rounded-sm ${getCategoryStyles(
              attributes.category
            )}`}
          >
            {attributes.category}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {attributes.tagline && (
          <p className="text-luxury-label text-white/40 mb-3">{attributes.tagline}</p>
        )}
        {attributes.thc_content && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground">THC:</span>
            <span className="text-xs font-semibold">{attributes.thc_content}</span>
          </div>
        )}

        {/* Price display - show per-pound/half-pound pricing or tiered pricing */}
        {attributes.base_price_per_pound && attributes.pricing_model === 'per_pound' ? (
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <p className="text-luxury-label text-white/40">Starting at</p>
            <p className="font-body text-lg font-medium text-white">
              {formatPrice(attributes.base_price_per_pound)}
              {attributes.pricing_unit === 'per_half_pound' ? HALF_WEIGHT_UNIT_DISPLAY : WEIGHT_UNIT_DISPLAY}
            </p>
          </div>
        ) : selectedPricing && attributes.pricing?.length > 0 ? (
          <>
            {/* Size selector - button group/pills */}
            <div className="mb-4">
              <p className="text-luxury-label text-white/40 mb-2">Select Size:</p>
              <div className="flex gap-2">
                {attributes.pricing.map((pricing) => (
                  <button
                    key={pricing.id}
                    type="button"
                    onClick={() => setSelectedPricing(pricing)}
                    className={`flex-1 px-3 py-2 text-luxury-label rounded-sm border transition-all ${
                      selectedPricing.id === pricing.id
                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]'
                        : 'border-white/10 text-white/40 hover:border-[hsl(var(--gold))]/30 hover:text-white/60'
                    }`}
                  >
                    {pricing.weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic price display */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <p className="text-luxury-label text-white/40">Price</p>
              <p className="font-body text-lg font-medium text-white">{formatPrice(selectedPricing.amount, selectedPricing.currency)}</p>
            </div>
          </>
        ) : null}

        {/* Customize button - only show if customization is enabled */}
        {attributes.customization_enabled && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <Button
              onClick={(e) => {
                e.preventDefault(); // Prevent Link navigation
                e.stopPropagation(); // Stop event bubbling
                if (onCustomize) {
                  onCustomize();
                } else {
                  navigateToCustomize();
                }
              }}
              className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-black hover:opacity-90 transition-opacity font-body text-luxury-label rounded-sm"
            >
              <Settings className="mr-2 h-3.5 w-3.5" />
              Customize
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </Link>
  );
}
