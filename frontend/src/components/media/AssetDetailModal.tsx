'use client';

import { useState } from 'react';
import { Download, X, FileImage, FileVideo, FileText, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  products?: Array<{ id: number; name: string }>;
  downloadCount: number;
  fileSize?: number;
  fileType?: string;
  createdAt?: string;
}

interface AssetDetailModalProps {
  asset: MediaAsset | null;
  open: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    product_photos: 'Product Photos',
    marketing_materials: 'Marketing Materials',
    packaging_templates: 'Packaging Templates',
    brand_guidelines: 'Brand Guidelines',
  };
  return labels[category] || category;
};

export function AssetDetailModal({ asset, open, onClose }: AssetDetailModalProps) {
  const { downloadAsset } = useMediaStore();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!asset) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAsset(asset.id);
    } finally {
      setIsDownloading(false);
    }
  };

  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const fileUrl = asset.file?.url?.startsWith('http') 
    ? asset.file.url 
    : `${strapiUrl}${asset.file?.url}`;
  const isImage = asset.file?.mime?.startsWith('image/');
  const isVideo = asset.file?.mime?.startsWith('video/');
  const isPdf = asset.file?.mime?.includes('pdf');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">{asset.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="bg-slate-100 rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center">
              {isImage && (
                <img
                  src={fileUrl}
                  alt={asset.title}
                  className="max-w-full max-h-[500px] object-contain"
                />
              )}
              {isVideo && (
                <video
                  src={fileUrl}
                  controls
                  className="max-w-full max-h-[500px]"
                >
                  Your browser does not support video playback.
                </video>
              )}
              {isPdf && (
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">PDF Preview</p>
                  <Button variant="outline" asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              )}
              {!isImage && !isVideo && !isPdf && (
                <div className="text-center p-8">
                  <FileImage className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available for this file type
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Description */}
              {asset.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p className="text-sm">{asset.description}</p>
                </div>
              )}

              {/* Category */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
                <Badge>{getCategoryLabel(asset.category)}</Badge>
              </div>

              {/* Tags */}
              {asset.tags && asset.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Products */}
              {asset.products && asset.products.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Related Products
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.products.map((product) => (
                      <Badge key={product.id} variant="secondary">
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">File Size:</span>
                  <p className="font-medium">
                    {formatFileSize(asset.file?.size || asset.fileSize || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">File Type:</span>
                  <p className="font-medium">
                    {asset.fileType || asset.file?.mime?.split('/')[1]?.toUpperCase() || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Downloads:</span>
                  <p className="font-medium">{asset.downloadCount || 0}</p>
                </div>
                {asset.createdAt && (
                  <div>
                    <span className="text-muted-foreground">Added:</span>
                    <p className="font-medium">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                {isDownloading ? 'Downloading...' : 'Download Asset'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
