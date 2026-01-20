import { strapiApi } from './strapi';

interface MediaAsset {
  id: number;
  title: string;
  description?: string;
  category: 'product_photos' | 'marketing_materials' | 'packaging_templates' | 'brand_guidelines';
  file: {
    url: string;
    mime: string;
    size: number;
    name: string;
  };
  thumbnail?: {
    url: string;
  };
  tags?: Array<{ id: number; name: string; slug: string }>;
  products?: Array<{ id: number; name: string }>;
  downloadCount: number;
  fileSize?: number;
  fileType?: string;
  createdAt: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface CampaignKit {
  id: number;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  assets?: MediaAsset[];
  isActive: boolean;
}

interface DownloadResponse {
  id: number;
  title: string;
  downloadCount: number;
  file: {
    url: string;
    name: string;
    mime: string;
    size: number;
  };
}

/**
 * Fetch all media assets with optional filters
 */
export async function getMediaAssets(filters?: {
  category?: string;
  tags?: string[];
}): Promise<MediaAsset[]> {
  try {
    let url = '/api/media-assets?populate=file,thumbnail,tags,products&sort=createdAt:desc';

    if (filters?.category && filters.category !== 'all') {
      url += `&filters[category][$eq]=${filters.category}`;
    }

    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag, index) => {
        url += `&filters[tags][slug][$in][${index}]=${tag}`;
      });
    }

    const response = await strapiApi.get(url);
    return response.data.data.map((item: any) => ({
      id: item.id,
      ...item.attributes,
      file: item.attributes.file?.data?.attributes,
      thumbnail: item.attributes.thumbnail?.data?.attributes,
      tags: item.attributes.tags?.data?.map((t: any) => ({
        id: t.id,
        ...t.attributes,
      })),
      products: item.attributes.products?.data?.map((p: any) => ({
        id: p.id,
        ...p.attributes,
      })),
    }));
  } catch (error) {
    console.error('Error fetching media assets:', error);
    throw error;
  }
}

/**
 * Fetch a single media asset by ID
 */
export async function getMediaAsset(id: number): Promise<MediaAsset> {
  try {
    const response = await strapiApi.get(
      `/api/media-assets/${id}?populate=file,thumbnail,tags,products`
    );
    const item = response.data.data;
    return {
      id: item.id,
      ...item.attributes,
      file: item.attributes.file?.data?.attributes,
      thumbnail: item.attributes.thumbnail?.data?.attributes,
      tags: item.attributes.tags?.data?.map((t: any) => ({
        id: t.id,
        ...t.attributes,
      })),
      products: item.attributes.products?.data?.map((p: any) => ({
        id: p.id,
        ...p.attributes,
      })),
    };
  } catch (error) {
    console.error('Error fetching media asset:', error);
    throw error;
  }
}

/**
 * Download an asset and increment download count
 */
export async function downloadAsset(id: number): Promise<DownloadResponse> {
  try {
    const response = await strapiApi.post(`/api/media-assets/${id}/download`);
    return response.data.data;
  } catch (error) {
    console.error('Error downloading asset:', error);
    throw error;
  }
}

/**
 * Fetch all tags
 */
export async function getTags(): Promise<Tag[]> {
  try {
    const response = await strapiApi.get('/api/tags?sort=name:asc');
    return response.data.data.map((item: any) => ({
      id: item.id,
      ...item.attributes,
    }));
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

/**
 * Fetch all active campaign kits
 */
export async function getCampaignKits(): Promise<CampaignKit[]> {
  try {
    const response = await strapiApi.get(
      '/api/campaign-kits?populate=coverImage,assets.file,assets.thumbnail&filters[isActive][$eq]=true&sort=createdAt:desc'
    );
    return response.data.data.map((item: any) => ({
      id: item.id,
      ...item.attributes,
      coverImage: item.attributes.coverImage?.data?.attributes,
      assets: item.attributes.assets?.data?.map((a: any) => ({
        id: a.id,
        ...a.attributes,
        file: a.attributes.file?.data?.attributes,
        thumbnail: a.attributes.thumbnail?.data?.attributes,
      })),
    }));
  } catch (error) {
    console.error('Error fetching campaign kits:', error);
    throw error;
  }
}

/**
 * Download campaign kit as zip with selected assets
 */
export async function downloadCampaignKit(
  kitId: number,
  assetIds: number[]
): Promise<Blob> {
  try {
    const response = await strapiApi.post(
      `/api/campaign-kits/${kitId}/download`,
      { assetIds },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error('Error downloading campaign kit:', error);
    throw error;
  }
}

/**
 * Check if current user has access to media assets
 */
export async function getMediaAccessStatus(): Promise<{
  hasAccess: boolean;
  reason?: string;
  paidOrdersCount?: number;
}> {
  try {
    const response = await strapiApi.get('/api/media-assets/access-status');
    return response.data.data;
  } catch (error) {
    console.error('Error checking media access:', error);
    throw error;
  }
}
