'use client';

import React from 'react';
import { Palette, Type, Upload } from 'lucide-react';
import type { BackgroundStyle, FontStyle } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';
import { hexToGradient } from '@/lib/utils/color';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';

interface BackgroundFontSelectorProps {
  backgrounds: BackgroundStyle[];
  fonts: FontStyle[];
  selectedBackgroundIds: number[];
  selectedFontIds: number[];
  onToggleBackground: (id: number) => void;
  onToggleFont: (id: number) => void;
  userLogo?: string | null;
  onLogoUpload?: (file: File) => void;
}

export default function BackgroundFontSelector({
  backgrounds,
  fonts,
  selectedBackgroundIds,
  selectedFontIds,
  onToggleBackground,
  onToggleFont,
  userLogo,
  onLogoUpload,
}: BackgroundFontSelectorProps) {
  // Pre-load all font families so they render in the preview spans
  useGoogleFonts(fonts.map((f) => f.attributes.font_family).filter(Boolean));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/svg+xml', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG, JPG, and SVG files are allowed');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be under 2MB');
      return;
    }

    onLogoUpload?.(file);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Backgrounds */}
      <div>
        <label className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest flex items-center space-x-2 mb-3">
          <Palette size={14} /> <span>Background Theme</span>
        </label>
        <div className="space-y-2">
          {backgrounds.map(bg => (
            <button
              key={bg.id}
              onClick={() => onToggleBackground(bg.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedBackgroundIds.includes(bg.id)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-neutral-900 dark:text-orange-100 ring-2 ring-orange-200 dark:ring-orange-800'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Visual swatch */}
                {(() => {
                  const type = bg.attributes.type || 'solid_color';
                  const previewUrl = bg.attributes.preview_image?.data
                    ? getImageUrl(bg.attributes.preview_image.data)
                    : null;

                  if ((type === 'texture' || type === 'image') && previewUrl) {
                    return (
                      <img
                        src={previewUrl}
                        alt={bg.attributes.name}
                        className="w-10 h-10 rounded object-cover border flex-shrink-0"
                      />
                    );
                  }
                  if (type === 'gradient') {
                    return (
                      <div
                        className="w-10 h-10 rounded border flex-shrink-0"
                        style={{ background: hexToGradient(bg.attributes.color_hex) }}
                      />
                    );
                  }
                  return (
                    <div
                      className="w-10 h-10 rounded border flex-shrink-0"
                      style={{ backgroundColor: bg.attributes.color_hex || '#e5e7eb' }}
                    />
                  );
                })()}
                <div className="font-semibold">{bg.attributes.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <label className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest flex items-center space-x-2 mb-3">
          <Type size={14} /> <span>Typography</span>
        </label>
        <div className="space-y-2">
          {fonts.map(font => (
            <button
              key={font.id}
              onClick={() => onToggleFont(font.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedFontIds.includes(font.id)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-neutral-900 dark:text-orange-100 ring-2 ring-orange-200 dark:ring-orange-800'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/20'
              }`}
            >
              <div className="font-semibold">{font.attributes.name}</div>
              <div
                className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5"
                style={{ fontFamily: font.attributes.font_family }}
              >
                Aa Bb Cc 123
              </div>
            </button>
          ))}
        </div>

        {/* Logo Upload */}
        {onLogoUpload && (
          <div className="mt-6">
            <label
              htmlFor="logo-upload"
              className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest mb-3 flex items-center space-x-2"
            >
              <Upload size={14} /> <span>Upload Business Logo</span>
            </label>
            <label htmlFor="logo-upload" className="block cursor-pointer">
              <div className="p-6 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-neutral-600 dark:text-neutral-400 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-colors group">
                <Upload size={32} className="mb-2 group-hover:text-orange-500 transition-colors" />
                <p className="text-sm">Upload Business Logo</p>
                <p className="text-[10px] uppercase mt-1">PNG, SVG (Max 2MB)</p>
                {userLogo && <img src={userLogo} alt="Logo" className="mt-4 max-h-16" />}
              </div>
            </label>
            <input
              id="logo-upload"
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
