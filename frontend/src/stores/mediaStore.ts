import { create } from 'zustand';
import { toast } from 'sonner';
import {
  getMediaAssets,
  getMediaAsset,
  downloadAsset as downloadAssetApi,
  getTags,
  getCampaignKits,
  downloadCampaignKit as downloadCampaignKitApi,
} from '@/lib/api/media';

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

type Category = 'all' | 'product_photos' | 'marketing_materials' | 'packaging_templates' | 'brand_guidelines';
type SortBy = 'newest' | 'downloads' | 'alphabetical';

interface MediaFilters {
  selectedCategory: Category;
  searchQuery: string;
  selectedTags: string[];
  sortBy: SortBy;
}

interface MediaState {
  assets: MediaAsset[];
  tags: Tag[];
  campaignKits: CampaignKit[];
  selectedCategory: Category;
  searchQuery: string;
  selectedTags: string[];
  sortBy: SortBy;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssets: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchCampaignKits: () => Promise<void>;
  downloadAsset: (id: number) => Promise<void>;
  downloadCampaignKit: (kitId: number, assetIds: number[]) => Promise<void>;
  setFilters: (filters: Partial<MediaFilters>) => void;
  clearFilters: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  assets: [],
  tags: [],
  campaignKits: [],
  selectedCategory: 'all',
  searchQuery: '',
  selectedTags: [],
  sortBy: 'newest',
  isLoading: false,
  error: null,

  fetchAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const assets = await getMediaAssets();
      set({ assets, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      set({ error: 'Failed to load media assets', isLoading: false });
      toast.error('Failed to load media assets');
    }
  },

  fetchTags: async () => {
    try {
      const tags = await getTags();
      set({ tags });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  fetchCampaignKits: async () => {
    try {
      const campaignKits = await getCampaignKits();
      set({ campaignKits });
    } catch (error) {
      console.error('Failed to fetch campaign kits:', error);
    }
  },

  downloadAsset: async (id: number) => {
    try {
      const result = await downloadAssetApi(id);
      
      // Open file in new tab or trigger download
      if (result.file?.url) {
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
        const fileUrl = result.file.url.startsWith('http') 
          ? result.file.url 
          : `${strapiUrl}${result.file.url}`;
        
        // Create a temporary link and click it to download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = result.file.name || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started');
        
        // Update local download count
        const { assets } = get();
        set({
          assets: assets.map((a) =>
            a.id === id
              ? { ...a, downloadCount: result.downloadCount || (a.downloadCount + 1) }
              : a
          ),
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download asset');
    }
  },

  downloadCampaignKit: async (kitId: number, assetIds: number[]) => {
    try {
      toast.info('Preparing your download...');
      const blob = await downloadCampaignKitApi(kitId, assetIds);
      
      // Get kit name for filename
      const kit = get().campaignKits.find((k) => k.id === kitId);
      const filename = kit?.name 
        ? `${kit.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_campaign_kit.zip`
        : `campaign_kit_${kitId}.zip`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download complete!');
    } catch (error) {
      console.error('Campaign kit download failed:', error);
      toast.error('Failed to download campaign kit');
    }
  },

  setFilters: (filters: Partial<MediaFilters>) => {
    set((state) => ({
      ...state,
      ...filters,
    }));
  },

  clearFilters: () => {
    set({
      selectedCategory: 'all',
      searchQuery: '',
      selectedTags: [],
      sortBy: 'newest',
    });
  },
}));
