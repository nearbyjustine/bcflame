'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code, Eye, Sparkles } from 'lucide-react';
import type { TextEffect } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';
import { cn } from '@/lib/utils';

interface TextEffectSelectorProps {
  textEffects: TextEffect[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  min?: number;
  max?: number;
}

export function TextEffectSelector({
  textEffects,
  selectedIds,
  onToggle,
  min = 0,
  max = 3,
}: TextEffectSelectorProps) {
  const [previewEffect, setPreviewEffect] = useState<TextEffect | null>(null);

  // Auto-select default if no selection and min > 0
  useEffect(() => {
    if (selectedIds.length === 0 && min > 0) {
      const defaultEffect = textEffects.find((e) => e.attributes.is_default);
      if (defaultEffect) {
        onToggle(defaultEffect.id);
      }
    }
  }, [textEffects, selectedIds.length, min, onToggle]);

  const canSelectMore = selectedIds.length < max;
  const needsMore = selectedIds.length < min;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Text Effects
          </h3>
          <Badge variant={needsMore ? 'destructive' : 'secondary'}>
            {selectedIds.length} / {max} selected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {min > 0
            ? `Select ${min === max ? 'exactly' : 'at least'} ${min} text effect${min > 1 ? 's' : ''}`
            : `Select up to ${max} text effect${max > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {textEffects.map((effect) => {
          const isSelected = selectedIds.includes(effect.id);
          const canSelect = canSelectMore || isSelected;

          return (
            <Card
              key={effect.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary',
                !canSelect && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => canSelect && onToggle(effect.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{effect.attributes.name}</CardTitle>
                  {isSelected && (
                    <Badge variant="default" className="ml-2">
                      Selected
                    </Badge>
                  )}
                </div>
                {effect.attributes.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {effect.attributes.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Preview Image or Placeholder */}
                {effect.attributes.preview_image?.data ? (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                    <img
                      src={getImageUrl(effect.attributes.preview_image.data) || ''}
                      alt={effect.attributes.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-md bg-muted flex items-center justify-center">
                    <Code className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {effect.attributes.browser_support && (
                    <span>{effect.attributes.browser_support}</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEffect(effect);
                    }}
                    className="h-7 px-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview CSS
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewEffect && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 border-0 text-left cursor-default"
          onClick={() => setPreviewEffect(null)}
          aria-label="Close preview"
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>{previewEffect.attributes.name}</CardTitle>
              {previewEffect.attributes.description && (
                <CardDescription>{previewEffect.attributes.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CSS Code */}
              <div>
                <h4 className="text-sm font-medium mb-2">CSS Code:</h4>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                  <code>{previewEffect.attributes.css_code}</code>
                </pre>
              </div>

              {/* HTML Structure */}
              {previewEffect.attributes.html_structure && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Required HTML Structure:</h4>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                    <code>{previewEffect.attributes.html_structure}</code>
                  </pre>
                </div>
              )}

              {/* Font Dependencies */}
              {previewEffect.attributes.font_dependencies && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Font Dependencies:</h4>
                  <div className="bg-muted p-4 rounded-md text-xs space-y-2">
                    {previewEffect.attributes.font_dependencies.google_fonts &&
                      previewEffect.attributes.font_dependencies.google_fonts.length > 0 && (
                        <div>
                          <span className="font-medium">Google Fonts:</span>{' '}
                          {previewEffect.attributes.font_dependencies.google_fonts.join(', ')}
                        </div>
                      )}
                    {previewEffect.attributes.font_dependencies.custom_fonts &&
                      previewEffect.attributes.font_dependencies.custom_fonts.length > 0 && (
                        <div>
                          <span className="font-medium">Custom Fonts:</span>
                          <ul className="list-disc list-inside ml-2">
                            {previewEffect.attributes.font_dependencies.custom_fonts.map(
                              (font) => (
                                <li key={`${font.family}-${font.note || 'default'}`}>
                                  {font.family} {font.note && `(${font.note})`}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <Button onClick={() => setPreviewEffect(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </button>
      )}
    </div>
  );
}
