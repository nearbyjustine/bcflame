'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUpload } from '@/components/admin/styles/ImageUpload';
import { ColorExtractor } from '@/components/admin/styles/ColorExtractor';
import { StylePreview } from '@/components/admin/styles/StylePreview';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getBackgroundStyleById,
  updateBackgroundStyle,
  deleteBackgroundStyle,
  publishBackgroundStyle,
  unpublishBackgroundStyle,
} from '@/lib/api/admin-styles';
import type { BackgroundStyle } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';

const backgroundStyleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['solid_color', 'gradient', 'texture', 'image']),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  text_background: z.string().optional(),
  sort_order: z.number().int().min(0).default(0),
});

type BackgroundStyleFormData = z.infer<typeof backgroundStyleSchema>;

export default function EditBackgroundStylePage() {
  const router = useRouter();
  const params = useParams();
  const styleId = parseInt(params.id as string);

  const [style, setStyle] = useState<BackgroundStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<File | string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BackgroundStyleFormData>({
    resolver: zodResolver(backgroundStyleSchema),
  });

  const watchType = watch('type');
  const watchColorHex = watch('color_hex');
  const watchTextColor = watch('text_color');
  const watchTextBg = watch('text_background');

  // Fetch style data
  useEffect(() => {
    const fetchStyle = async () => {
      try {
        const data = await getBackgroundStyleById(styleId);
        setStyle(data);

        // Populate form
        reset({
          name: data.attributes.name,
          type: data.attributes.type,
          color_hex: data.attributes.color_hex || '',
          text_color: data.attributes.text_color || '',
          text_background: data.attributes.text_background || '',
          sort_order: data.attributes.sort_order,
        });

        // Set preview image if exists
        if (data.attributes.preview_image?.data) {
          const imageUrl = getImageUrl(data.attributes.preview_image.data);
          if (imageUrl) {
            setPreviewImage(imageUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch background style:', error);
        toast.error('Failed to load background style');
        router.push('/admin-portal/styles/backgrounds');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStyle();
  }, [styleId, reset, router]);

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
      await updateBackgroundStyle(
        styleId,
        {
          name: data.name,
          type: data.type,
          color_hex: data.color_hex,
          text_color: data.text_color,
          text_background: data.text_background,
          sort_order: data.sort_order,
        },
        previewImage instanceof File ? previewImage : undefined
      );

      toast.success('Background style updated successfully');
      router.push('/admin-portal/styles/backgrounds');
    } catch (error) {
      console.error('Failed to update background style:', error);
      toast.error('Failed to update background style');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBackgroundStyle(styleId);
      toast.success('Background style deleted successfully');
      router.push('/admin-portal/styles/backgrounds');
    } catch (error) {
      console.error('Failed to delete background style:', error);
      toast.error('Failed to delete background style');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!style) return;

    try {
      if (style.attributes.publishedAt) {
        await unpublishBackgroundStyle(styleId);
        toast.success('Background style unpublished');
      } else {
        await publishBackgroundStyle(styleId);
        toast.success('Background style published');
      }
      // Refresh data
      const updated = await getBackgroundStyleById(styleId);
      setStyle(updated);
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!style) {
    return null;
  }

  const isPublished = !!style.attributes.publishedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Background Style</h1>
          <p className="text-muted-foreground mt-2">{style.attributes.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePublishToggle}>
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the background style details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

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
                </div>

                {(watchType === 'solid_color' || watchType === 'gradient') && (
                  <div className="space-y-2">
                    <Label htmlFor="color_hex">Color</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    {...register('sort_order', { valueAsNumber: true })}
                  />
                  {errors.sort_order && (
                    <p className="text-sm text-destructive">{errors.sort_order.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Image</CardTitle>
                <CardDescription>Replace or update the preview image</CardDescription>
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

            {previewImage instanceof File && (
              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                  <CardDescription>Auto-extracted from new image</CardDescription>
                </CardHeader>
                <CardContent>
                  <ColorExtractor
                    imageFile={previewImage}
                    onColorsExtracted={handleColorsExtracted}
                  />
                </CardContent>
              </Card>
            )}

            {!( previewImage instanceof File) && (
              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                  <CardDescription>Manually set text colors</CardDescription>
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
                <CardDescription>See how the background style will look</CardDescription>
              </CardHeader>
              <CardContent>
                <StylePreview
                  type="background"
                  backgroundType={watchType}
                  backgroundValue={
                    watchType === 'solid_color' || watchType === 'gradient'
                      ? watchColorHex
                      : previewImage instanceof File
                      ? URL.createObjectURL(previewImage)
                      : previewImage || undefined
                  }
                  textColor={watchTextColor}
                  textBackground={watchTextBg}
                  size="lg"
                />
              </CardContent>
            </Card>
          </div>
        </div>

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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Background Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{style.attributes.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
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
