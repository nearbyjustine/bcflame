import { strapiApi } from './strapi';
import type {
  BackgroundStyle,
  FontStyle,
  TextEffect,
  TextEffectsResponse,
  SingleTextEffectResponse
} from '@/types/customization';

// ============================================================================
// Types
// ============================================================================

export interface StylesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'solid_color' | 'gradient' | 'texture' | 'image';
  category?: 'sans_serif' | 'serif' | 'display' | 'script';
  status?: 'all' | 'published' | 'draft';
}

export interface BackgroundStyleFormData {
  name: string;
  type: 'solid_color' | 'gradient' | 'texture' | 'image';
  color_hex?: string;
  text_color?: string;
  text_background?: string;
  sort_order?: number;
}

export interface FontStyleFormData {
  name: string;
  font_family: string;
  category: 'sans_serif' | 'serif' | 'display' | 'script';
  sort_order?: number;
}

export interface BackgroundStylesResponse {
  data: BackgroundStyle[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface FontStylesResponse {
  data: FontStyle[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface SingleBackgroundStyleResponse {
  data: BackgroundStyle;
}

export interface SingleFontStyleResponse {
  data: FontStyle;
}

// ============================================================================
// Background Styles API
// ============================================================================

/**
 * Get admin background styles with pagination and filters
 */
export async function getAdminBackgroundStyles(
  params?: StylesListParams
): Promise<{
  styles: BackgroundStyle[];
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
}> {
  const {
    page = 1,
    pageSize = 25,
    search,
    type,
    status = 'all',
  } = params || {};

  // Build filters
  const filters: Record<string, any> = {};

  if (search) {
    filters.name = { $containsi: search };
  }

  if (type) {
    filters.type = { $eq: type };
  }

  const response = await strapiApi.get<BackgroundStylesResponse>('/api/background-styles', {
    params: {
      populate: 'preview_image',
      pagination: { page, pageSize },
      ...(Object.keys(filters).length > 0 && { filters }),
      ...(status === 'published' && { publicationState: 'live' }),
      ...(status === 'draft' && {
        publicationState: 'preview',
        filters: { ...filters, publishedAt: { $null: true } },
      }),
      ...(status === 'all' && { publicationState: 'preview' }),
      sort: ['sort_order:asc', 'name:asc'],
    },
  });

  return {
    styles: response.data.data,
    pagination: response.data.meta.pagination,
  };
}

/**
 * Get single background style by ID
 */
export async function getBackgroundStyleById(id: number): Promise<BackgroundStyle> {
  const response = await strapiApi.get<SingleBackgroundStyleResponse>(
    `/api/background-styles/${id}`,
    {
      params: {
        populate: 'preview_image',
        publicationState: 'preview',
      },
    }
  );

  return response.data.data;
}

/**
 * Create a new background style
 */
export async function createBackgroundStyle(
  data: BackgroundStyleFormData,
  previewImage?: File
): Promise<BackgroundStyle> {
  // First create the style record
  const response = await strapiApi.post<SingleBackgroundStyleResponse>(
    '/api/background-styles',
    {
      data: {
        ...data,
        sort_order: data.sort_order ?? 0,
      },
    }
  );

  const createdStyle = response.data.data;

  // Upload preview image if provided
  if (previewImage && createdStyle.id) {
    await uploadBackgroundStyleImage(createdStyle.id, previewImage);
    // Fetch updated style with image
    return getBackgroundStyleById(createdStyle.id);
  }

  return createdStyle;
}

/**
 * Update an existing background style
 */
export async function updateBackgroundStyle(
  id: number,
  data: Partial<BackgroundStyleFormData>,
  previewImage?: File
): Promise<BackgroundStyle> {
  // Update the style record
  const response = await strapiApi.put<SingleBackgroundStyleResponse>(
    `/api/background-styles/${id}`,
    {
      data,
    }
  );

  // Upload new preview image if provided
  if (previewImage) {
    await uploadBackgroundStyleImage(id, previewImage);
    // Fetch updated style with new image
    return getBackgroundStyleById(id);
  }

  return response.data.data;
}

/**
 * Delete a background style
 */
export async function deleteBackgroundStyle(id: number): Promise<void> {
  await strapiApi.delete(`/api/background-styles/${id}`);
}

/**
 * Publish a background style
 */
export async function publishBackgroundStyle(id: number): Promise<BackgroundStyle> {
  return updateBackgroundStyle(id, {});
}

/**
 * Unpublish a background style
 */
export async function unpublishBackgroundStyle(id: number): Promise<BackgroundStyle> {
  const response = await strapiApi.put<SingleBackgroundStyleResponse>(
    `/api/background-styles/${id}`,
    {
      data: {
        publishedAt: null,
      },
    }
  );
  return response.data.data;
}

/**
 * Upload preview image for a background style
 */
async function uploadBackgroundStyleImage(styleId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'api::background-style.background-style');
  formData.append('refId', styleId.toString());
  formData.append('field', 'preview_image');

  await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ============================================================================
// Font Styles API
// ============================================================================

/**
 * Get admin font styles with pagination and filters
 */
export async function getAdminFontStyles(
  params?: StylesListParams
): Promise<{
  styles: FontStyle[];
  pagination: { page: number; pageSize: number; pageCount: number; total: number };
}> {
  const {
    page = 1,
    pageSize = 25,
    search,
    category,
    status = 'all',
  } = params || {};

  // Build filters
  const filters: Record<string, any> = {};

  if (search) {
    filters.$or = [
      { name: { $containsi: search } },
      { font_family: { $containsi: search } },
    ];
  }

  if (category) {
    filters.category = { $eq: category };
  }

  const response = await strapiApi.get<FontStylesResponse>('/api/font-styles', {
    params: {
      populate: ['preview_image', 'font_file'],
      pagination: { page, pageSize },
      ...(Object.keys(filters).length > 0 && { filters }),
      ...(status === 'published' && { publicationState: 'live' }),
      ...(status === 'draft' && {
        publicationState: 'preview',
        filters: { ...filters, publishedAt: { $null: true } },
      }),
      ...(status === 'all' && { publicationState: 'preview' }),
      sort: ['sort_order:asc', 'name:asc'],
    },
  });

  return {
    styles: response.data.data,
    pagination: response.data.meta.pagination,
  };
}

/**
 * Get single font style by ID
 */
export async function getFontStyleById(id: number): Promise<FontStyle> {
  const response = await strapiApi.get<SingleFontStyleResponse>(`/api/font-styles/${id}`, {
    params: {
      populate: ['preview_image', 'font_file'],
      publicationState: 'preview',
    },
  });

  return response.data.data;
}

/**
 * Create a new font style
 */
export async function createFontStyle(
  data: FontStyleFormData,
  previewImage?: File,
  fontFile?: File
): Promise<FontStyle> {
  // First create the style record
  const response = await strapiApi.post<SingleFontStyleResponse>('/api/font-styles', {
    data: {
      ...data,
      sort_order: data.sort_order ?? 0,
    },
  });

  const createdStyle = response.data.data;

  // Upload files if provided
  if (createdStyle.id) {
    const uploads: Promise<void>[] = [];

    if (previewImage) {
      uploads.push(uploadFontStyleImage(createdStyle.id, previewImage));
    }

    if (fontFile) {
      uploads.push(uploadFontFile(createdStyle.id, fontFile));
    }

    if (uploads.length > 0) {
      await Promise.all(uploads);
      // Fetch updated style with files
      return getFontStyleById(createdStyle.id);
    }
  }

  return createdStyle;
}

/**
 * Update an existing font style
 */
export async function updateFontStyle(
  id: number,
  data: Partial<FontStyleFormData>,
  previewImage?: File,
  fontFile?: File
): Promise<FontStyle> {
  // Update the style record
  const response = await strapiApi.put<SingleFontStyleResponse>(`/api/font-styles/${id}`, {
    data,
  });

  // Upload new files if provided
  const uploads: Promise<void>[] = [];

  if (previewImage) {
    uploads.push(uploadFontStyleImage(id, previewImage));
  }

  if (fontFile) {
    uploads.push(uploadFontFile(id, fontFile));
  }

  if (uploads.length > 0) {
    await Promise.all(uploads);
    // Fetch updated style with new files
    return getFontStyleById(id);
  }

  return response.data.data;
}

/**
 * Delete a font style
 */
export async function deleteFontStyle(id: number): Promise<void> {
  await strapiApi.delete(`/api/font-styles/${id}`);
}

/**
 * Publish a font style
 */
export async function publishFontStyle(id: number): Promise<FontStyle> {
  return updateFontStyle(id, {});
}

/**
 * Unpublish a font style
 */
export async function unpublishFontStyle(id: number): Promise<FontStyle> {
  const response = await strapiApi.put<SingleFontStyleResponse>(`/api/font-styles/${id}`, {
    data: {
      publishedAt: null,
    },
  });
  return response.data.data;
}

/**
 * Upload preview image for a font style
 */
async function uploadFontStyleImage(styleId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'api::font-style.font-style');
  formData.append('refId', styleId.toString());
  formData.append('field', 'preview_image');

  await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Upload font file for a font style
 */
async function uploadFontFile(styleId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'api::font-style.font-style');
  formData.append('refId', styleId.toString());
  formData.append('field', 'font_file');

  await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ============================================================================
// Text Effects API
// ============================================================================

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * Get admin text effects with pagination and filters
 */
export async function getAdminTextEffects(
  params?: StylesListParams
): Promise<{ effects: TextEffect[]; pagination: PaginationMeta }> {
  const { page = 1, pageSize = 25, search } = params || {};

  const filters: Record<string, any> = {};
  if (search) {
    filters.$or = [
      { name: { $containsi: search } },
      { description: { $containsi: search } },
    ];
  }

  const response = await strapiApi.get<TextEffectsResponse>('/api/text-effects', {
    params: {
      populate: 'preview_image',
      pagination: { page, pageSize },
      ...(Object.keys(filters).length > 0 && { filters }),
      publicationState: 'preview',
      sort: ['sort_order:asc', 'name:asc'],
    },
  });

  return {
    effects: response.data.data,
    pagination: response.data.meta.pagination,
  };
}

/**
 * Get single text effect by ID
 */
export async function getTextEffectById(id: number): Promise<TextEffect> {
  const response = await strapiApi.get<SingleTextEffectResponse>(
    `/api/text-effects/${id}`,
    { params: { populate: 'preview_image' } }
  );
  return response.data.data;
}

/**
 * Create a new text effect
 */
export async function createTextEffect(
  data: {
    name: string;
    description?: string;
    css_code: string;
    html_structure?: string;
    font_dependencies?: object;
    browser_support?: string;
    sort_order?: number;
    is_default?: boolean;
  },
  previewImage?: File
): Promise<TextEffect> {
  const response = await strapiApi.post<SingleTextEffectResponse>(
    '/api/text-effects',
    { data: { ...data, sort_order: data.sort_order ?? 0 } }
  );

  const createdEffect = response.data.data;

  // Upload preview image if provided
  if (previewImage && createdEffect.id) {
    await uploadTextEffectImage(createdEffect.id, previewImage);
    return getTextEffectById(createdEffect.id);
  }

  return createdEffect;
}

/**
 * Update an existing text effect
 */
export async function updateTextEffect(
  id: number,
  data: {
    name?: string;
    description?: string;
    css_code?: string;
    html_structure?: string;
    font_dependencies?: object;
    browser_support?: string;
    sort_order?: number;
    is_default?: boolean;
  },
  previewImage?: File
): Promise<TextEffect> {
  const response = await strapiApi.put<SingleTextEffectResponse>(
    `/api/text-effects/${id}`,
    { data }
  );

  const updatedEffect = response.data.data;

  if (previewImage) {
    await uploadTextEffectImage(id, previewImage);
    return getTextEffectById(id);
  }

  return updatedEffect;
}

/**
 * Delete a text effect
 */
export async function deleteTextEffect(id: number): Promise<void> {
  await strapiApi.delete(`/api/text-effects/${id}`);
}

/**
 * Publish a text effect
 */
export async function publishTextEffect(id: number): Promise<TextEffect> {
  const response = await strapiApi.put<SingleTextEffectResponse>(
    `/api/text-effects/${id}`,
    { data: { publishedAt: new Date().toISOString() } }
  );
  return response.data.data;
}

/**
 * Unpublish a text effect
 */
export async function unpublishTextEffect(id: number): Promise<TextEffect> {
  const response = await strapiApi.put<SingleTextEffectResponse>(
    `/api/text-effects/${id}`,
    { data: { publishedAt: null } }
  );
  return response.data.data;
}

/**
 * Upload preview image for a text effect
 */
async function uploadTextEffectImage(effectId: number, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'api::text-effect.text-effect');
  formData.append('refId', effectId.toString());
  formData.append('field', 'preview_image');

  await strapiApi.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
