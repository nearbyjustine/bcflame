'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Type,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

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
  getAdminFontStyles,
  deleteFontStyle,
  publishFontStyle,
  unpublishFontStyle,
} from '@/lib/api/admin-styles';
import type { FontStyle } from '@/types/customization';

export default function FontStylesListPage() {
  const router = useRouter();

  const [styles, setStyles] = useState<FontStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    pageCount: 1,
    total: 0,
  });

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    byCategory: {
      sans_serif: 0,
      serif: 0,
      display: 0,
      script: 0,
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<FontStyle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStyles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAdminFontStyles({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: 'all',
      });

      setStyles(result.styles);
      setPagination(result.pagination);

      const published = result.styles.filter((s) => s.attributes.publishedAt).length;
      const draft = result.styles.filter((s) => !s.attributes.publishedAt).length;
      const byCategory = result.styles.reduce(
        (acc, s) => {
          acc[s.attributes.category]++;
          return acc;
        },
        { sans_serif: 0, serif: 0, display: 0, script: 0 }
      );

      setStats({
        total: result.pagination.total,
        published,
        draft,
        byCategory,
      });
    } catch (error) {
      console.error('Failed to fetch font styles:', error);
      toast.error('Failed to load font styles');
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
      await deleteFontStyle(styleToDelete.id);
      toast.success('Font style deleted successfully');
      setDeleteDialogOpen(false);
      setStyleToDelete(null);
      fetchStyles();
    } catch (error) {
      console.error('Failed to delete font style:', error);
      toast.error('Failed to delete font style');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (style: FontStyle) => {
    try {
      if (style.attributes.publishedAt) {
        await unpublishFontStyle(style.id);
        toast.success('Font style unpublished successfully');
      } else {
        await publishFontStyle(style.id);
        toast.success('Font style published successfully');
      }
      fetchStyles();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const columns: ColumnDef<FontStyle>[] = [
    {
      accessorKey: 'preview',
      header: 'Preview',
      cell: ({ row }) => {
        const style = row.original;
        return (
          <div
            className="text-lg font-semibold"
            style={{ fontFamily: style.attributes.font_family }}
          >
            Aa
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.attributes.name}</div>;
      },
    },
    {
      accessorKey: 'font_family',
      header: 'Font Family',
      cell: ({ row }) => {
        return (
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {row.original.attributes.font_family}
          </code>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.attributes.category;
        const categoryLabels = {
          sans_serif: 'Sans Serif',
          serif: 'Serif',
          display: 'Display',
          script: 'Script',
        };
        return <Badge variant="outline">{categoryLabels[category]}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isPublished = !!row.original.attributes.publishedAt;
        return <StatusBadge status={isPublished ? 'published' : 'draft'} />;
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
                onClick={() => router.push(`/admin-portal/styles/fonts/${style.id}`)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Font Styles</h1>
          <p className="text-muted-foreground mt-2">
            Manage font styles for product customization
          </p>
        </div>
        <Button onClick={() => router.push('/admin-portal/styles/fonts/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Font Style
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fonts</CardTitle>
            <Type className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Sans Serif: {stats.byCategory.sans_serif}</div>
              <div>Serif: {stats.byCategory.serif}</div>
              <div>Display: {stats.byCategory.display}</div>
              <div>Script: {stats.byCategory.script}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={styles}
            searchKey="name"
            searchPlaceholder="Search font styles..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Font Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{styleToDelete?.attributes.name}&quot;? This action
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
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
