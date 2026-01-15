'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  Plus,
  Upload,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  Image as ImageIcon,
  FileText,
  Video,
  X,
  Check,
  FolderOpen,
  Tag as TagIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { strapiApi } from '@/lib/api/strapi';

type MediaCategory = 'product_photos' | 'marketing_materials' | 'packaging_templates' | 'brand_guidelines';

interface MediaAsset {
  id: number;
  title: string;
  description?: string;
  category: MediaCategory;
  downloadCount: number;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  file?: {
    id: number;
    url: string;
    name: string;
    mime: string;
    size: number;
  };
  thumbnail?: {
    id: number;
    url: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

const categoryLabels: Record<MediaCategory, string> = {
  product_photos: 'Product Photos',
  marketing_materials: 'Marketing Materials',
  packaging_templates: 'Packaging Templates',
  brand_guidelines: 'Brand Guidelines',
};

const categoryColors: Record<MediaCategory, string> = {
  product_photos: 'bg-blue-100 text-blue-700',
  marketing_materials: 'bg-purple-100 text-purple-700',
  packaging_templates: 'bg-amber-100 text-amber-700',
  brand_guidelines: 'bg-green-100 text-green-700',
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileIcon(mime?: string) {
  if (!mime) return <FileText className="h-4 w-4" />;
  if (mime.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (mime.startsWith('video/')) return <Video className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export default function MediaManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || 'all');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('product_photos');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch assets
  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        'populate[file]': 'true',
        'populate[thumbnail]': 'true',
        'populate[tags]': 'true',
        'sort[0]': 'createdAt:desc',
        'pagination[pageSize]': '100',
      };

      if (selectedCategory && selectedCategory !== 'all') {
        params['filters[category][$eq]'] = selectedCategory;
      }

      const response = await strapiApi.get('/api/media-assets', { params });

      const formattedAssets: MediaAsset[] = response.data.data.map((item: any) => ({
        id: item.id,
        ...item.attributes,
        file: item.attributes.file?.data ? {
          id: item.attributes.file.data.id,
          ...item.attributes.file.data.attributes,
        } : undefined,
        thumbnail: item.attributes.thumbnail?.data ? {
          id: item.attributes.thumbnail.data.id,
          ...item.attributes.thumbnail.data.attributes,
        } : undefined,
        tags: item.attributes.tags?.data?.map((t: any) => ({
          id: t.id,
          ...t.attributes,
        })) || [],
      }));

      setAssets(formattedAssets);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to load media assets');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await strapiApi.get('/api/tags', {
        params: { 'pagination[pageSize]': '100' },
      });
      const formattedTags: Tag[] = response.data.data.map((item: any) => ({
        id: item.id,
        ...item.attributes,
      }));
      setTags(formattedTags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchTags();
  }, [selectedCategory]);

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === 'all') {
      router.push('/admin-portal/media');
    } else {
      router.push(`/admin-portal/media?category=${value}`);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      toast.error('Please provide a title and file');
      return;
    }

    setIsUploading(true);
    try {
      // First, upload the file to Strapi's media library
      const formData = new FormData();
      formData.append('files', uploadFile);

      const uploadResponse = await strapiApi.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedFile = uploadResponse.data[0];

      // Then create the media asset entry
      const assetData = {
        data: {
          title: uploadTitle,
          description: uploadDescription,
          category: uploadCategory,
          file: uploadedFile.id,
          fileSize: uploadedFile.size,
          fileType: uploadedFile.mime,
          tags: selectedTags,
          publishedAt: new Date().toISOString(),
        },
      };

      await strapiApi.post('/api/media-assets', assetData);

      toast.success('Asset uploaded successfully');
      setIsUploadOpen(false);
      resetUploadForm();
      fetchAssets();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload asset');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory('product_photos');
    setUploadFile(null);
    setSelectedTags([]);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await strapiApi.delete(`/api/media-assets/${deleteTarget.id}`);
      toast.success('Asset deleted successfully');
      setDeleteTarget(null);
      fetchAssets();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const columns: ColumnDef<MediaAsset>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Asset',
        cell: ({ row }) => {
          const asset = row.original;
          const thumbnailUrl = asset.thumbnail?.url || asset.file?.url;
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                {thumbnailUrl && asset.file?.mime?.startsWith('image/') ? (
                  <img
                    src={`${strapiUrl}${thumbnailUrl}`}
                    alt={asset.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getFileIcon(asset.file?.mime)
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">{asset.title}</p>
                <p className="text-xs text-muted-foreground">
                  {asset.file?.name || 'No file'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const category = row.getValue('category') as MediaCategory;
          return (
            <Badge className={categoryColors[category]}>
              {categoryLabels[category]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
          const tags = row.original.tags || [];
          if (tags.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'fileSize',
        header: 'Size',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatFileSize(row.original.file?.size || row.original.fileSize)}
          </span>
        ),
      },
      {
        accessorKey: 'downloadCount',
        header: 'Downloads',
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue('downloadCount') || 0}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.getValue('createdAt')), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const asset = row.original;
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {asset.file?.url && (
                  <DropdownMenuItem
                    onClick={() => window.open(`${strapiUrl}${asset.file?.url}`, '_blank')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                )}
                {asset.file?.url && (
                  <DropdownMenuItem
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${strapiUrl}${asset.file?.url}`;
                      link.download = asset.file?.name || 'download';
                      link.click();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteTarget(asset)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // Calculate stats
  const stats = useMemo(() => ({
    total: assets.length,
    product_photos: assets.filter((a) => a.category === 'product_photos').length,
    marketing_materials: assets.filter((a) => a.category === 'marketing_materials').length,
    packaging_templates: assets.filter((a) => a.category === 'packaging_templates').length,
    brand_guidelines: assets.filter((a) => a.category === 'brand_guidelines').length,
    totalDownloads: assets.reduce((sum, a) => sum + (a.downloadCount || 0), 0),
  }), [assets]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media Management</h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage marketing assets for resellers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssets}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Asset
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}
          onClick={() => handleCategoryChange('all')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">All Assets</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === 'product_photos' ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
          onClick={() => handleCategoryChange('product_photos')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.product_photos}</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === 'marketing_materials' ? 'border-purple-500 bg-purple-50' : 'hover:bg-slate-50'}`}
          onClick={() => handleCategoryChange('marketing_materials')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.marketing_materials}</p>
            <p className="text-xs text-muted-foreground">Marketing</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === 'packaging_templates' ? 'border-amber-500 bg-amber-50' : 'hover:bg-slate-50'}`}
          onClick={() => handleCategoryChange('packaging_templates')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.packaging_templates}</p>
            <p className="text-xs text-muted-foreground">Packaging</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${selectedCategory === 'brand_guidelines' ? 'border-green-500 bg-green-50' : 'hover:bg-slate-50'}`}
          onClick={() => handleCategoryChange('brand_guidelines')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.brand_guidelines}</p>
            <p className="text-xs text-muted-foreground">Guidelines</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-600">{stats.totalDownloads}</p>
            <p className="text-xs text-muted-foreground">Total Downloads</p>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Media Assets</CardTitle>
              <CardDescription>
                {selectedCategory === 'all'
                  ? 'Showing all assets'
                  : `Filtered by: ${categoryLabels[selectedCategory as MediaCategory]}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="product_photos">Product Photos</SelectItem>
                  <SelectItem value="marketing_materials">Marketing Materials</SelectItem>
                  <SelectItem value="packaging_templates">Packaging Templates</SelectItem>
                  <SelectItem value="brand_guidelines">Brand Guidelines</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={assets}
            searchKey="title"
            searchPlaceholder="Search assets..."
            isLoading={isLoading}
            showColumnVisibility={true}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload New Asset</DialogTitle>
            <DialogDescription>
              Add a new media asset to the library for resellers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter asset title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Enter description..."
                className="w-full min-h-[80px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as MediaCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_photos">Product Photos</SelectItem>
                  <SelectItem value="marketing_materials">Marketing Materials</SelectItem>
                  <SelectItem value="packaging_templates">Packaging Templates</SelectItem>
                  <SelectItem value="brand_guidelines">Brand Guidelines</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {selectedTags.includes(tag.id) && <Check className="mr-1 h-3 w-3" />}
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>File *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  uploadFile ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.psd,.ai"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadFile(file);
                  }}
                />
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {getFileIcon(uploadFile.type)}
                    <span className="font-medium">{uploadFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images, videos, PDFs, and design files
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFile || !uploadTitle}>
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
