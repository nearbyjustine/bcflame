import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductById, getRelatedProducts } from '@/lib/api/products';
import { getInventory } from '@/lib/api/inventory';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import type { StockStatus } from '@/components/products/ProductCard';

interface ProductDetailPageProps {
  params: { id: string };
}

// Helper function to determine stock status from inventory data
function determineStockStatus(productId: number, inventoryData: any[]): StockStatus {
  if (!inventoryData || inventoryData.length === 0) {
    return 'unavailable';
  }

  const inventoryItem = inventoryData.find(
    (item) => item.attributes?.product?.data?.id === productId
  );

  if (!inventoryItem) {
    return 'unavailable';
  }

  return inventoryItem.attributes.quantity_in_stock > 0
    ? 'available'
    : 'unavailable';
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  try {
    const productId = Number(params.id);
    const productResponse = await getProductById(productId);
    const product = productResponse.data;

    return {
      title: `${product.attributes.name} - ${product.attributes.category} | BC Flame`,
      description:
        product.attributes.description ||
        product.attributes.tagline ||
        `Premium ${product.attributes.category} cannabis product from BC Flame`,
    };
  } catch (error) {
    return {
      title: 'Product Not Found | BC Flame',
      description: 'The requested product could not be found.',
    };
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const productId = Number(params.id);

  // Validate product ID
  if (isNaN(productId) || productId <= 0) {
    notFound();
  }

  try {
    // Parallel fetch for critical data (product + inventory)
    const [productResponse, inventoryResponse] = await Promise.all([
      getProductById(productId),
      getInventory({ productId }),
    ]);

    const product = productResponse.data;
    const inventoryData = inventoryResponse.data;

    // Determine stock status for current product
    const stockStatus = determineStockStatus(productId, inventoryData);

    // Fetch related products (same category, excluding current product)
    const relatedProductsResponse = await getRelatedProducts(
      productId,
      product.attributes.category,
      4
    );

    // Fetch inventory for related products (for stock badges)
    const relatedProductIds = relatedProductsResponse.data.map((p) => p.id);
    const relatedInventoryPromises = relatedProductIds.map((id) =>
      getInventory({ productId: id }).catch(() => ({ data: [] }))
    );
    const relatedInventoryResponses = await Promise.all(relatedInventoryPromises);
    const relatedProductsInventory = relatedInventoryResponses.flatMap(
      (response) => response.data
    );

    return (
      <ProductDetailClient
        product={product}
        stockStatus={stockStatus}
        relatedProducts={relatedProductsResponse.data}
        relatedProductsInventory={relatedProductsInventory}
      />
    );
  } catch (error: any) {
    // Handle 404 errors specifically
    if (error.response?.status === 404) {
      notFound();
    }

    // Re-throw other errors to be caught by error.tsx
    throw error;
  }
}
