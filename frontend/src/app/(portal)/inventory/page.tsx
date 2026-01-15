'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import { getInventory } from '@/lib/api/inventory';
import type { Inventory } from '@/types/inventory';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const response = await getInventory();
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.attributes.product.data.attributes.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.attributes.product.data.attributes.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter(
    (item) => item.attributes.quantity_in_stock <= item.attributes.reorder_point
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Admin-only inventory tracking and management</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Inventory Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-900 dark:text-orange-100">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {lowStockItems.length} item(s) are at or below reorder point
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lowStockItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center">
                  <span className="font-medium">
                    {item.attributes.product.data.attributes.name}
                  </span>
                  <span className="text-sm">
                    {item.attributes.quantity_in_stock} {item.attributes.unit} remaining
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Inventory Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">Loading inventory...</div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No inventory items found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Add your first inventory item to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {item.attributes.product.data.attributes.name}
                </CardTitle>
                <CardDescription>
                  SKU: {item.attributes.product.data.attributes.sku}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">In Stock:</span>
                    <span className="font-medium">
                      {item.attributes.quantity_in_stock} {item.attributes.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reorder Point:</span>
                    <span>{item.attributes.reorder_point} {item.attributes.unit}</span>
                  </div>
                  {item.attributes.location && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Location:</span>
                      <span>{item.attributes.location}</span>
                    </div>
                  )}
                  {item.attributes.batch_number && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Batch:</span>
                      <span>{item.attributes.batch_number}</span>
                    </div>
                  )}
                  {item.attributes.expiration_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expires:</span>
                      <span>{new Date(item.attributes.expiration_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Restock
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
