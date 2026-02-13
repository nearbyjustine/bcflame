'use client';

import { cn } from '@/lib/utils';
import { hexToGradient } from '@/lib/utils/color';
import { getImageUrl } from '@/lib/utils/image';

interface StylePreviewProps {
  type: 'background' | 'font';
  // Background props
  backgroundType?: 'solid_color' | 'gradient' | 'texture' | 'image';
  backgroundValue?: string;
  textColor?: string;
  textBackground?: string;
  // Font props
  fontFamily?: string;
  fontCategory?: string;
  // Common
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StylePreview({
  type,
  backgroundType,
  backgroundValue,
  textColor,
  textBackground,
  fontFamily,
  fontCategory,
  size = 'md',
  className,
}: StylePreviewProps) {
  const sizeClasses = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-48',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (type === 'background') {
    let bgStyle: React.CSSProperties = {};

    if (backgroundType === 'solid_color' && backgroundValue) {
      bgStyle.backgroundColor = backgroundValue;
    } else if (backgroundType === 'gradient' && backgroundValue) {
      bgStyle.background = hexToGradient(backgroundValue);
    } else if (backgroundType === 'texture' || backgroundType === 'image') {
      if (backgroundValue) {
        // backgroundValue can be a URL string or an image path
        const imageUrl = typeof backgroundValue === 'string'
          ? backgroundValue.startsWith('http') || backgroundValue.startsWith('blob:')
            ? backgroundValue
            : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}${backgroundValue}`
          : '#f0f0f0';

        if (imageUrl !== '#f0f0f0') {
          bgStyle.backgroundImage = `url(${imageUrl})`;
          bgStyle.backgroundSize = 'cover';
          bgStyle.backgroundPosition = 'center';
        } else {
          bgStyle.backgroundColor = imageUrl;
        }
      } else {
        bgStyle.backgroundColor = '#f0f0f0';
      }
    } else {
      bgStyle.backgroundColor = '#f0f0f0';
    }

    return (
      <div
        className={cn(
          'relative rounded-lg overflow-hidden flex items-center justify-center',
          sizeClasses[size],
          className
        )}
        style={bgStyle}
      >
        <div
          className="px-4 py-2 rounded"
          style={{
            backgroundColor: textBackground || 'transparent',
          }}
        >
          <p
            className={cn('font-semibold', textSizeClasses[size])}
            style={{
              color: textColor || '#000000',
            }}
          >
            BC Flame Premium
          </p>
        </div>
      </div>
    );
  }

  if (type === 'font') {
    return (
      <div
        className={cn(
          'relative rounded-lg border bg-card overflow-hidden flex items-center justify-center p-4',
          sizeClasses[size],
          className
        )}
      >
        <p
          className={cn('font-semibold text-center', textSizeClasses[size])}
          style={{
            fontFamily: fontFamily || 'inherit',
          }}
        >
          BC Flame Premium
          {fontCategory && (
            <span className="block text-xs text-muted-foreground mt-1 font-normal">
              {fontCategory.replace('_', ' ')}
            </span>
          )}
        </p>
      </div>
    );
  }

  return null;
}
