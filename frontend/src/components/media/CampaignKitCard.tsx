'use client';

import { Image, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CampaignKit {
  id: number;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  assets?: Array<{ id: number }>;
  isActive: boolean;
}

interface CampaignKitCardProps {
  kit: CampaignKit;
  onClick: () => void;
}

export function CampaignKitCard({ kit, onClick }: CampaignKitCardProps) {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  const coverUrl = kit.coverImage?.url?.startsWith('http')
    ? kit.coverImage.url
    : kit.coverImage?.url
    ? `${strapiUrl}${kit.coverImage.url}`
    : null;
  const assetCount = kit.assets?.length || 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={kit.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-primary/40" />
          </div>
        )}

        {/* Asset Count Badge */}
        <Badge className="absolute top-2 right-2 bg-black/60 hover:bg-black/60">
          <Image className="h-3 w-3 mr-1" />
          {assetCount} assets
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold">{kit.name}</h3>
        {kit.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {kit.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
