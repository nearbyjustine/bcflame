'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { PreBaggingOption, PreBaggingSelection } from '@/types/customization';

interface PreBaggingConfigProps {
  options: PreBaggingOption[];
  selections: PreBaggingSelection[];
  onUpdate: (optionId: number, quantity: number, unitSize: number, unitSizeUnit: string, customText?: string) => void;
  onRemove: (optionId: number) => void;
}

export default function PreBaggingConfig({
  options,
  selections,
  onUpdate,
  onRemove,
}: PreBaggingConfigProps) {

  const handleQuantityChange = (optionId: number, quantity: number, unitSize: number, unitSizeUnit: string) => {
    if (quantity <= 0) {
      onRemove(optionId);
    } else {
      onUpdate(optionId, quantity, unitSize, unitSizeUnit);
    }
  };

  const getSelectionQuantity = (optionId: number): number => {
    return selections.find(s => s.optionId === optionId)?.quantity || 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-accent/30 p-8 rounded-2xl border border-accent">
        <h4 className="text-xl font-bold mb-6 flex items-center space-x-2 text-foreground">
          <ShoppingBag size={20} className="text-primary" />
          <span>Pre-Bagging Service (Optional)</span>
        </h4>

        <p className="text-sm text-muted-foreground mb-6">
          Select bag sizes and quantities for pre-bagging service. You can select multiple sizes.
        </p>

        {/* Pre-bagging options */}
        <div className="space-y-4">
          {options.map(option => {
            const quantity = getSelectionQuantity(option.id);

            return (
              <div
                key={option.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-accent hover:bg-accent/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-foreground font-medium">{option.attributes.name}</span>
                    {option.attributes.unit_size && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({option.attributes.unit_size}{option.attributes.unit_size_unit})
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(option.id, Math.max(0, quantity - 1), option.attributes.unit_size, option.attributes.unit_size_unit)}
                    disabled={quantity === 0}
                    className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(option.id, parseInt(e.target.value) || 0, option.attributes.unit_size, option.attributes.unit_size_unit)}
                    min="0"
                    className="w-20 h-10 bg-card rounded-lg border border-border text-center text-foreground font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => handleQuantityChange(option.id, quantity + 1, option.attributes.unit_size, option.attributes.unit_size_unit)}
                    className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-muted-foreground">bags</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {selections.length > 0 && (
        <div className="p-4 bg-accent border border-accent rounded-xl">
          <p className="text-sm text-accent-foreground font-semibold mb-2">Pre-Bagging Summary:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {selections.map(selection => {
              const option = options.find(opt => opt.id === selection.optionId);
              return (
                <li key={selection.optionId}>
                  {selection.quantity}x {option?.attributes.name}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
