import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Package className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold mb-2">Product Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The product you&apos;re looking for doesn&apos;t exist or has been removed from our catalog.
      </p>
      <Link href="/products">
        <Button size="lg">Browse All Products</Button>
      </Link>
    </div>
  );
}
