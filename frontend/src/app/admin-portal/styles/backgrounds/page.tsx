'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Palette,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getAdminBackgroundStyles,
  deleteBackgroundStyle,
  publishBackgroundStyle,
  unpublishBackgroundStyle,
} from '@/lib/api/admin-styles';
import type { BackgroundStyle } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';
import { hexToGradient } from '@/lib/utils/color';
import { cn } from '@/lib/utils';

export default function BackgroundStylesListPage() {
  const router = useRouter();

  const [styles, setStyles] = useState<BackgroundStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    pageCount: 1,
    total: 0,
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    byType: {
      solid_color: 0,
      gradient: 0,
      texture: 0,
      image: 0,
    },
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<BackgroundStyle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStyles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAdminBackgroundStyles({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: 'all',
      });

      setStyles(result.styles);
      setPagination(result.pagination);

      // Calculate stats
      const published = result.styles.filter((s) => s.attributes.publishedAt).length;
      const draft = result.styles.filter((s) => !s.attributes.publishedAt).length;
      const byType = result.styles.reduce(
        (acc, s) => {
          acc[s.attributes.type]++;
          return acc;
        },
        { solid_color: 0, gradient: 0, texture: 0, image: 0 }
      );

      setStats({
        total: result.pagination.total,
        published,
        draft,
        byType,
      });
    } catch (error) {
      console.error('Failed to fetch background styles:', error);
      toast.error('Failed to load background styles');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const handleDelete = async () => {
    if (!styleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteBackgroundStyle(styleToDelete.id);
      toast.success('Background style deleted successfully');
      setDeleteDialogOpen(false);
      setStyleToDelete(null);
      fetchStyles();
    } catch (error) {
      console.error('Failed to delete background style:', error);
      toast.error('Failed to delete background style');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (style: BackgroundStyle) => {
    try {
      if (style.attributes.publishedAt) {
        await unpublishBackgroundStyle(style.id);
        toast.success('Background style unpublished successfully');
      } else {
        await publishBackgroundStyle(style.id);
        toast.success('Background style published successfully');
      }
      fetchStyles();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const columns: ColumnDef<BackgroundStyle>[] = [
    {
      accessorKey: 'preview',
      header: 'Preview',
      cell: ({ row }) => {
        const style = row.original;
        const type = style.attributes.type;
        const colorHex = style.attributes.color_hex;
        const previewImage = style.attributes.preview_image?.data;

        let bgStyle: React.CSSProperties = {};

        if (type === 'solid_color' && colorHex) {
          bgStyle.backgroundColor = colorHex;
        } else if (type === 'gradient' && colorHex) {
          bgStyle.background = hexToGradient(colorHex);
        } else if ((type === 'texture' || type === 'image') && previewImage) {
          const imageUrl = getImageUrl(previewImage);
          if (imageUrl) {
            bgStyle.backgroundImage = `url(${imageUrl})`;
            bgStyle.backgroundSize = 'cover';
            bgStyle.backgroundPosition = 'center';
          }
        } else {
          bgStyle.backgroundColor = '#f0f0f0';
        }

        return (
          <div
            className="w-16 h-16 rounded border"
            style={bgStyle}
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        return (
          <div className="font-medium">{row.original.attributes.name}</div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.attributes.type;
        const typeLabels = {
          solid_color: 'Solid Color',
          gradient: 'Gradient',
          texture: 'Texture',
          image: 'Image',
        };
        return (
          <Badge variant="outline">
            {typeLabels[type]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'text_colors',
      header: 'Text Colors',
      cell: ({ row }) => {
        const textColor = row.original.attributes.text_color;
        const textBg = row.original.attributes.text_background;

        if (!textColor && !textBg) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        return (
          <div className="flex items-center space-x-2">
            {textColor && (
              <div className="flex items-center space-x-1">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: textColor }}
                  title={`Text: ${textColor}`}
                />
                <span className="text-xs text-muted-foreground">Text</span>
              </div>
            )}
            {textBg && (
              <div className="flex items-center space-x-1">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: textBg }}
                  title={`Background: ${textBg}`}
                />
                <span className="text-xs text-muted-foreground">BG</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isPublished = !!row.original.attributes.publishedAt;
        return (
          <StatusBadge status={isPublished ? 'published' : 'draft'} />
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const style = row.original;
        const isPublished = !!style.attributes.publishedAt;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin-portal/styles/backgrounds/${style.id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePublish(style)}>
                {isPublished ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setStyleToDelete(style);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Background Styles</h1>
          <p className="text-muted-foreground mt-2">
            Manage background styles for product customization
          </p>
        </div>
        <Button onClick={() => router.push('/admin-portal/styles/backgrounds/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Background Style
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backgrounds</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Solid: {stats.byType.solid_color}</div>
              <div>Gradient: {stats.byType.gradient}</div>
              <div>Texture: {stats.byType.texture}</div>
              <div>Image: {stats.byType.image}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={styles}
            searchKey="name"
            searchPlaceholder="Search background styles..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Background Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{styleToDelete?.attributes.name}"? This action
              cannot be undone.
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
