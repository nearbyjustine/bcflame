'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUpload } from '@/components/admin/styles/ImageUpload';
import { ColorExtractor } from '@/components/admin/styles/ColorExtractor';
import { StylePreview } from '@/components/admin/styles/StylePreview';

import { createBackgroundStyle } from '@/lib/api/admin-styles';

const backgroundStyleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['solid_color', 'gradient', 'texture', 'image'], {
    required_error: 'Please select a type',
  }),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  text_background: z.string().optional(),
  sort_order: z.number().int().min(0).default(0),
});

type BackgroundStyleFormData = z.infer<typeof backgroundStyleSchema>;

export default function NewBackgroundStylePage() {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BackgroundStyleFormData>({
    resolver: zodResolver(backgroundStyleSchema),
    defaultValues: {
      type: 'solid_color',
      sort_order: 0,
    },
  });

  const watchType = watch('type');
  const watchColorHex = watch('color_hex');
  const watchTextColor = watch('text_color');
  const watchTextBg = watch('text_background');

  const handleImageChange = (file: File | null) => {
    setPreviewImage(file);
  };

  const handleColorsExtracted = (colors: { textColor: string; textBackground: string }) => {
    setValue('text_color', colors.textColor);
    setValue('text_background', colors.textBackground);
  };

  const onSubmit = async (data: BackgroundStyleFormData) => {
    setIsSubmitting(true);
    try {
      await createBackgroundStyle(
        {
          name: data.name,
          type: data.type,
          color_hex: data.color_hex,
          text_color: data.text_color,
          text_background: data.text_background,
          sort_order: data.sort_order,
        },
        previewImage || undefined
      );

      toast.success('Background style created successfully');
      router.push('/admin-portal/styles/backgrounds');
    } catch (error) {
      console.error('Failed to create background style:', error);
      toast.error('Failed to create background style');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Background Style</h1>
        <p className="text-muted-foreground mt-2">
          Add a new background style for product customization
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the background style details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Forest Green"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <RadioGroup
                    value={watchType}
                    onValueChange={(value) =>
                      setValue('type', value as 'solid_color' | 'gradient' | 'texture' | 'image')
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="solid_color" id="solid_color" />
                      <Label htmlFor="solid_color" className="font-normal cursor-pointer">
                        Solid Color
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gradient" id="gradient" />
                      <Label htmlFor="gradient" className="font-normal cursor-pointer">
                        Gradient
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="texture" id="texture" />
                      <Label htmlFor="texture" className="font-normal cursor-pointer">
                        Texture
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="image" />
                      <Label htmlFor="image" className="font-normal cursor-pointer">
                        Image
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                  )}
                </div>

                {/* Color Hex (for solid_color and gradient) */}
                {(watchType === 'solid_color' || watchType === 'gradient') && (
                  <div className="space-y-2">
                    <Label htmlFor="color_hex">
                      Color {watchType === 'solid_color' ? '*' : '(Base Color) *'}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        {...register('color_hex')}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        {...register('color_hex')}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                    {errors.color_hex && (
                      <p className="text-sm text-destructive">{errors.color_hex.message}</p>
                    )}
                  </div>
                )}

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    {...register('sort_order', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.sort_order && (
                    <p className="text-sm text-destructive">{errors.sort_order.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preview Image */}
            <Card>
              <CardHeader>
                <CardTitle>Preview Image</CardTitle>
                <CardDescription>
                  {watchType === 'texture' || watchType === 'image'
                    ? 'Required for texture and image backgrounds'
                    : 'Optional for solid color and gradient backgrounds'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={previewImage || undefined}
                  onChange={handleImageChange}
                  onImageLoad={handleImageChange}
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                />
              </CardContent>
            </Card>

            {/* Color Extraction */}
            {previewImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                  <CardDescription>
                    Auto-extracted from image or set manually
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ColorExtractor
                    imageFile={previewImage}
                    onColorsExtracted={handleColorsExtracted}
                  />
                </CardContent>
              </Card>
            )}

            {/* Manual Text Colors (when no image) */}
            {!previewImage && (
              <Card>
                <CardHeader>
                  <CardTitle>Text Colors (Optional)</CardTitle>
                  <CardDescription>
                    Set text color and background for overlay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        {...register('text_color')}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        {...register('text_color')}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text_background">Text Background</Label>
                    <Input
                      type="text"
                      {...register('text_background')}
                      placeholder="rgba(0, 0, 0, 0.3)"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  See how the background style will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StylePreview
                  type="background"
                  backgroundType={watchType}
                  backgroundValue={
                    watchType === 'solid_color' || watchType === 'gradient'
                      ? watchColorHex
                      : previewImage
                      ? URL.createObjectURL(previewImage)
                      : undefined
                  }
                  textColor={watchTextColor}
                  textBackground={watchTextBg}
                  size="lg"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Background Style'}
          </Button>
        </div>
      </form>
    </div>
  );
}
