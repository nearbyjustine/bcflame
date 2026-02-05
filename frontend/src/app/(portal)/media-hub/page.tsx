'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Download, Grid, List, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MediaAssetCard } from '@/components/media/MediaAssetCard';
import { AssetDetailModal } from '@/components/media/AssetDetailModal';
import { CampaignKitCard } from '@/components/media/CampaignKitCard';
import { CampaignKitBuilder } from '@/components/media/CampaignKitBuilder';
import { MediaAccessLocked } from '@/components/media/MediaAccessLocked';
import { useMediaStore } from '@/stores/mediaStore';
import { cn } from '@/lib/utils';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { resellerMediaHubSteps } from '@/hooks/tours/resellerTours';

type Category = 'all' | 'product_photos' | 'marketing_materials' | 'packaging_templates' | 'brand_guidelines';

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product_photos', label: 'Product Photos' },
  { value: 'marketing_materials', label: 'Marketing Materials' },
  { value: 'packaging_templates', label: 'Packaging Templates' },
  { value: 'brand_guidelines', label: 'Brand Guidelines' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export default function MediaHubPage() {
  const {
    assets,
    tags,
    campaignKits,
    isLoading,
    accessStatus,
    isCheckingAccess,
    selectedCategory,
    searchQuery,
    selectedTags,
    sortBy,
    fetchAssets,
    fetchTags,
    fetchCampaignKits,
    checkAccess,
    setFilters,
  } = useMediaStore();

  useOnboardingTour({ moduleKey: 'media-hub', steps: resellerMediaHubSteps, enabled: accessStatus?.hasAccess === true });
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedKit, setSelectedKit] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (accessStatus?.hasAccess) {
      fetchAssets();
      fetchTags();
      fetchCampaignKits();
    }
  }, [accessStatus?.hasAccess, fetchAssets, fetchTags, fetchCampaignKits]);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((asset) => asset.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.title.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter((asset) =>
        asset.tags?.some((tag: any) => selectedTags.includes(tag.slug || tag.id))
      );
    }

    // Sort
    switch (sortBy) {
      case 'downloads':
        result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [assets, selectedCategory, searchQuery, selectedTags, sortBy]);

  const handleTagToggle = (tagSlug: string) => {
    const newTags = selectedTags.includes(tagSlug)
      ? selectedTags.filter((t) => t !== tagSlug)
      : [...selectedTags, tagSlug];
    setFilters({ selectedTags: newTags });
  };

  const getCategoryCount = (category: Category) => {
    if (category === 'all') return assets.length;
    return assets.filter((a) => a.category === category).length;
  };

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show locked state if user doesn't have access
  if (accessStatus && !accessStatus.hasAccess) {
    return <MediaAccessLocked paidOrdersCount={accessStatus.paidOrdersCount} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tour="res-mediahub-header">
        <div>
          <h1 className="text-2xl font-bold">Media Hub</h1>
          <p className="text-muted-foreground">
            Browse and download marketing materials, product photos, and brand assets
          </p>
        </div>
      </div>

      {/* Campaign Kits Section */}
      {campaignKits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Campaign Kits</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaignKits.slice(0, 3).map((kit) => (
              <CampaignKitCard
                key={kit.id}
                kit={kit}
                onClick={() => setSelectedKit(kit)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setFilters({ sortBy: value as any })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4" data-tour="res-mediahub-categories">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilters({ selectedCategory: category.value })}
            className="gap-2"
          >
            {category.label}
            <Badge variant="secondary" className="ml-1">
              {getCategoryCount(category.value)}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex gap-6" data-tour="res-mediahub-assets">
        {/* Sidebar Filters - Desktop */}
        <aside className={cn(
          'hidden lg:block w-64 shrink-0 space-y-6',
          showFilters && 'block'
        )}>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Tags</h3>
              <div className="space-y-3">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.slug)}
                      onCheckedChange={() => handleTagToggle(tag.slug)}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                )}
              </div>

              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ selectedTags: [] })}
                  className="mt-4 w-full"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Assets Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No assets found</p>
              {(searchQuery || selectedTags.length > 0) && (
                <Button
                  variant="link"
                  onClick={() => setFilters({ searchQuery: '', selectedTags: [] })}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                  variant="list"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Campaign Kit Builder Modal */}
      <CampaignKitBuilder
        kit={selectedKit}
        open={!!selectedKit}
        onClose={() => setSelectedKit(null)}
      />
    </div>
  );
}
