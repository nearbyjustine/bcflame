'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface EffectPreviewProps {
  cssCode: string;
  category: 'text_effect' | 'background_effect' | 'image_filter' | 'ui_enhancement';
  className?: string;
}

export function EffectPreview({ cssCode, category, className }: EffectPreviewProps) {
  const [enabled, setEnabled] = useState(true);
  const [styleId] = useState(() => `effect-preview-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    if (!enabled || !cssCode) return;

    // Create a style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssCode;
    document.head.appendChild(style);

    return () => {
      // Cleanup on unmount or when CSS changes
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [cssCode, enabled, styleId]);

  const getPreviewContent = () => {
    switch (category) {
      case 'text_effect':
        return (
          <div className="text-center py-8">
            <h1 className="text-6xl font-bold">Sample Text</h1>
            <p className="text-2xl mt-4">Preview Effect</p>
          </div>
        );
      case 'image_filter':
        return (
          <div className="flex justify-center py-8">
            <div className="w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg" />
          </div>
        );
      case 'background_effect':
        return (
          <div className="h-64 flex items-center justify-center">
            <p className="text-2xl font-bold text-white">Background Effect</p>
          </div>
        );
      case 'ui_enhancement':
        return (
          <div className="flex justify-center items-center py-8">
            <Card className="w-64">
              <CardHeader>
                <CardTitle>UI Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the UI enhancement effect.</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Select a category to see preview
          </div>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Preview</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Enabled
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Disabled
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg bg-background overflow-hidden">
          {getPreviewContent()}
        </div>
        {!cssCode && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Enter CSS code to see live preview
          </p>
        )}
      </CardContent>
    </Card>
  );
}
