'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  DollarSign,
  Archive,
  CheckCircle2,
  Upload,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getAdminProduct,
  updateProduct,
  deleteProduct,
  publishProduct,
  unpublishProduct,
  updateProductInventory,
  uploadProductImages,
  deleteProductImage,
  type ProductWithInventory,
  type UpdateProductData,
  type InventoryUpdateData,
} from '@/lib/api/admin-products';
import { WEIGHT_UNIT } from '@/lib/utils/units';

export default function AdminProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = Number(params.id);
  const isEditMode = searchParams.get('edit') === 'true';

  const [product, setProduct] = useState<ProductWithInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateProductData>({});
  const [inventoryData, setInventoryData] = useState<InventoryUpdateData>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminProduct(productId);
      setProduct(data);

      // Initialize form data
      setFormData({
        name: data.attributes.name,
        sku: data.attributes.sku,
        category: data.attributes.category,
        description: data.attributes.description,
        tagline: data.attributes.tagline || '',
        full_description: data.attributes.full_description || '',
        best_for: data.attributes.best_for || '',
        warning: data.attributes.warning || '',
        thc_content: data.attributes.thc_content || '',
        flavor_profile: data.attributes.flavor_profile || '',
        product_url: data.attributes.product_url || '',
        on_sale: data.attributes.on_sale,
        featured: data.attributes.featured,
        sort_order: data.attributes.sort_order,
        base_price_per_pound: data.attributes.base_price_per_pound,
        pricing_model: data.attributes.pricing_model || 'per_pound',
        pricing_unit: data.attributes.pricing_unit || 'per_pound',
        grade_category: data.attributes.grade_category,
        sizes_available: data.attributes.sizes_available,
        customization_enabled: data.attributes.customization_enabled,
      });

      // Initialize inventory data
      if (data.inventory) {
        setInventoryData({
          quantity_in_stock: data.inventory.attributes.quantity_in_stock,
          reorder_point: data.inventory.attributes.reorder_point,
          reorder_quantity: data.inventory.attributes.reorder_quantity,
          location: data.inventory.attributes.location || '',
          batch_number: data.inventory.attributes.batch_number || '',
          notes: data.inventory.attributes.notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (field: keyof UpdateProductData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleInventoryChange = (field: keyof InventoryUpdateData, value: any) => {
    setInventoryData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      // Update product
      await updateProduct(product.id, formData);

      // Update inventory
      await updateProductInventory(product.id, inventoryData);

      toast.success('Product saved successfully');
      setHasChanges(false);
      fetchProduct();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!product) return;

    try {
      await publishProduct(product.id);
      toast.success('Product published');
      fetchProduct();
    } catch (error) {
      console.error('Failed to publish product:', error);
      toast.error('Failed to publish product');
    }
  };

  const handleUnpublish = async () => {
    if (!product) return;

    try {
      await unpublishProduct(product.id);
      toast.success('Product unpublished');
      fetchProduct();
    } catch (error) {
      console.error('Failed to unpublish product:', error);
      toast.error('Failed to unpublish product');
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
      router.push('/admin-portal/products');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'images' | 'bud_images' = 'images') => {
    if (!product || !e.target.files?.length) return;

    try {
      await uploadProductImages(product.id, Array.from(e.target.files), field);
      toast.success(`${field === 'bud_images' ? 'Bud images' : 'Images'} uploaded`);
      fetchProduct();
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast.error('Failed to upload images');
    }
  };

  const handleImageDelete = async (imageId: number) => {
    try {
      await deleteProductImage(imageId);
      toast.success('Image deleted');
      fetchProduct();
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Product not found</h2>
        <Link href="/admin-portal/products">
          <Button variant="link">Back to products</Button>
        </Link>
      </div>
    );
  }

  const isPublished = !!product.attributes.publishedAt;
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const images = product.attributes.images?.data || [];
  const budImages = product.attributes.bud_images?.data || [];

  const stockStatus = !product.inventory
    ? 'unknown'
    : product.inventory.attributes.quantity_in_stock <= 0
    ? 'out_of_stock'
    : product.inventory.attributes.quantity_in_stock <= product.inventory.attributes.reorder_point
    ? 'low_stock'
    : 'in_stock';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin-portal/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold ">{product.attributes.name}</h1>
              <StatusBadge
                status={isPublished ? 'published' : 'draft'}
                variant="published"
                showDot={false}
              />
            </div>
            <p className="text-sm text-muted-foreground">SKU: {product.attributes.sku}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
          {isPublished ? (
            <Button variant="outline" onClick={handleUnpublish}>
              <Archive className="mr-2 h-4 w-4" />
              Unpublish
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePublish}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => handleFormChange('sku', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleFormChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indica">Indica</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thc">THC Content</Label>
                  <Input
                    id="thc"
                    value={formData.thc_content || ''}
                    onChange={(e) => handleFormChange('thc_content', e.target.value)}
                    placeholder="e.g., 20-25%"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="grade_category">Grade Category</Label>
                  <Select
                    value={formData.grade_category || ''}
                    onValueChange={(value) => handleFormChange('grade_category', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High-end">High-end</SelectItem>
                      <SelectItem value="Mid-end">Mid-end</SelectItem>
                      <SelectItem value="Low-end">Low-end</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sizes_available">Sizes Available</Label>
                  <Select
                    value={formData.sizes_available || ''}
                    onValueChange={(value) => handleFormChange('sizes_available', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Large">Large</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Small">Small</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline || ''}
                  onChange={(e) => handleFormChange('tagline', e.target.value)}
                  placeholder="Short catchy description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flavor">Flavor Profile</Label>
                <Textarea
                  id="flavor"
                  value={formData.flavor_profile || ''}
                  onChange={(e) => handleFormChange('flavor_profile', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="best_for">Best For</Label>
                <Textarea
                  id="best_for"
                  value={formData.best_for || ''}
                  onChange={(e) => handleFormChange('best_for', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warning">Warning</Label>
                <Textarea
                  id="warning"
                  value={formData.warning || ''}
                  onChange={(e) => handleFormChange('warning', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload product photos for display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {images.map((image: any) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${strapiUrl}${image.attributes?.formats?.thumbnail?.url || image.attributes?.url}`}
                      alt={image.attributes?.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleImageDelete(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'images')}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Bud Images */}
          <Card>
            <CardHeader>
              <CardTitle>Bud Images (Customization)</CardTitle>
              <CardDescription>Upload bud images for customization slots (1-10 unique images per product)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {budImages.map((image: any) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${strapiUrl}${image.attributes?.formats?.thumbnail?.url || image.attributes?.url}`}
                      alt={image.attributes?.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleImageDelete(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="bud-image-upload"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'bud_images')}
                  className="hidden"
                />
                <label htmlFor="bud-image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload bud images (max 10)
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Base Price ($) {formData.pricing_unit === 'per_half_pound' ? `per 0.5 ${WEIGHT_UNIT}` : `per ${WEIGHT_UNIT}`}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.base_price_per_pound || ''}
                  onChange={(e) => handleFormChange('base_price_per_pound', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricing_unit">Pricing Unit</Label>
                <Select
                  value={formData.pricing_unit}
                  onValueChange={(value) => handleFormChange('pricing_unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_pound">Per Pound (1 {WEIGHT_UNIT})</SelectItem>
                    <SelectItem value="per_half_pound">Per Half Pound (0.5 {WEIGHT_UNIT})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricing_model">Pricing Model</Label>
                <Select
                  value={formData.pricing_model}
                  onValueChange={(value) => handleFormChange('pricing_model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_pound">Per Pound</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="on_sale"
                  checked={formData.on_sale}
                  onCheckedChange={(checked) => handleFormChange('on_sale', checked)}
                />
                <Label htmlFor="on_sale" className="text-sm">On Sale</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleFormChange('featured', checked)}
                />
                <Label htmlFor="featured" className="text-sm">Featured Product</Label>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory
              </CardTitle>
              <CardDescription>
                <StatusBadge status={stockStatus} variant="stock" showDot={false} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Quantity in Stock (lbs)</Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.1"
                  value={inventoryData.quantity_in_stock ?? ''}
                  onChange={(e) => handleInventoryChange('quantity_in_stock', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_point">Reorder Point (lbs)</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  step="0.1"
                  value={inventoryData.reorder_point ?? ''}
                  onChange={(e) => handleInventoryChange('reorder_point', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_qty">Reorder Quantity (lbs)</Label>
                <Input
                  id="reorder_qty"
                  type="number"
                  step="0.1"
                  value={inventoryData.reorder_quantity ?? ''}
                  onChange={(e) => handleInventoryChange('reorder_quantity', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={inventoryData.location || ''}
                  onChange={(e) => handleInventoryChange('location', e.target.value)}
                  placeholder="e.g., Warehouse A, Shelf 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch">Batch Number</Label>
                <Input
                  id="batch"
                  value={inventoryData.batch_number || ''}
                  onChange={(e) => handleInventoryChange('batch_number', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv_notes">Notes</Label>
                <Textarea
                  id="inv_notes"
                  value={inventoryData.notes || ''}
                  onChange={(e) => handleInventoryChange('notes', e.target.value)}
                  rows={2}
                />
              </div>

              {stockStatus === 'low_stock' && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Stock is below reorder point</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order ?? 0}
                  onChange={(e) => handleFormChange('sort_order', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customization"
                  checked={formData.customization_enabled}
                  onCheckedChange={(checked) => handleFormChange('customization_enabled', checked)}
                />
                <Label htmlFor="customization" className="text-sm">Enable Customization</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_url">External URL</Label>
                <Input
                  id="product_url"
                  value={formData.product_url || ''}
                  onChange={(e) => handleFormChange('product_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{product.attributes.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
