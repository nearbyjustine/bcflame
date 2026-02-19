'use client';

import { Lock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface MediaAccessLockedProps {
  paidOrdersCount?: number;
}

export function MediaAccessLocked({ paidOrdersCount = 0 }: MediaAccessLockedProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-8 px-6 text-center space-y-6">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Media Library Locked</h2>
            <p className="text-muted-foreground">
              Complete a paid order to access our marketing materials, product photos, and brand assets.
            </p>
          </div>

          {/* Benefits List */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
            <p className="text-sm font-medium">Once you have a paid order, you&apos;ll get access to:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• High-resolution product photography</li>
              <li>• Marketing materials and templates</li>
              <li>• Packaging design templates</li>
              <li>• Brand guidelines and assets</li>
              <li>• Campaign kits for promotions</li>
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => router.push('/products')}
            size="lg"
            className="w-full gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse Products
          </Button>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground">
            Have questions? Contact your account manager or our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
