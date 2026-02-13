'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProducts, type GetProductsParams } from '@/lib/api/products';
import { getInventory } from '@/lib/api/inventory';
import { type StockStatus } from '@/components/products/ProductCard';
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
    <div>
      {/* Full-screen video hero */}
      <VideoHero
        videoSrc="/logo-bg.mp4"
        title="Premium Cannabis Products"
        subtitle="Explore our curated collection of premium strains"
      />

      {/* Products content section */}
      <section id="products-content" className="py-8">
        <div className="mb-8" data-tour="res-products-header">
          <h1 className="text-3xl font-bold mb-2">Product Catalog</h1>
          <p className="text-muted-foreground">
            Browse our premium cannabis products
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel - Sidebar */}
        <div className="lg:col-span-1" data-tour="res-products-filter-panel">
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3" data-tour="res-products-grid">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
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
