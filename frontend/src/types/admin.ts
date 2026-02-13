/**
 * Admin-specific type definitions
 */

// ============================================================================
// Form Data Types (before Strapi formatting)
// ============================================================================

export interface BackgroundStyleFormData {
  name: string;
  type: 'solid_color' | 'gradient' | 'texture' | 'image';
  color_hex?: string;
  preview_image?: File;
  text_color?: string;
  text_background?: string;
  sort_order: number;
}

export interface FontStyleFormData {
  name: string;
  font_family: string;
  category: 'sans_serif' | 'serif' | 'display' | 'script';
  preview_image?: File;
  font_file?: File;
  google_fonts_url?: string;
  sort_order: number;
}

// ============================================================================
// List Params
// ============================================================================

export interface StylesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'solid_color' | 'gradient' | 'texture' | 'image';
  category?: 'sans_serif' | 'serif' | 'display' | 'script';
  status?: 'all' | 'published' | 'draft';
}

// ============================================================================
// Stats
// ============================================================================

export interface BackgroundStyleStats {
  total: number;
  published: number;
  draft: number;
  byType: {
    solid_color: number;
    gradient: number;
    texture: number;
    image: number;
  };
}

export interface FontStyleStats {
  total: number;
  published: number;
  draft: number;
  byCategory: {
    sans_serif: number;
    serif: number;
    display: number;
    script: number;
  };
}
