'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProducts, type GetProductsParams } from '@/lib/api/products';
import { getInventory } from '@/lib/api/inventory';
import type { StockStatus } from '@/components/products/ProductCard';
import { AnimatedProductCard } from '@/components/products/AnimatedProductCard';
import { VideoHero } from '@/components/products/VideoHero';
import { FilterPanel } from '@/components/products/FilterPanel';
import type { Product } from '@/types/product';
import type { Inventory } from '@/types/inventory';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { resellerProductsSteps } from '@/hooks/tours/resellerTours';

function getStockStatus(productId: number, inventory: Inventory[]): StockStatus {
  const items = inventory.filter((i) => i.attributes.product?.data?.id === productId);
  if (items.length === 0) return 'unavailable';

  const totalStock = items.reduce((sum, i) => sum + i.attributes.quantity_in_stock, 0);
  return totalStock > 0 ? 'available' : 'unavailable';
}

export default function ProductsPage() {
  useOnboardingTour({ moduleKey: 'products', steps: resellerProductsSteps });
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GetProductsParams>({
    search: undefined,
    category: undefined,
    featured: undefined,
    onSale: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minTHC: undefined,
    maxTHC: undefined,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [productsResponse, inventoryResponse] = await Promise.all([
        getProducts(filters),
        getInventory(),
      ]);
      setProducts(productsResponse.data);
      setInventory(inventoryResponse.data);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (newFilters: GetProductsParams) => {
    setFilters(newFilters);
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      {/* Full-screen video hero — full bleed, no layout container */}
      <div className="relative w-full">
        <VideoHero
          videoSrc="/logo-bg.mp4"
          title="Premium Collection"
          subtitle="Curated cannabis products, crafted for discerning partners"
        />
      </div>

      {/* Products content section */}
      <section id="products-content" className="px-6 py-12 mx-auto max-w-screen-2xl">
        <div className="mb-10" data-tour="res-products-header">
          <h2 className="text-luxury-lg font-display text-white mb-2">The Collection</h2>
          <p className="text-luxury-label text-white/40">
            — {products.length > 0 ? `${products.length} Products Available` : 'Loading...'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel - Sidebar */}
          <div className="lg:col-span-1" data-tour="res-products-filter-panel">
            <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden">
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3" data-tour="res-products-grid">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border border-[hsl(var(--gold))] border-t-transparent mx-auto" />
                  <p className="mt-4 text-luxury-label text-white/40">Loading products...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <button
                    type="button"
                    onClick={fetchProducts}
                    className="px-4 py-2 bg-[hsl(var(--gold))] text-black text-luxury-label rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <p className="font-display text-lg text-white/40 mb-2">No products found</p>
                  <p className="text-luxury-label text-white/25">
                    Try adjusting your filters or search query
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 text-luxury-label text-white/30">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <AnimatedProductCard
                      key={product.id}
                      product={product}
                      stockStatus={getStockStatus(product.id, inventory)}
                      index={index}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
