'use client';

import React from 'react';
import type { BackgroundStyle, FontStyle } from '@/types/customization';
import { getImageUrl } from '@/lib/utils/image';
import { hexToGradient, isDarkColor } from '@/lib/utils/color';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';

interface PackagePreviewProps {
  background?: BackgroundStyle | null;
  font?: FontStyle | null;
  logoUrl?: string | null;
  companyName?: string;
  width?: number;
  height?: number;
}

export default function PackagePreview({
  background,
  font,
  logoUrl,
  companyName,
  width = 280,
  height = 200,
}: PackagePreviewProps) {
  const fontFamily = font?.attributes?.font_family || 'sans-serif';
  useGoogleFonts(font?.attributes?.font_family ? [font.attributes.font_family] : []);

  const displayName = companyName || 'YOUR BRAND';

  // Resolve background fill
  const bgType = background?.attributes?.type || 'solid_color';
  const colorHex = background?.attributes?.color_hex || '#f0f0f0';
  const previewImageData = background?.attributes?.preview_image?.data;
  const previewImageUrl = previewImageData ? getImageUrl(previewImageData) : null;

  // Geometry constants
  const sealHeight = 18;
  const bagRadius = 12;
  const labelY = height * 0.52;
  const labelHeight = height * 0.38;
  const labelRadius = 8;
  const labelX = width * 0.12;
  const labelWidth = width * 0.76;

  // Unique IDs for SVG defs (avoids collisions if multiple previews on page)
  const uid = React.useId().replace(/:/g, '');
  const gradientId = `grad-${uid}`;
  const clipId = `clip-${uid}`;
  const patternId = `pattern-${uid}`;

  // Determine bag body fill
  let bagFill: string;
  let usesImage = false;
  let usesGradient = false;

  if ((bgType === 'texture' || bgType === 'image') && previewImageUrl) {
    usesImage = true;
    bagFill = `url(#${patternId})`;
  } else if (bgType === 'gradient') {
    usesGradient = true;
    bagFill = `url(#${gradientId})`;
  } else {
    bagFill = colorHex;
  }

  // Compute the lighter gradient stop: mix color 60% with white 40% in sRGB,
  // matching what color-mix(in srgb, hex 60%, white 40%) does in CSS.
  const lighterHex = (() => {
    let h = colorHex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return '#e0e0e0';
    const r = Math.round(parseInt(h.slice(0, 2), 16) * 0.6 + 255 * 0.4);
    const g = Math.round(parseInt(h.slice(2, 4), 16) * 0.6 + 255 * 0.4);
    const b = Math.round(parseInt(h.slice(4, 6), 16) * 0.6 + 255 * 0.4);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  })();

  // Seal strip is slightly darker than the bag body
  const sealColor = isDarkColor(colorHex) ? '#d0d0d0' : '#1a1a1a';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-md">
      <defs>
        {/* Clip path for the entire bag body (rounded rect) */}
        <clipPath id={clipId}>
          <rect x={0} y={sealHeight} width={width} height={height - sealHeight} rx={bagRadius} />
        </clipPath>

        {/* Gradient for gradient-type backgrounds: same 135deg diagonal as hexToGradient */}
        {usesGradient && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorHex} />
            <stop offset="100%" stopColor={lighterHex} />
          </linearGradient>
        )}

        {/* Pattern for texture/image backgrounds */}
        {usesImage && previewImageUrl && (
          <pattern id={patternId} patternUnits="userSpaceOnUse" width={width} height={height - sealHeight}>
            <image href={previewImageUrl} width={width} height={height - sealHeight} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        )}
      </defs>

      {/* 1. Bag body */}
      <rect
        x={0}
        y={sealHeight}
        width={width}
        height={height - sealHeight}
        rx={bagRadius}
        fill={bagFill}
      />

      {/* 2. Seal/crimp edge at the top */}
      <rect
        x={width * 0.08}
        y={0}
        width={width * 0.84}
        height={sealHeight}
        rx={4}
        fill={sealColor}
        opacity={0.7}
      />
      {/* Fold line under the seal */}
      <line
        x1={width * 0.08}
        y1={sealHeight}
        x2={width * 0.92}
        y2={sealHeight}
        stroke={sealColor}
        strokeWidth={2}
        opacity={0.5}
      />

      {/* 3. Label area – white rounded rect in the lower portion */}
      <rect
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={labelHeight}
        rx={labelRadius}
        fill="#ffffff"
        opacity={0.95}
      />
      {/* Subtle label border */}
      <rect
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={labelHeight}
        rx={labelRadius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1}
      />

      {/* 4. Logo on the label */}
      {logoUrl && (
        <image
          href={logoUrl}
          x={labelX + labelWidth / 2 - 22}
          y={labelY + 6}
          width={44}
          height={28}
          preserveAspectRatio="xMidYMid meet"
        />
      )}

      {/* 5. Brand text */}
      <text
        x={labelX + labelWidth / 2}
        y={logoUrl ? labelY + labelHeight - 18 : labelY + labelHeight / 2 + 6}
        textAnchor="middle"
        fontFamily={fontFamily}
        fontSize={logoUrl ? 13 : 16}
        fontWeight="600"
        fill="#1f2937"
        letterSpacing="0.08em"
      >
        {displayName}
      </text>
    </svg>
  );
}
