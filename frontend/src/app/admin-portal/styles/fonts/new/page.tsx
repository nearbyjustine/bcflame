'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/styles/ImageUpload';
import { StylePreview } from '@/components/admin/styles/StylePreview';
import { FontSelector } from '@/components/admin/FontSelector';

import { createFontStyle } from '@/lib/api/admin-styles';

const fontStyleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  font_family: z.string().min(1, 'Font family is required').max(200),
  category: z.enum(['sans_serif', 'serif', 'display', 'script'], {
    required_error: 'Please select a category',
  }),
  google_fonts_url: z.string()
    .url('Must be a valid URL')
    .regex(/^https:\/\/fonts\.googleapis\.com\/css2\?/, 'Must be a Google Fonts URL')
    .optional()
    .or(z.literal('')),
  sort_order: z.number().int().min(0).default(0),
});

type FontStyleFormData = z.infer<typeof fontStyleSchema>;

export default function NewFontStylePage() {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FontStyleFormData>({
    resolver: zodResolver(fontStyleSchema),
    defaultValues: {
      category: 'sans_serif',
      sort_order: 0,
    },
  });

  const watchFontFamily = watch('font_family');
  const watchCategory = watch('category');

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
      await createFontStyle(
        {
          name: data.name,
          font_family: data.font_family,
          category: data.category,
          google_fonts_url: data.google_fonts_url || undefined,
          sort_order: data.sort_order,
        },
        previewImage ?? undefined,
        fontFile ?? undefined
      );

      toast.success('Font style created successfully');
      router.push('/admin-portal/styles/fonts');
    } catch (error) {
      console.error('Failed to create font style:', error);
      toast.error('Failed to create font style');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Font Style</h1>
        <p className="text-muted-foreground mt-2">
          Add a new font style for product customization
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the font style details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Modern Sans"
                  />
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
                    Choose from popular Google Fonts (fonts are loaded automatically)
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
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans_serif">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="display">Display</SelectItem>
                      <SelectItem value="script">Script</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
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
                    placeholder="0"
                  />
                  {errors.sort_order && (
                    <p className="text-sm text-destructive">{errors.sort_order.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Image (Optional)</CardTitle>
                <CardDescription>Sample image showing the font in use</CardDescription>
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
                <CardTitle>Font File (Optional)</CardTitle>
                <CardDescription>Upload custom font file (.ttf, .woff, .woff2, .otf)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".ttf,.woff,.woff2,.otf"
                      onChange={handleFontFileChange}
                      className="cursor-pointer"
                    />
                  </div>
                  {fontFile && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      <span>{fontFile.name}</span>
                      <span className="text-xs">({(fontFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 2MB
                  </p>
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
            {isSubmitting ? 'Creating...' : 'Create Font Style'}
          </Button>
        </div>
      </form>
    </div>
  );
}
