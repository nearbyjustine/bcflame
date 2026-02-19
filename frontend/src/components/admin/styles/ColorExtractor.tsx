'use client';

import { useEffect, useState } from 'react';
import { Palette, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { extractAndSuggestColors } from '@/lib/utils/color-extraction';
import { cn } from '@/lib/utils';

interface ColorExtractorProps {
  imageFile: File | null;
  onColorsExtracted: (colors: { textColor: string; textBackground: string }) => void;
  disabled?: boolean;
}

export function ColorExtractor({
  imageFile,
  onColorsExtracted,
  disabled = false,
}: ColorExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedColors, setExtractedColors] = useState<{
    dominantColor: string;
    palette: string[];
    suggestedTextColor: string;
    suggestedTextBackground: string;
  } | null>(null);
  const [selectedTextColor, setSelectedTextColor] = useState('');
  const [selectedTextBg, setSelectedTextBg] = useState('');

  // Extract colors when image changes
  useEffect(() => {
    if (!imageFile) {
      setExtractedColors(null);
      setSelectedTextColor('');
      setSelectedTextBg('');
      return;
    }

    setIsExtracting(true);
    extractAndSuggestColors(imageFile)
      .then((colors) => {
        setExtractedColors(colors);
        setSelectedTextColor(colors.suggestedTextColor);
        setSelectedTextBg(colors.suggestedTextBackground);
        onColorsExtracted({
          textColor: colors.suggestedTextColor,
          textBackground: colors.suggestedTextBackground,
        });
      })
      .catch((error) => {
        console.error('Failed to extract colors:', error);
        // Set defaults on error
        const defaults = {
          textColor: '#FFFFFF',
          textBackground: 'rgba(0, 0, 0, 0.3)',
        };
        setSelectedTextColor(defaults.textColor);
        setSelectedTextBg(defaults.textBackground);
        onColorsExtracted(defaults);
      })
      .finally(() => {
        setIsExtracting(false);
      });
  }, [imageFile, onColorsExtracted]);

  // Handle color changes
  const handleTextColorChange = (color: string) => {
    setSelectedTextColor(color);
    onColorsExtracted({
      textColor: color,
      textBackground: selectedTextBg,
    });
  };

  const handleTextBgChange = (color: string) => {
    setSelectedTextBg(color);
    onColorsExtracted({
      textColor: selectedTextColor,
      textBackground: color,
    });
  };

  if (!imageFile) {
    return null;
  }

  if (isExtracting) {
    return (
      <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Extracting colors from image...</p>
      </div>
    );
  }

  if (!extractedColors) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold">Extracted Colors</h3>
      </div>

      {/* Color Palette */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Dominant colors from image:</p>
        <div className="flex space-x-2">
          {extractedColors.palette.map((color, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded border-2 border-background shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Text Color Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Text Color</label>
        <div className="flex items-center space-x-2">
          <Input
            type="color"
            value={selectedTextColor}
            onChange={(e) => handleTextColorChange(e.target.value)}
            disabled={disabled}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={selectedTextColor}
            onChange={(e) => handleTextColorChange(e.target.value)}
            disabled={disabled}
            placeholder="#FFFFFF"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-suggested based on background contrast
        </p>
      </div>

      {/* Text Background Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Text Background (optional)</label>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={selectedTextBg}
            onChange={(e) => handleTextBgChange(e.target.value)}
            disabled={disabled}
            placeholder="rgba(0, 0, 0, 0.3)"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Semi-transparent background for better text readability
        </p>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
        <div
          className="relative h-24 rounded flex items-center justify-center"
          style={{ backgroundColor: extractedColors.dominantColor }}
        >
          <div
            className="px-4 py-2 rounded"
            style={{ backgroundColor: selectedTextBg }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: selectedTextColor }}
            >
              BC Flame Premium
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
