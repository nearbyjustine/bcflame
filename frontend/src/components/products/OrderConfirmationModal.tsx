'use client';

import React from 'react';
import { Loader2, Package, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types/product';
import type { CustomizationSelections } from '@/types/customization';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  product: Product;
  selections: CustomizationSelections;
  unitPrice: number;
  weight: number;
  weightUnit: string;
  quantity?: number;
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  product,
  selections,
  unitPrice,
  weight,
  weightUnit,
  quantity = 1,
}: OrderConfirmationModalProps) {
  const totalPrice = unitPrice * quantity;
  const totalWeight = weight * quantity;

  // Get product image URL
  const productImage = product.attributes.images?.data?.[0];
  const imageUrl = productImage?.url
    ? productImage.url.startsWith('http')
      ? productImage.url
      : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${productImage.url}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Confirm Your Order
          </DialogTitle>
          <DialogDescription>
            Please review your order details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
            {imageUrl && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={product.attributes.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {product.attributes.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                SKU: {product.attributes.sku}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                Category: {product.attributes.category}
              </p>
            </div>
          </div>

          {/* Customization Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Customization Summary
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Photos */}
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Photos</p>
                <p className="font-medium">
                  {selections.photos.length} selected
                </p>
              </div>

              {/* Bud Styles */}
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Bud Styles</p>
                <p className="font-medium">
                  {selections.budStyles.length} selected
                </p>
              </div>

              {/* Backgrounds */}
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Backgrounds</p>
                <p className="font-medium">
                  {selections.backgrounds.length} selected
                </p>
              </div>

              {/* Fonts */}
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Fonts</p>
                <p className="font-medium">
                  {selections.fonts.length} selected
                </p>
              </div>
            </div>

            {/* Pre-Bagging */}
            {selections.preBagging.length > 0 && (
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Pre-Bagging Options</p>
                <div className="space-y-2">
                  {selections.preBagging.map((pb, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>Option #{pb.optionId}</span>
                      <span className="text-muted-foreground">
                        Qty: {pb.quantity} × {pb.unitSize}{pb.unitSizeUnit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Weight */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="font-medium">
                ${unitPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Weight</span>
              <span className="font-medium">
                {totalWeight.toFixed(1)} {weightUnit}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-xl text-primary">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
