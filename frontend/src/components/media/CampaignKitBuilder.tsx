'use client';

import { useState, useMemo } from 'react';
import { Download, X, Check, Package, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMediaStore } from '@/stores/mediaStore';

interface MediaAsset {
  id: number;
  title: string;
  file: {
    url: string;
    mime: string;
    size: number;
  };
  thumbnail?: {
    url: string;
  };
  category: string;
}

interface CampaignKit {
  id: number;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  assets?: MediaAsset[];
  isActive: boolean;
}

interface CampaignKitBuilderProps {
  kit: CampaignKit | null;
  open: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function CampaignKitBuilder({ kit, open, onClose }: CampaignKitBuilderProps) {
  const { downloadCampaignKit } = useMediaStore();
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset selection when kit changes
  useMemo(() => {
    if (kit?.assets) {
      setSelectedAssets(kit.assets.map((a) => a.id));
    }
  }, [kit]);

  if (!kit) return null;

  const assets = kit.assets || [];
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

  const handleToggleAsset = (assetId: number) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    setSelectedAssets(assets.map((a) => a.id));
  };

  const handleSelectNone = () => {
    setSelectedAssets([]);
  };

  const handleDownload = async () => {
    if (selectedAssets.length === 0) return;
    
    setIsDownloading(true);
    try {
      await downloadCampaignKit(kit.id, selectedAssets);
      onClose();
    } finally {
      setIsDownloading(false);
    }
  };

  const totalSize = assets
    .filter((a) => selectedAssets.includes(a.id))
    .reduce((sum, a) => sum + (a.file?.size || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {kit.name}
          </DialogTitle>
        </DialogHeader>

        {kit.description && (
          <p className="text-sm text-muted-foreground">{kit.description}</p>
        )}

        {/* Selection Controls */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedAssets.length} of {assets.length} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectNone}>
                Select None
              </Button>
            </div>
          </div>
          <Badge variant="secondary">
            {formatFileSize(totalSize)} total
          </Badge>
        </div>

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {assets.map((asset) => {
              const isSelected = selectedAssets.includes(asset.id);
              const thumbnailUrl = asset.thumbnail?.url || asset.file?.url;
              const isImage = asset.file?.mime?.startsWith('image/');

              return (
                <label
                  key={asset.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}
                  `}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleAsset(asset.id)}
                  />

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded bg-muted/50 overflow-hidden flex-shrink-0">
                    {isImage && thumbnailUrl ? (
                      <img
                        src={thumbnailUrl.startsWith('http') ? thumbnailUrl : `${strapiUrl}${thumbnailUrl}`}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{asset.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(asset.file?.size || 0)}
                    </p>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>

          {assets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No assets in this campaign kit
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={selectedAssets.length === 0 || isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading
              ? 'Preparing Download...'
              : `Download ${selectedAssets.length} Asset${selectedAssets.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
