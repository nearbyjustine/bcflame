'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { GetProductsParams } from '@/lib/api/products';

interface FilterPanelProps {
  filters: GetProductsParams;
  onFilterChange: (filters: GetProductsParams) => void;
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const categories = ['Indica', 'Hybrid', 'Sativa'] as const;

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value || undefined });
  };

  const handleCategoryClick = (category: typeof categories[number]) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handleFeaturedToggle = () => {
    onFilterChange({ ...filters, featured: filters.featured ? undefined : true });
  };

  const handleOnSaleToggle = () => {
    onFilterChange({ ...filters, onSale: filters.onSale ? undefined : true });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    if (type === 'min') {
      onFilterChange({ ...filters, minPrice: numValue });
    } else {
      onFilterChange({ ...filters, maxPrice: numValue });
    }
  };

  const handleTHCChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    if (type === 'min') {
      onFilterChange({ ...filters, minTHC: numValue });
    } else {
      onFilterChange({ ...filters, maxTHC: numValue });
    }
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: undefined,
      category: undefined,
      featured: undefined,
      onSale: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minTHC: undefined,
      maxTHC: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.featured ||
    filters.onSale ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minTHC !== undefined ||
    filters.maxTHC !== undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search"
            type="text"
            placeholder="Search products by name..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.category === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ ...filters, category: undefined })}
          >
            All
          </Button>
          {categories.map((category) => {
            const isActive = filters.category === category;
            const colorClasses = {
              Indica: isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-blue-600 text-blue-600 hover:bg-blue-50',
              Hybrid: isActive ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border-purple-600 text-purple-600 hover:bg-purple-50',
              Sativa: isActive ? 'bg-green-600 text-white hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50',
            };

            return (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => handleCategoryClick(category)}
                className={colorClasses[category]}
              >
                {category}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="space-y-3">
        <Label>Quick Filters</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured || false}
              onCheckedChange={handleFeaturedToggle}
            />
            <Label
              htmlFor="featured"
              className="text-sm font-normal cursor-pointer"
            >
              Featured only
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onSale"
              checked={filters.onSale || false}
              onCheckedChange={handleOnSaleToggle}
            />
            <Label
              htmlFor="onSale"
              className="text-sm font-normal cursor-pointer"
            >
              On sale only
            </Label>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range ($/g)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="minPrice" className="text-xs text-gray-500">
              Min Price
            </Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="Min"
              min="0"
              step="0.01"
              value={filters.minPrice ?? ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maxPrice" className="text-xs text-gray-500">
              Max Price
            </Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Max"
              min="0"
              step="0.01"
              value={filters.maxPrice ?? ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* THC Range */}
      <div className="space-y-2">
        <Label>THC Content (%)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="minTHC" className="text-xs text-gray-500">
              Min THC %
            </Label>
            <Input
              id="minTHC"
              type="number"
              placeholder="Min"
              min="0"
              max="100"
              step="0.1"
              value={filters.minTHC ?? ''}
              onChange={(e) => handleTHCChange('min', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maxTHC" className="text-xs text-gray-500">
              Max THC %
            </Label>
            <Input
              id="maxTHC"
              type="number"
              placeholder="Max"
              min="0"
              max="100"
              step="0.1"
              value={filters.maxTHC ?? ''}
              onChange={(e) => handleTHCChange('max', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
