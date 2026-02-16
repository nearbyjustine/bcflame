'use client';

import React, { useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { submitBatchOrderInquiries } from '@/lib/api/customization';

export function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, clearCart, getTotals } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const totals = getTotals();

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty', {
        description: 'Please add items to your cart before checking out.',
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      // Transform cart items to order inquiries format
      const inquiries = items.map((item) => ({
        product: item.product.id,
        selected_photos: item.selections.photos,
        selected_bud_styles: item.selections.bud_images,
        selected_backgrounds: item.selections.backgrounds,
        selected_fonts: item.selections.fonts,
        selected_prebagging: item.selections.preBagging.map((pb) => pb.optionId),
        total_weight: item.weight,
        weight_unit: item.weightUnit,
      }));

      const result = await submitBatchOrderInquiries(inquiries);

      toast.success('Orders submitted successfully!', {
        description: `${result.meta.total} order${result.meta.total > 1 ? 's' : ''} created`,
      });

      clearCart();
      setOpen(false);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to submit orders', {
        description: error.response?.data?.error?.message || 'Please try again.',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Your cart is empty'
              : `${totals.itemCount} item${totals.itemCount > 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
              <p>No items in cart</p>
              <p className="text-sm mt-1">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const productImage = item.product.attributes.images?.data?.[0];
                const imageUrl = productImage?.attributes.url
                  ? productImage.attributes.url.startsWith('http')
                    ? productImage.attributes.url
                    : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${productImage.attributes.url}`
                  : null;

                return (
                  <div
                    key={item.id}
                    className="group flex gap-3 p-3 bg-muted/30 rounded-xl border"
                  >
                    {/* Product Image */}
                    {imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={item.product.attributes.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.product.attributes.name}
                      </h4>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.product.attributes.category}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <span>{item.weight}{item.weightUnit}</span>
                        <span>•</span>
                        <span>${item.unitPrice.toFixed(2)}</span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Line Total & Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="font-semibold text-sm">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <>
            <Separator />
            <div className="pt-4 space-y-4">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Weight</span>
                  <span>{totals.totalWeight.toFixed(1)}g</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    ${totals.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <SheetFooter className="flex-col sm:flex-col gap-2">
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full"
                  size="lg"
                >
                  {isCheckingOut ? 'Processing...' : 'Checkout'}
                </Button>
                <Button
                  onClick={clearCart}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  disabled={isCheckingOut}
                >
                  Clear Cart
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
