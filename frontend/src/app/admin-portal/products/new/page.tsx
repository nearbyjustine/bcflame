'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Package, DollarSign, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  createProduct,
  updateProductInventory,
  uploadProductImages,
  type CreateProductData,
  type InventoryUpdateData,
} from '@/lib/api/admin-products';
import { WEIGHT_UNIT } from '@/lib/utils/units';

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    sku: '',
    category: 'Indica',
    description: '',
    tagline: '',
    thc_content: '',
    flavor_profile: '',
    best_for: '',
    warning: '',
    product_url: '',
    on_sale: false,
    featured: false,
    sort_order: 0,
    base_price_per_pound: 0,
    pricing_model: 'per_pound',
    pricing_unit: 'per_pound',
    grade_category: undefined,
    sizes_available: undefined,
    customization_enabled: false,
  });

  const [inventoryData, setInventoryData] = useState<InventoryUpdateData>({
    quantity_in_stock: 0,
    reorder_point: 10,
    reorder_quantity: 50,
    location: '',
    batch_number: '',
    notes: '',
  });

  // Image upload state
  const [productImages, setProductImages] = useState<File[]>([]);
  const [budImages, setBudImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [budImagePreviews, setBudImagePreviews] = useState<string[]>([]);

  const handleFormChange = (field: keyof CreateProductData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInventoryChange = (field: keyof InventoryUpdateData, value: any) => {
    setInventoryData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'bud') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    if (type === 'product') {
      setProductImages(fileArray);
      // Create previews
      const previews = fileArray.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else {
      // Limit bud images to 10
      const limitedFiles = fileArray.slice(0, 10);
      if (fileArray.length > 10) {
        toast.warning('Maximum 10 bud images allowed. Only first 10 will be used.');
      }
      setBudImages(limitedFiles);
      // Create previews
      const previews = limitedFiles.map((file) => URL.createObjectURL(file));
      setBudImagePreviews(previews);
    }
  };

  const handleRemoveImage = (index: number, type: 'product' | 'bud') => {
    if (type === 'product') {
      const newImages = [...productImages];
      const newPreviews = [...imagePreviews];
      URL.revokeObjectURL(newPreviews[index]);
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);
      setProductImages(newImages);
      setImagePreviews(newPreviews);
    } else {
      const newImages = [...budImages];
      const newPreviews = [...budImagePreviews];
      URL.revokeObjectURL(newPreviews[index]);
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);
      setBudImages(newImages);
      setBudImagePreviews(newPreviews);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    // Validation
    if (!formData.name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.sku?.trim()) {
      toast.error('SKU is required');
      return;
    }
    if (!formData.description?.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSaving(true);
    let createdProductId: number | null = null;

    try {
      // Step 1: Create product
      const product = await createProduct(formData);
      createdProductId = product.id;

      // Step 2: Create inventory (with fallback)
      try {
        await updateProductInventory(product.id, inventoryData);
      } catch (invError) {
        console.error('Failed to create inventory:', invError);
        toast.warning('Product created, but inventory setup failed. You can update it later.');
      }

      // Step 3: Upload product images (with fallback)
      if (productImages.length > 0) {
        try {
          await uploadProductImages(product.id, productImages, 'images');
          toast.success(`Uploaded ${productImages.length} product image(s)`);
        } catch (imgError) {
          console.error('Failed to upload product images:', imgError);
          toast.warning('Product created, but image upload failed. You can add images later.');
        }
      }

      // Step 4: Upload bud images (with fallback)
      if (budImages.length > 0) {
        try {
          await uploadProductImages(product.id, budImages, 'bud_images');
          toast.success(`Uploaded ${budImages.length} bud image(s)`);
        } catch (budImgError) {
          console.error('Failed to upload bud images:', budImgError);
          toast.warning('Product created, but bud image upload failed. You can add images later.');
        }
      }

      toast.success('Product created successfully');

      // Clean up preview URLs
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      budImagePreviews.forEach((url) => URL.revokeObjectURL(url));

      router.push(`/admin-portal/products/${product.id}`);
    } catch (error: any) {
      console.error('Failed to create product:', error);
      const message = error.response?.data?.error?.message || 'Failed to create product';
      toast.error(message);

      // If product was created but subsequent steps failed, still navigate to edit page
      if (createdProductId) {
        toast.info('Navigating to product edit page...');
        router.push(`/admin-portal/products/${createdProductId}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold">New Product</h1>
            <p className="text-sm text-muted-foreground">Add a new product to your catalog</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Product'}
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
              <CardDescription>Enter the core product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">
                    SKU <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleFormChange('sku', e.target.value)}
                    placeholder="e.g., IND-001"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'Indica' | 'Hybrid') => handleFormChange('category', value)}
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
                    value={formData.thc_content}
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
                  value={formData.tagline}
                  onChange={(e) => handleFormChange('tagline', e.target.value)}
                  placeholder="Short catchy description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={4}
                  placeholder="Detailed product description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flavor">Flavor Profile</Label>
                <Textarea
                  id="flavor"
                  value={formData.flavor_profile}
                  onChange={(e) => handleFormChange('flavor_profile', e.target.value)}
                  rows={2}
                  placeholder="Describe the taste and aroma"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="best_for">Best For</Label>
                <Textarea
                  id="best_for"
                  value={formData.best_for}
                  onChange={(e) => handleFormChange('best_for', e.target.value)}
                  rows={2}
                  placeholder="Recommended uses"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warning">Warning</Label>
                <Textarea
                  id="warning"
                  value={formData.warning}
                  onChange={(e) => handleFormChange('warning', e.target.value)}
                  rows={2}
                  placeholder="Any warnings or cautions"
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
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Product preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, 'product')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="product-image-upload"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 'product')}
                  className="hidden"
                />
                <label htmlFor="product-image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {imagePreviews.length > 0
                      ? `${imagePreviews.length} image(s) selected - Click to change`
                      : 'Click to select product images'}
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Bud Images */}
          <Card>
            <CardHeader>
              <CardTitle>Bud Images (Customization)</CardTitle>
              <CardDescription>Upload bud images for customization slots (max 10 images)</CardDescription>
            </CardHeader>
            <CardContent>
              {budImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {budImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Bud preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index, 'bud')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="bud-image-upload"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 'bud')}
                  className="hidden"
                />
                <label htmlFor="bud-image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {budImagePreviews.length > 0
                      ? `${budImagePreviews.length} of 10 image(s) selected - Click to change`
                      : 'Click to select bud images (max 10)'}
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
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricing_unit">Pricing Unit</Label>
                <Select
                  value={formData.pricing_unit}
                  onValueChange={(value: 'per_pound' | 'per_half_pound') => handleFormChange('pricing_unit', value)}
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
                  onValueChange={(value: 'per_pound' | 'tiered') => handleFormChange('pricing_model', value)}
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
                  onCheckedChange={(checked) => handleFormChange('on_sale', !!checked)}
                />
                <Label htmlFor="on_sale" className="text-sm">On Sale</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleFormChange('featured', !!checked)}
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
                Initial Inventory
              </CardTitle>
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
                  placeholder="0"
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
                  placeholder="10"
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
                  placeholder="50"
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
                  placeholder="Optional"
                />
              </div>
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
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customization"
                  checked={formData.customization_enabled}
                  onCheckedChange={(checked) => handleFormChange('customization_enabled', !!checked)}
                />
                <Label htmlFor="customization" className="text-sm">Enable Customization</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_url">External URL</Label>
                <Input
                  id="product_url"
                  value={formData.product_url}
                  onChange={(e) => handleFormChange('product_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
