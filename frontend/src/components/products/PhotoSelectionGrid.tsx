'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface PhotoSelectionGridProps {
  availablePhotos: Array<{
    id: number;
    attributes: {
      url: string;
      name?: string;
    };
  }>;
  selectedPhotoIds: number[];
  onToggle: (id: number) => void;
  limits: {
    min: number;
    max: number;
  };
}

export default function PhotoSelectionGrid({
  availablePhotos,
  selectedPhotoIds,
  onToggle,
  limits,
}: PhotoSelectionGridProps) {
  const handleClick = (id: number) => {
    const isSelected = selectedPhotoIds.includes(id);
    const isAtMax = selectedPhotoIds.length >= limits.max;

    console.log('Photo clicked:', { id, isSelected, isAtMax, selectedPhotoIds });

    // Allow deselection even when at max, but prevent new selection
    if (!isSelected && isAtMax) {
      console.log('Cannot select - at max limit');
      return;
    }

    onToggle(id);
  };

  return (
    <div className="space-y-4">
      {/* Selection count badge */}
      <div className="text-sm text-neutral-700 font-semibold">
        {selectedPhotoIds.length} / {limits.max} Selected
      </div>

      {/* Grid of photos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {availablePhotos.map((photo) => {
          const isSelected = selectedPhotoIds.includes(photo.id);
          const isAtMax = selectedPhotoIds.length >= limits.max;
          const isDisabled = !isSelected && isAtMax;

          return (
            <div
              key={photo.id}
              onClick={() => handleClick(photo.id)}
              className={`aspect-square rounded-xl cursor-pointer border-2 transition-all relative overflow-hidden group ${
                isSelected
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : isDisabled
                  ? 'border-neutral-200 opacity-50 cursor-not-allowed'
                  : 'border-neutral-200 hover:border-orange-300'
              }`}
            >
              <img
                src={photo.attributes.url}
                alt={photo.attributes.name || `Photo ${photo.id}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {isSelected && (
                <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1 text-white shadow-lg pointer-events-none">
                  <Check size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
