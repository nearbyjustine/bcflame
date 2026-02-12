'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Code } from 'lucide-react';
import { getAdminTextEffects, deleteTextEffect, publishTextEffect, unpublishTextEffect } from '@/lib/api/admin-styles';
import type { TextEffect } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';

export default function TextEffectsPage() {
  const router = useRouter();
  const [effects, setEffects] = useState<TextEffect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedCss, setExpandedCss] = useState<number | null>(null);

  useEffect(() => {
    fetchEffects();
  }, [page, search]);

  const fetchEffects = async () => {
    try {
      setLoading(true);
      const result = await getAdminTextEffects({
        page,
        pageSize: 25,
        search: search || undefined,
      });
      setEffects(result.effects);
      setTotalPages(result.pagination.pageCount);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error('Failed to fetch text effects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteTextEffect(id);
      fetchEffects();
    } catch (error) {
      console.error('Failed to delete text effect:', error);
      alert('Failed to delete text effect');
    }
  };

  const handleTogglePublish = async (effect: TextEffect) => {
    try {
      if (effect.attributes.publishedAt) {
        await unpublishTextEffect(effect.id);
      } else {
        await publishTextEffect(effect.id);
      }
      fetchEffects();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update publish status');
    }
  };

  const truncateCss = (css: string, maxLength = 100) => {
    if (css.length <= maxLength) return css;
    return css.substring(0, maxLength) + '...';
  };

  const stats = {
    total,
    published: effects.filter(e => e.attributes.publishedAt).length,
    draft: effects.filter(e => !e.attributes.publishedAt).length,
    byCategory: {
      text_effect: effects.filter(e => e.attributes.category === 'text_effect').length,
      background_effect: effects.filter(e => e.attributes.category === 'background_effect').length,
      image_filter: effects.filter(e => e.attributes.category === 'image_filter').length,
      ui_enhancement: effects.filter(e => e.attributes.category === 'ui_enhancement').length,
    },
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Visual Effects</h1>
          <p className="text-muted-foreground mt-2">
            Manage CSS-based visual effects for customization
          </p>
        </div>
        <Link href="/admin-portal/styles/effects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Effect
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.text_effect}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Background</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.background_effect}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.image_filter}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">UI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byCategory.ui_enhancement}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              <option value="text_effect">Text Effect</option>
              <option value="background_effect">Background Effect</option>
              <option value="image_filter">Image Filter</option>
              <option value="ui_enhancement">UI Enhancement</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Effects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Effects ({total})</CardTitle>
          <CardDescription>
            Click on CSS code to expand/collapse full content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : effects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No visual effects found. Create your first effect to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>CSS Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {effects.map((effect) => (
                  <TableRow key={effect.id}>
                    <TableCell className="font-medium">
                      {effect.attributes.name}
                      {effect.attributes.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {effect.attributes.description.substring(0, 60)}
                          {effect.attributes.description.length > 60 && '...'}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[effect.attributes.category]}>
                        {CATEGORY_LABELS[effect.attributes.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {effect.attributes.preview_image?.data ? (
                        <img
                          src={getImageUrl(effect.attributes.preview_image.data.attributes.url)}
                          alt={effect.attributes.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Code className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <code
                          className="text-xs bg-muted p-2 rounded block cursor-pointer hover:bg-muted/80"
                          onClick={() => setExpandedCss(expandedCss === effect.id ? null : effect.id)}
                        >
                          {expandedCss === effect.id
                            ? effect.attributes.css_code
                            : truncateCss(effect.attributes.css_code)}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      {effect.attributes.publishedAt ? (
                        <Badge variant="default">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(effect)}
                          title={effect.attributes.publishedAt ? 'Unpublish' : 'Publish'}
                        >
                          {effect.attributes.publishedAt ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin-portal/styles/effects/${effect.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(effect.id, effect.attributes.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center px-4">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
