'use client';

import { Download, FileImage, FileVideo, FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMediaStore } from '@/stores/mediaStore';

interface MediaAsset {
  id: number;
  title: string;
  description?: string;
  category: string;
  file: {
    url: string;
    mime: string;
    size: number;
    name: string;
  };
  thumbnail?: {
    url: string;
  };
  tags?: Array<{ id: number; name: string; slug: string }>;
  downloadCount: number;
  fileSize?: number;
  fileType?: string;
}

interface MediaAssetCardProps {
  asset: MediaAsset;
  onClick: () => void;
  variant?: 'grid' | 'list';
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mime: string) => {
  if (mime?.startsWith('image/')) return <FileImage className="h-5 w-5" />;
  if (mime?.startsWith('video/')) return <FileVideo className="h-5 w-5" />;
  if (mime?.includes('pdf')) return <FileText className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    product_photos: 'Product Photos',
    marketing_materials: 'Marketing',
    packaging_templates: 'Packaging',
    brand_guidelines: 'Brand',
  };
  return labels[category] || category;
};

export function MediaAssetCard({ asset, onClick, variant = 'grid' }: MediaAssetCardProps) {
  const { downloadAsset } = useMediaStore();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await downloadAsset(asset.id);
  };

  const thumbnailUrl = asset.thumbnail?.url || asset.file?.url;
  const isImage = asset.file?.mime?.startsWith('image/');
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  if (variant === 'list') {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-md bg-muted/50 overflow-hidden flex-shrink-0">
            {isImage && thumbnailUrl ? (
              <img
                src={thumbnailUrl.startsWith('http') ? thumbnailUrl : `${strapiUrl}${thumbnailUrl}`}
                alt={asset.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                {getFileIcon(asset.file?.mime)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{asset.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatFileSize(asset.file?.size || asset.fileSize || 0)}</span>
              <span>•</span>
              <span>{asset.downloadCount || 0} downloads</span>
            </div>
          </div>

          {/* Category Badge */}
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {getCategoryLabel(asset.category)}
          </Badge>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onClick}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted/50 relative overflow-hidden">
        {isImage && thumbnailUrl ? (
          <img
            src={thumbnailUrl.startsWith('http') ? thumbnailUrl : `${strapiUrl}${thumbnailUrl}`}
            alt={asset.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            {getFileIcon(asset.file?.mime)}
            <span className="text-xs">{asset.fileType || asset.file?.mime?.split('/')[1]?.toUpperCase()}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={onClick}
            className="h-10 w-10"
          >
            <Eye className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleDownload}
            className="h-10 w-10"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>

        {/* Category Badge */}
        <Badge
          className="absolute top-2 left-2"
          variant="secondary"
        >
          {getCategoryLabel(asset.category)}
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate">{asset.title}</h3>
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{formatFileSize(asset.file?.size || asset.fileSize || 0)}</span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {asset.downloadCount || 0}
          </span>
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.slice(0, 2).map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {asset.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{asset.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
