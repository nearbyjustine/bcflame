'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/styles/ImageUpload';
import { StylePreview } from '@/components/admin/styles/StylePreview';
import { FontSelector } from '@/components/admin/FontSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getFontStyleById,
  updateFontStyle,
  deleteFontStyle,
  publishFontStyle,
  unpublishFontStyle,
} from '@/lib/api/admin-styles';
import type { FontStyle } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';

const fontStyleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  font_family: z.string().min(1, 'Font family is required').max(200),
  category: z.enum(['sans_serif', 'serif', 'display', 'script']),
  google_fonts_url: z.string()
    .url('Must be a valid URL')
    .regex(/^https:\/\/fonts\.googleapis\.com\/css2\?/, 'Must be a Google Fonts URL')
    .optional()
    .or(z.literal('')),
  sort_order: z.number().int().min(0).default(0),
});

type FontStyleFormData = z.infer<typeof fontStyleSchema>;

export default function EditFontStylePage() {
  const router = useRouter();
  const params = useParams();
  const styleId = Number.parseInt(params.id as string);

  const [style, setStyle] = useState<FontStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<File | string | null>(null);
  const [fontFile, setFontFile] = useState<File | null>(null);
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
  } = useForm<FontStyleFormData>({
    resolver: zodResolver(fontStyleSchema),
  });

  const watchFontFamily = watch('font_family');
  const watchCategory = watch('category');

  useEffect(() => {
    const fetchStyle = async () => {
      try {
        const data = await getFontStyleById(styleId);
        setStyle(data);

        reset({
          name: data.attributes.name,
          font_family: data.attributes.font_family,
          category: data.attributes.category,
          google_fonts_url: data.attributes.google_fonts_url || '',
          sort_order: data.attributes.sort_order,
        });

        if (data.attributes.preview_image?.data) {
          const imageUrl = getImageUrl(data.attributes.preview_image.data);
          if (imageUrl) {
            setPreviewImage(imageUrl);
          }
        }
      } catch (error) {
        console.error('Failed to fetch font style:', error);
        toast.error('Failed to load font style');
        router.push('/admin-portal/styles/fonts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStyle();
  }, [styleId, reset, router]);

  const handleImageChange = (file: File | null) => {
    setPreviewImage(file);
  };

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFontFile(file);
    }
  };

  const onSubmit = async (data: FontStyleFormData) => {
    setIsSubmitting(true);
    try {
      await updateFontStyle(
        styleId,
        {
          name: data.name,
          font_family: data.font_family,
          category: data.category,
          google_fonts_url: data.google_fonts_url || undefined,
          sort_order: data.sort_order,
        },
        previewImage instanceof File ? previewImage : undefined,
        fontFile ?? undefined
      );

      toast.success('Font style updated successfully');
      router.push('/admin-portal/styles/fonts');
    } catch (error) {
      console.error('Failed to update font style:', error);
      toast.error('Failed to update font style');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFontStyle(styleId);
      toast.success('Font style deleted successfully');
      router.push('/admin-portal/styles/fonts');
    } catch (error) {
      console.error('Failed to delete font style:', error);
      toast.error('Failed to delete font style');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!style) return;

    try {
      if (style.attributes.publishedAt) {
        await unpublishFontStyle(styleId);
        toast.success('Font style unpublished');
      } else {
        await publishFontStyle(styleId);
        toast.success('Font style published');
      }
      const updated = await getFontStyleById(styleId);
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
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Font Style</h1>
          <p className="text-muted-foreground mt-2">{style.attributes.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePublishToggle}>
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the font style details</CardDescription>
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
                  <Label htmlFor="font_family">Font Family *</Label>
                  <FontSelector
                    value={watchFontFamily}
                    onChange={(value) => setValue('font_family', value)}
                    placeholder="Select a font..."
                  />
                  {errors.font_family && (
                    <p className="text-sm text-destructive">{errors.font_family.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Choose from popular Google Fonts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={watchCategory}
                    onValueChange={(value) =>
                      setValue('category', value as 'sans_serif' | 'serif' | 'display' | 'script')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans_serif">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_fonts_url">Google Fonts URL (Optional)</Label>
                  <Input
                    id="google_fonts_url"
                    {...register('google_fonts_url')}
                    placeholder="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"
                  />
                  {errors.google_fonts_url && (
                    <p className="text-sm text-destructive">{errors.google_fonts_url.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Visit <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Fonts</a>,
                    select your font and weights, then paste the CSS URL here. Leave blank to use default weights (400, 700, 400 italic).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    {...register('sort_order', { valueAsNumber: true })}
                  />
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
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font File</CardTitle>
                <CardDescription>Upload new custom font file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".ttf,.woff,.woff2,.otf"
                    onChange={handleFontFileChange}
                    className="cursor-pointer"
                  />
                  {fontFile && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      <span>{fontFile.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>See how the font style will look</CardDescription>
              </CardHeader>
              <CardContent>
                <StylePreview
                  type="font"
                  fontFamily={watchFontFamily}
                  fontCategory={watchCategory}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Font Style</DialogTitle>
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
