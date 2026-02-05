'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Archive,
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
  getAdminProducts,
  deleteProduct,
  publishProduct,
  unpublishProduct,
  type ProductWithInventory,
} from '@/lib/api/admin-products';
import { getImageUrl } from '@/lib/utils/image';
import { WEIGHT_UNIT } from '@/lib/utils/units';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { adminProductsSteps } from '@/hooks/tours/adminTours';

function getStockStatus(product: ProductWithInventory): 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' {
  if (!product.inventory) {
    return 'unknown';
  }

  const stock = product.inventory.attributes.quantity_in_stock;
  const reorderPoint = product.inventory.attributes.reorder_point;

  if (stock <= 0) {
    return 'out_of_stock';
  }
  if (stock <= reorderPoint) {
    return 'low_stock';
  }
  return 'in_stock';
}

export default function AdminProductsPage() {
  useOnboardingTour({ moduleKey: 'admin-products', steps: adminProductsSteps });
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [products, setProducts] = useState<ProductWithInventory[]>([]);
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
    lowStock: 0,
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithInventory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAdminProducts({
        page: pagination.page,
        pageSize: pagination.pageSize,
        lowStock: filterParam === 'low-stock',
      });

      setProducts(result.products);
      setPagination(result.pagination);

      // Calculate stats
      const published = result.products.filter((p) => p.attributes.publishedAt).length;
      const draft = result.products.filter((p) => !p.attributes.publishedAt).length;
      const lowStock = result.products.filter((p) => {
        if (!p.inventory) return false;
        return p.inventory.attributes.quantity_in_stock <= p.inventory.attributes.reorder_point;
      }).length;

      setStats({
        total: result.pagination.total,
        published,
        draft,
        lowStock,
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filterParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (product: ProductWithInventory) => {
    try {
      await publishProduct(product.id);
      toast.success('Product published successfully');
      fetchProducts();
    } catch (error) {
      console.error('Failed to publish product:', error);
      toast.error('Failed to publish product');
    }
  };

  const handleUnpublish = async (product: ProductWithInventory) => {
    try {
      await unpublishProduct(product.id);
      toast.success('Product unpublished successfully');
      fetchProducts();
    } catch (error) {
      console.error('Failed to unpublish product:', error);
      toast.error('Failed to unpublish product');
    }
  };

  const columns: ColumnDef<ProductWithInventory>[] = [
    {
      accessorKey: 'attributes.name',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original;
        const productImage = product.attributes.images?.data?.[0];
        const imageUrl = getImageUrl(productImage);

        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.attributes.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-5 w-5 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium ">{product.attributes.name}</p>
              <p className="text-xs text-muted-foreground">{product.attributes.sku}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'attributes.category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.attributes.category;
        return <StatusBadge status={category} variant="category" showDot={false} />;
      },
    },
    {
      accessorKey: 'attributes.base_price_per_pound',
      header: `Price/${WEIGHT_UNIT}`,
      cell: ({ row }) => {
        const price = row.original.attributes.base_price_per_pound;
        return price ? `$${price.toFixed(2)}` : '-';
      },
    },
    {
      id: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const product = row.original;
        const stockStatus = getStockStatus(product);
        const stock = product.inventory?.attributes.quantity_in_stock;

        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={stockStatus} variant="stock" showDot={false} />
            {stock !== undefined && (
              <span className="text-sm text-muted-foreground">
                {stock.toFixed(1)} lbs
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isPublished = !!row.original.attributes.publishedAt;
        return (
          <StatusBadge
            status={isPublished ? 'published' : 'draft'}
            variant="published"
            showDot={false}
          />
        );
      },
    },
    {
      id: 'flags',
      header: 'Flags',
      cell: ({ row }) => {
        const { featured, on_sale } = row.original.attributes;
        return (
          <div className="flex gap-1">
            {featured && (
              <Badge variant="outline" className="text-xs">Featured</Badge>
            )}
            {on_sale && (
              <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">Sale</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const product = row.original;
        const isPublished = !!product.attributes.publishedAt;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin-portal/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin-portal/products/${product.id}?edit=true`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isPublished ? (
                <DropdownMenuItem onClick={() => handleUnpublish(product)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handlePublish(product)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => {
                  setProductToDelete(product);
                  setDeleteDialogOpen(true);
                }}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tour="adm-products-header">
        <div>
          <h1 className="text-2xl font-bold ">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <Link href="/admin-portal/products/new" data-tour="adm-products-add-btn">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4" data-tour="adm-products-stats">
        <Card
          className={`cursor-pointer transition-colors ${!filterParam ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
          onClick={() => router.push('/admin-portal/products')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/30 cursor-pointer transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.published}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-muted/30 cursor-pointer transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold">{stats.draft}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filterParam === 'low-stock' ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
          onClick={() => router.push('/admin-portal/products?filter=low-stock')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.lowStock}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card data-tour="adm-products-table">
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={products}
            searchKey="attributes.name"
            searchPlaceholder="Search products..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.attributes.name}&quot;?
              This action cannot be undone.
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
