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
      <div className="bg-orange-50/30 p-8 rounded-2xl border border-orange-200">
        <h4 className="text-xl font-bold mb-6 flex items-center space-x-2 text-neutral-900">
          <ShoppingBag size={20} className="text-orange-500" />
          <span>Pre-Bagging Service (Optional)</span>
        </h4>

        <p className="text-sm text-neutral-600 mb-6">
          Select bag sizes and quantities for pre-bagging service. You can select multiple sizes.
        </p>

        {/* Pre-bagging options */}
        <div className="space-y-4">
          {options.map(option => {
            const quantity = getSelectionQuantity(option.id);

            return (
              <div
                key={option.id}
                className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-neutral-900 font-medium">{option.attributes.name}</span>
                    {option.attributes.unit_size && (
                      <span className="text-sm text-neutral-600 ml-2">
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
                    className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(option.id, parseInt(e.target.value) || 0, option.attributes.unit_size, option.attributes.unit_size_unit)}
                    min="0"
                    className="w-20 h-10 bg-white rounded-lg border border-neutral-300 text-center text-neutral-900 font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    onClick={() => handleQuantityChange(option.id, quantity + 1, option.attributes.unit_size, option.attributes.unit_size_unit)}
                    className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-lg font-bold text-white hover:bg-orange-600 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-neutral-600">bags</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {selections.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl">
          <p className="text-sm text-orange-700 font-semibold mb-2">Pre-Bagging Summary:</p>
          <ul className="text-sm text-neutral-700 space-y-1">
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
