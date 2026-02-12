'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import {
  getVisualEffectById,
  updateVisualEffect,
  deleteVisualEffect,
} from '@/lib/api/admin-styles';
import { CSSCodeEditor } from '@/components/admin/styles/CSSCodeEditor';
import { EffectPreview } from '@/components/admin/styles/EffectPreview';
import { ImageUpload } from '@/components/admin/styles/ImageUpload';
import { getImageUrl } from '@/lib/utils/image';
import type { VisualEffect } from '@/types/customization';

export default function EditVisualEffectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [effect, setEffect] = useState<VisualEffect | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'text_effect' as 'text_effect' | 'background_effect' | 'image_filter' | 'ui_enhancement',
    description: '',
    css_code: '',
    html_structure: '',
    font_dependencies: '',
    browser_support: '',
    sort_order: 0,
    is_default: false,
  });

  useEffect(() => {
    fetchEffect();
  }, [params.id]);

  const fetchEffect = async () => {
    try {
      const data = await getVisualEffectById(parseInt(params.id));
      setEffect(data);
      setFormData({
        name: data.attributes.name,
        category: data.attributes.category,
        description: data.attributes.description || '',
        css_code: data.attributes.css_code,
        html_structure: data.attributes.html_structure || '',
        font_dependencies: data.attributes.font_dependencies
          ? JSON.stringify(data.attributes.font_dependencies, null, 2)
          : '',
        browser_support: data.attributes.browser_support || '',
        sort_order: data.attributes.sort_order,
        is_default: data.attributes.is_default,
      });
    } catch (error) {
      console.error('Failed to fetch visual effect:', error);
      alert('Failed to load visual effect');
      router.push('/admin-portal/styles/effects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Parse font dependencies JSON if provided
      let fontDependencies = undefined;
      if (formData.font_dependencies.trim()) {
        try {
          fontDependencies = JSON.parse(formData.font_dependencies);
        } catch (error) {
          alert('Invalid JSON in Font Dependencies field');
          setSaving(false);
          return;
        }
      }

      const data = {
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        css_code: formData.css_code,
        html_structure: formData.html_structure || undefined,
        font_dependencies: fontDependencies,
        browser_support: formData.browser_support || undefined,
        sort_order: formData.sort_order,
        is_default: formData.is_default,
      };

      await updateVisualEffect(parseInt(params.id), data, previewImage || undefined);
      router.push('/admin-portal/styles/effects');
    } catch (error) {
      console.error('Failed to update visual effect:', error);
      alert('Failed to update visual effect. Please check your input and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${formData.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteVisualEffect(parseInt(params.id));
      router.push('/admin-portal/styles/effects');
    } catch (error) {
      console.error('Failed to delete visual effect:', error);
      alert('Failed to delete visual effect');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!effect) {
    return null;
  }

  const currentImageUrl = effect.attributes.preview_image?.data
    ? getImageUrl(effect.attributes.preview_image.data.attributes.url)
    : null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin-portal/styles/effects">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Effects
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Visual Effect</CardTitle>
                <CardDescription>
                  Update the visual effect details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Glassmorphism"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="text_effect">Text Effect</option>
                    <option value="background_effect">Background Effect</option>
                    <option value="image_filter">Image Filter</option>
                    <option value="ui_enhancement">UI Enhancement</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the effect..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="html_structure">HTML Structure (optional)</Label>
                  <Textarea
                    id="html_structure"
                    value={formData.html_structure}
                    onChange={(e) => setFormData({ ...formData, html_structure: e.target.value })}
                    placeholder="<div class='effect-class'>Sample HTML</div>"
                    className="font-mono text-sm"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example HTML markup needed for this effect
                  </p>
                </div>

                <div>
                  <Label htmlFor="font_dependencies">Font Dependencies (JSON)</Label>
                  <Textarea
                    id="font_dependencies"
                    value={formData.font_dependencies}
                    onChange={(e) => setFormData({ ...formData, font_dependencies: e.target.value })}
                    placeholder={'{\n  "google_fonts": ["Exo:wght@900"],\n  "custom_fonts": []\n}'}
                    className="font-mono text-sm"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON object with google_fonts and custom_fonts arrays
                  </p>
                </div>

                <div>
                  <Label htmlFor="browser_support">Browser Support</Label>
                  <Input
                    id="browser_support"
                    value={formData.browser_support}
                    onChange={(e) => setFormData({ ...formData, browser_support: e.target.value })}
                    placeholder="e.g., 98% or Modern browsers only"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_default"
                        checked={formData.is_default}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_default: checked as boolean })
                        }
                      />
                      <Label htmlFor="is_default" className="cursor-pointer">
                        Set as default
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Preview Image</Label>
                  <ImageUpload
                    currentImage={currentImageUrl}
                    onImageChange={setPreviewImage}
                    aspectRatio="square"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended for text effects (1:1 ratio)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Effect
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - CSS Editor & Preview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <CSSCodeEditor
                  value={formData.css_code}
                  onChange={(value) => setFormData({ ...formData, css_code: value })}
                />
              </CardContent>
            </Card>

            <EffectPreview
              cssCode={formData.css_code}
              category={formData.category}
            />

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/admin-portal/styles/effects" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
