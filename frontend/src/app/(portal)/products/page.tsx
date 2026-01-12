'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProducts } from '@/lib/api/products';
import { ProductCard } from '@/components/products/ProductCard';
import { CustomizationModal } from '@/components/products/CustomizationModal';
import type { Product } from '@/types/product';

type CategoryFilter = 'All' | 'Indica' | 'Hybrid' | 'Sativa';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [customizingProductId, setCustomizingProductId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProducts(
        categoryFilter !== 'All' ? { category: categoryFilter } : undefined
      );
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories: CategoryFilter[] = ['All', 'Indica', 'Hybrid', 'Sativa'];

  const customizingProduct = products.find((p) => p.id === customizingProductId);

  const handleCustomize = (productId: number) => {
    setCustomizingProductId(productId);
  };

  const handleCloseModal = () => {
    setCustomizingProductId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Product Catalog</h1>
        <p className="text-muted-foreground">
          Browse our premium cannabis products
        </p>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                categoryFilter === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

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
              Try selecting a different category
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomize={() => handleCustomize(product.id)}
            />
          ))}
        </div>
      )}

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
