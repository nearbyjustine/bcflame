/**
 * Image utility functions for handling Strapi image URLs
 */

import type { ProductImage } from '@/types/product';

/**
 * Strapi media response format wrapper
 */
interface StrapiMediaWrapper {
  id: number;
  attributes: {
    url: string;
    alternativeText?: string;
    name?: string;
    [key: string]: any;
  };
}

/**
 * Type guard to check if image is in Strapi wrapper format
 */
function isStrapiWrappedImage(
  image: ProductImage | StrapiMediaWrapper
): image is StrapiMediaWrapper {
  return 'attributes' in image && typeof image.attributes === 'object';
}

/**
 * Extract image URL from either ProductImage or Strapi wrapper format
 */
export function getImageUrl(
  image: ProductImage | StrapiMediaWrapper | null | undefined
): string | null {
  if (!image) return null;

  const url = isStrapiWrappedImage(image)
    ? image.attributes.url
    : image.url;

  if (!url) return null;

  // Return absolute URLs as-is
  if (url.startsWith('http')) {
    return url;
  }

  // Prepend Strapi URL for relative URLs
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  return `${strapiUrl}${url}`;
}

/**
 * Extract image name from either ProductImage or Strapi wrapper format
 */
export function getImageName(
  image: ProductImage | StrapiMediaWrapper | null | undefined,
  fallback: string = 'Image'
): string {
  if (!image) return fallback;

  if (isStrapiWrappedImage(image)) {
    return image.attributes.name || image.attributes.alternativeText || fallback;
  }

  return image.name || image.alternativeText || fallback;
}

/**
 * Extract image alt text from either ProductImage or Strapi wrapper format
 */
export function getImageAlt(
  image: ProductImage | StrapiMediaWrapper | null | undefined,
  fallback: string = ''
): string {
  if (!image) return fallback;

  if (isStrapiWrappedImage(image)) {
    return image.attributes.alternativeText || image.attributes.name || fallback;
  }

  return image.alternativeText || image.name || fallback;
}
