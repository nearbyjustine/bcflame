export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-20 bg-muted rounded"></div>
        <div className="h-4 w-4 bg-muted rounded"></div>
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-4 w-4 bg-muted rounded"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-muted rounded-lg"></div>
          {/* Thumbnails */}
          <div className="flex gap-2">
            <div className="w-20 h-20 bg-muted rounded-lg"></div>
            <div className="w-20 h-20 bg-muted rounded-lg"></div>
            <div className="w-20 h-20 bg-muted rounded-lg"></div>
            <div className="w-20 h-20 bg-muted rounded-lg"></div>
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          {/* Title & Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-48 bg-muted rounded"></div>
              <div className="h-6 w-16 bg-muted rounded"></div>
            </div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded"></div>
          </div>

          {/* Specs */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>

          {/* Price */}
          <div className="border-t pt-4">
            <div className="h-8 w-40 bg-muted rounded"></div>
          </div>

          {/* Button */}
          <div className="h-12 w-full bg-muted rounded-lg"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-12">
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-24 bg-muted rounded"></div>
          <div className="h-10 w-24 bg-muted rounded"></div>
          <div className="h-10 w-32 bg-muted rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-2/3 bg-muted rounded"></div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="border-t pt-8">
        <div className="h-8 w-48 bg-muted rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="h-6 w-3/4 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
