'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package, Calendar, User } from 'lucide-react';
import {
  getOrderInquiryById,
  getBudStyles,
  getBackgroundStyles,
  getFontStyles,
  getPreBaggingOptions
} from '@/lib/api/customization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  FlatOrderInquiry,
  BudStyle,
  BackgroundStyle,
  FontStyle,
  PreBaggingOption
} from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';
import { strapiApi } from '@/lib/api/strapi';

// Status badge variant mapping
const getStatusVariant = (
  status: string
): 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'default' => {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'reviewing':
      return 'in_review';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'fulfilled':
      return 'completed';
    default:
      return 'default';
  }
};

// Format status label
const formatStatusLabel = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const [order, setOrder] = useState<FlatOrderInquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customization data
  const [photos, setPhotos] = useState<any[]>([]);
  const [budStyles, setBudStyles] = useState<BudStyle[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundStyle[]>([]);
  const [fonts, setFonts] = useState<FontStyle[]>([]);
  const [preBaggingOptions, setPreBaggingOptions] = useState<PreBaggingOption[]>([]);

  useEffect(() => {
    fetchOrder();
    fetchCustomizationData();
  }, [orderId]);

  const fetchCustomizationData = async () => {
    try {
      const [photosData, budStylesData, backgroundsData, fontsData, preBaggingData] = await Promise.all([
        strapiApi.get('/api/product-photos', { params: { populate: '*' } }).catch(() => ({ data: { data: [] } })),
        getBudStyles().catch(() => []),
        getBackgroundStyles().catch(() => []),
        getFontStyles().catch(() => []),
        getPreBaggingOptions().catch(() => []),
      ]);

      setPhotos(photosData.data.data || []);
      setBudStyles(budStylesData);
      setBackgrounds(backgroundsData);
      setFonts(fontsData);
      setPreBaggingOptions(preBaggingData);
    } catch (err) {
      console.error('Error fetching customization data:', err);
      // Non-critical, so we don't show an error to the user
    }
  };

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrderInquiryById(orderId);

      // Transform Strapi response to flat structure
      const flatOrder: FlatOrderInquiry = {
        id: data.id,
        ...data.attributes,
        product: data.attributes.product?.data ? {
          id: data.attributes.product.data.id,
          name: data.attributes.product.data.attributes.name,
          sku: data.attributes.product.data.attributes.sku,
          category: data.attributes.product.data.attributes.category,
          images: data.attributes.product.data.attributes.images?.data.map(img => ({
            id: img.id,
            url: img.attributes.url,
            alternativeText: img.attributes.alternativeText,
          })),
        } : {
          id: 0,
          name: 'Unknown Product',
          category: '',
        },
        customer: data.attributes.customer?.data ? {
          id: data.attributes.customer.data.id,
          username: data.attributes.customer.data.attributes.username,
          email: data.attributes.customer.data.attributes.email,
        } : undefined,
      };

      setOrder(flatOrder);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {error || 'The order you are looking for could not be found.'}
          </p>
          <Button onClick={() => router.push('/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const product = order.product;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/orders')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-muted-foreground">
            {order.inquiry_number}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Status</span>
              <Badge variant={getStatusVariant(order.status)}>
                {formatStatusLabel(order.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {product.images && product.images.length > 0 && (
                <div className="flex-shrink-0">
                  <img
                    src={getImageUrl(product.images[0]) ?? undefined}
                    alt={product.images[0].alternativeText || product.name}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.sku}
                </p>
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customization Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Photos */}
            {order.selected_photos && order.selected_photos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Selected Photos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {order.selected_photos.map((photoId) => {
                    const photo = photos.find((p: any) => p.id === photoId);
                    return (
                      <div
                        key={photoId}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                      >
                        {photo?.attributes?.image?.data ? (
                          <img
                            src={getImageUrl(photo.attributes.image.data) ?? undefined}
                            alt={photo.attributes.name || 'Photo'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            Photo #{photoId}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bud Styles */}
            {order.selected_bud_styles && order.selected_bud_styles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Bud Styles</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {order.selected_bud_styles.map((styleId) => {
                    const style = budStyles.find((s) => s.id === styleId);
                    return (
                      <div
                        key={styleId}
                        className="px-3 py-2 bg-muted rounded-lg text-sm"
                      >
                        <p className="font-medium">{style?.attributes.name || `Style #${styleId}`}</p>
                        {style?.attributes.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {style.attributes.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Backgrounds */}
            {order.selected_backgrounds &&
              order.selected_backgrounds.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Backgrounds</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {order.selected_backgrounds.map((bgId) => {
                      const bg = backgrounds.find((b) => b.id === bgId);
                      return (
                        <div
                          key={bgId}
                          className="px-3 py-2 bg-muted rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {bg?.attributes.color_hex && (
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: bg.attributes.color_hex }}
                              />
                            )}
                            <span className="font-medium">
                              {bg?.attributes.name || `Background #${bgId}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Fonts */}
            {order.selected_fonts && order.selected_fonts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Fonts</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {order.selected_fonts.map((fontId) => {
                    const font = fonts.find((f) => f.id === fontId);
                    return (
                      <div
                        key={fontId}
                        className="px-3 py-2 bg-muted rounded-lg text-sm"
                      >
                        <p className="font-medium">{font?.attributes.name || `Font #${fontId}`}</p>
                        {font?.attributes.font_family && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {font.attributes.font_family}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pre-bagging */}
            {order.selected_prebagging &&
              order.selected_prebagging.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Pre-bagging Options</h4>
                  <div className="space-y-2">
                    {order.selected_prebagging.map((item, idx) => {
                      const option = preBaggingOptions.find((o) => o.id === item.option_id);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {option?.attributes.name || 'Pre-bagging Option'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.unit_size} {item.unit_size_unit} per unit
                              </p>
                            </div>
                            <span className="text-sm font-semibold">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          {item.custom_text && (
                            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                              Custom text: {item.custom_text}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {order.total_weight && order.total_weight > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Total Weight: {order.total_weight} {order.weight_unit || 'lb'}
                    </p>
                  )}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Additional Notes */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
