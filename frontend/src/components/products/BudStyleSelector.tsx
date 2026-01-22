'use client';

import React from 'react';
import type { BudStyle } from '@/types/customization';

interface BudStyleSelectorProps {
  budStyles: BudStyle[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  limits: {
    min: number;
    max: number;
  };
  label?: string;
}

export default function BudStyleSelector({
  budStyles,
  selectedIds,
  onToggle,
  limits,
  label,
}: BudStyleSelectorProps) {
  const handleSelect = (id: number) => {
    const isSelected = selectedIds.includes(id);
    const isAtMax = selectedIds.length >= limits.max;

    // Allow deselection even when at max, but prevent new selection
    if (!isSelected && isAtMax) {
      return;
    }

    onToggle(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        {label && (
          <label className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="text-sm text-neutral-700 dark:text-neutral-300 font-semibold">
          {selectedIds.length} / {limits.max} Selected
        </div>
      </div>

      <div className="space-y-2">
        {budStyles.map(style => (
          <button
            key={style.id}
            onClick={() => handleSelect(style.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedIds.includes(style.id)
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-neutral-900 dark:text-orange-100 ring-2 ring-orange-200 dark:ring-orange-800'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/20'
            }`}
          >
            <div className="font-semibold">{style.attributes.name}</div>
            {style.attributes.description && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{style.attributes.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
