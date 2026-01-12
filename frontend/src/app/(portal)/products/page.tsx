'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProducts, type GetProductsParams } from '@/lib/api/products';
import { ProductCard } from '@/components/products/ProductCard';
import { CustomizationModal } from '@/components/products/CustomizationModal';
import { FilterPanel } from '@/components/products/FilterPanel';
import type { Product } from '@/types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customizingProductId, setCustomizingProductId] = useState<number | null>(null);
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
      const response = await getProducts(filters);
      setProducts(response.data);
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

  const customizingProduct = products.find((p) => p.id === customizingProductId);

  const handleCustomize = (productId: number) => {
    setCustomizingProductId(productId);
  };

  const handleCloseModal = () => {
    setCustomizingProductId(null);
  };

  const handleFilterChange = (newFilters: GetProductsParams) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse our premium cannabis products
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel - Sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
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
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCustomize={() => handleCustomize(product.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      {customizingProduct && (
        <CustomizationModal
          isOpen={!!customizingProduct}
          onClose={handleCloseModal}
          product={customizingProduct}
        />
      )}
    </div>
  );
}
