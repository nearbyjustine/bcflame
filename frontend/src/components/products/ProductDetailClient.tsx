'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { Settings } from 'lucide-react';
import type { Product } from '@/types/product';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductCard, type StockStatus } from './ProductCard';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { HALF_WEIGHT_UNIT_DISPLAY, WEIGHT_UNIT_DISPLAY } from '@/lib/utils/units';

interface ProductDetailClientProps {
  product: Product;
  stockStatus: StockStatus;
  relatedProducts: Product[];
  relatedProductsInventory?: any[];
}

const getCategoryStyles = (category: 'Indica' | 'Hybrid') => {
  const styles = {
    Indica: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Hybrid: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };
  return styles[category];
};

const formatPrice = (price: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

function getStockStatus(productId: number, inventory: any[]): StockStatus {
  if (!inventory || inventory.length === 0) return 'unavailable';

  const item = inventory.find(
    (inv) => inv.attributes?.product?.data?.id === productId
  );

  if (!item) return 'unavailable';

  return item.attributes.quantity_in_stock > 0 ? 'available' : 'unavailable';
}

export function ProductDetailClient({
  product,
  stockStatus,
  relatedProducts,
  relatedProductsInventory = [],
}: ProductDetailClientProps) {
  const { attributes } = product;
  const images = attributes.images?.data || [];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'details' | 'features' | 'specs'>('details');

  // Filter out current product from related products (belt-and-suspenders)
  const filteredRelatedProducts = relatedProducts.filter((p) => p.id !== product.id);

  const showCustomizeButton =
    attributes.customization_enabled === true && stockStatus === 'available';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          { label: attributes.category, href: `/products?category=${attributes.category}` },
          { label: attributes.name },
        ]}
      />

      {/* Main Product Section - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column: Image Gallery */}
        <div>
          <ProductImageGallery images={images} productName={attributes.name} />
        </div>

        {/* Right Column: Product Information */}
        <div className="space-y-6">
          {/* Product Header */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-3xl font-bold">{attributes.name}</h1>
              <Badge className={getCategoryStyles(attributes.category)}>
                {attributes.category}
              </Badge>
            </div>

            {/* Stock Status Badge */}
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant={stockStatus === 'available' ? 'default' : 'destructive'}
                className={
                  stockStatus === 'available'
                    ? 'bg-green-500 hover:bg-green-600'
                    : ''
                }
              >
                {stockStatus === 'available' ? 'In Stock' : 'Out of Stock'}
              </Badge>
              {attributes.on_sale && (
                <Badge variant="destructive">On Sale</Badge>
              )}
              {attributes.featured && (
                <Badge className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Featured
                </Badge>
              )}
            </div>

            {/* SKU */}
            <p className="text-sm text-muted-foreground">SKU: {attributes.sku}</p>
          </div>

          {/* Tagline */}
          {attributes.tagline && (
            <p className="text-lg text-muted-foreground italic">{attributes.tagline}</p>
          )}

          {/* Description */}
          {attributes.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{attributes.description}</p>
            </div>
          )}

          {/* Product Specs */}
          <div className="grid grid-cols-2 gap-4">
            {attributes.thc_content && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">THC Content</p>
                <p className="text-lg font-semibold">{attributes.thc_content}</p>
              </div>
            )}
            {attributes.flavor_profile && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flavor Profile</p>
                <p className="text-lg font-semibold">{attributes.flavor_profile}</p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border-t border-b py-4">
            {attributes.base_price_per_pound && attributes.pricing_model === 'per_pound' ? (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Price {attributes.pricing_unit === 'per_half_pound' ? 'per half pound' : 'per pound'}
                </p>
                <p className="text-3xl font-bold">
                  {formatPrice(attributes.base_price_per_pound)}
                  {attributes.pricing_unit === 'per_half_pound' ? HALF_WEIGHT_UNIT_DISPLAY : WEIGHT_UNIT_DISPLAY}
                </p>
              </div>
            ) : attributes.pricing && attributes.pricing.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Available Sizes</p>
                <div className="space-y-2">
                  {attributes.pricing.map((pricing) => (
                    <div
                      key={pricing.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{pricing.weight}</span>
                      <span className="text-lg font-bold">
                        {formatPrice(pricing.amount, pricing.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Contact us for pricing</p>
            )}
          </div>

          {/* Customize Button */}
          {showCustomizeButton ? (
            <Button
              onClick={() => router.push(`/products/${product.id}/customize`)}
              className="w-full bg-gradient-to-r from-primary to-destructive hover:opacity-90 transition-opacity"
              size="lg"
            >
              <Settings className="mr-2 h-5 w-5" />
              Customize & Order
            </Button>
          ) : stockStatus === 'unavailable' ? (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                This product is currently unavailable. Please check back later or contact us for more information.
              </p>
            </div>
          ) : !attributes.customization_enabled ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                This product doesn&apos;t support customization. Please contact us for bulk orders.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tabs Section - Details, Features, Specifications */}
      <div className="mb-12">
        <div className="border-b mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Details
            </button>
            {attributes.features && attributes.features.length > 0 && (
              <button
                onClick={() => setActiveTab('features')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'features'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Features
              </button>
            )}
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Specifications
            </button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {attributes.full_description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Full Description</h3>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(attributes.full_description, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h3', 'h4', 'h5'],
                        ALLOWED_ATTR: []
                      })
                    }}
                  />
                </div>
              )}
              {attributes.best_for && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Best For</h3>
                  <p className="text-muted-foreground">{attributes.best_for}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'features' && attributes.features && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Product Features</h3>
              <ul className="space-y-2">
                {attributes.features.map((feature) => (
                  <li key={feature.id} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="font-semibold">{attributes.sku}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="font-semibold">{attributes.category}</p>
                </div>
                {attributes.thc_content && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      THC Content
                    </p>
                    <p className="font-semibold">{attributes.thc_content}</p>
                  </div>
                )}
                {attributes.flavor_profile && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Flavor Profile
                    </p>
                    <p className="font-semibold">{attributes.flavor_profile}</p>
                  </div>
                )}
                {attributes.grade_category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Grade Category
                    </p>
                    <p className="font-semibold">{attributes.grade_category}</p>
                  </div>
                )}
                {attributes.sizes_available && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Sizes Available
                    </p>
                    <p className="font-semibold">{attributes.sizes_available}</p>
                  </div>
                )}
              </div>
              {attributes.warning && (
                <div className="mt-4 p-4 bg-accent border border-accent rounded-lg">
                  <h4 className="text-sm font-semibold text-accent-foreground mb-1">
                    Warning
                  </h4>
                  <p className="text-sm text-accent-foreground">{attributes.warning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {filteredRelatedProducts.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRelatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                stockStatus={getStockStatus(
                  relatedProduct.id,
                  relatedProductsInventory
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
