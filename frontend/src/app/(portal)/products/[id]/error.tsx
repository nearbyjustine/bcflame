'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Failed to load product details. Please try again or return to the product listing.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} size="lg">
          Try Again
        </Button>
        <Link href="/products">
          <Button variant="outline" size="lg">
            Back to Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
