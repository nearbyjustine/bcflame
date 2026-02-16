import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminTextEffects,
  getTextEffectById,
  createTextEffect,
  updateTextEffect,
  deleteTextEffect,
  publishTextEffect,
  unpublishTextEffect,
} from './admin-styles';
import { strapiApi } from './strapi';

vi.mock('./strapi', () => ({
  strapiApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Text Effects API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminTextEffects', () => {
    it('should fetch visual effects with default params', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              attributes: {
                name: 'Glassmorphism',
                category: 'ui_enhancement',
                css_code: '.glass { backdrop-filter: blur(10px); }',
                sort_order: 0,
                is_default: false,
              },
            },
          ],
          meta: {
            pagination: {
              page: 1,
              pageSize: 25,
              pageCount: 1,
              total: 1,
            },
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue(mockResponse);

      const result = await getAdminTextEffects();

      expect(strapiApi.get).toHaveBeenCalledWith('/api/visual-effects', {
        params: {
          populate: 'preview_image',
          pagination: { page: 1, pageSize: 25 },
          publicationState: 'preview',
          sort: ['sort_order:asc', 'name:asc'],
        },
      });

      expect(result.effects).toEqual(mockResponse.data.data);
      expect(result.pagination).toEqual(mockResponse.data.meta.pagination);
    });

    it('should fetch visual effects with search filter', async () => {
      const mockResponse = {
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 25,
              pageCount: 0,
              total: 0,
            },
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue(mockResponse);

      await getAdminTextEffects({ search: 'glass' });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/visual-effects', {
        params: {
          populate: 'preview_image',
          pagination: { page: 1, pageSize: 25 },
          filters: {
            $or: [
              { name: { $containsi: 'glass' } },
              { description: { $containsi: 'glass' } },
            ],
          },
          publicationState: 'preview',
          sort: ['sort_order:asc', 'name:asc'],
        },
      });
    });

    it('should fetch visual effects with search', async () => {
      const mockResponse = {
        data: {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 25,
              pageCount: 0,
              total: 0,
            },
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue(mockResponse);

      await getAdminTextEffects({ search: 'glow' });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/visual-effects', {
        params: {
          populate: 'preview_image',
          pagination: { page: 1, pageSize: 25 },
          filters: {
            $or: [
              { name: { $containsi: 'glow' } },
              { description: { $containsi: 'glow' } },
            ],
          },
          publicationState: 'preview',
          sort: ['sort_order:asc', 'name:asc'],
        },
      });
    });
  });

  describe('getTextEffectById', () => {
    it('should fetch a single visual effect by ID', async () => {
      const mockEffect = {
        id: 1,
        attributes: {
          name: 'Glassmorphism',
          category: 'ui_enhancement' as const,
          css_code: '.glass { backdrop-filter: blur(10px); }',
          sort_order: 0,
          is_default: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      const mockResponse = {
        data: {
          data: mockEffect,
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue(mockResponse);

      const result = await getTextEffectById(1);

      expect(strapiApi.get).toHaveBeenCalledWith('/api/visual-effects/1', {
        params: { populate: 'preview_image' },
      });

      expect(result).toEqual(mockEffect);
    });
  });

  describe('createTextEffect', () => {
    it('should create a visual effect without preview image', async () => {
      const mockEffect = {
        id: 1,
        attributes: {
          name: 'Glassmorphism',
          category: 'ui_enhancement' as const,
          css_code: '.glass { backdrop-filter: blur(10px); }',
          sort_order: 0,
          is_default: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      const mockResponse = {
        data: {
          data: mockEffect,
        },
      };

      vi.mocked(strapiApi.post).mockResolvedValue(mockResponse);

      const data = {
        name: 'Glassmorphism',
        category: 'ui_enhancement',
        css_code: '.glass { backdrop-filter: blur(10px); }',
      };

      const result = await createTextEffect(data);

      expect(strapiApi.post).toHaveBeenCalledWith('/api/visual-effects', {
        data: { ...data, sort_order: 0 },
      });

      expect(result).toEqual(mockEffect);
    });

    it('should create a visual effect with preview image', async () => {
      const mockEffect = {
        id: 1,
        attributes: {
          name: 'Glassmorphism',
          category: 'ui_enhancement' as const,
          css_code: '.glass { backdrop-filter: blur(10px); }',
          sort_order: 0,
          is_default: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      const mockEffectWithImage = {
        ...mockEffect,
        attributes: {
          ...mockEffect.attributes,
          preview_image: {
            data: {
              id: 1,
              attributes: {
                url: '/uploads/preview.jpg',
                name: 'preview.jpg',
                width: 200,
                height: 200,
              },
            },
          },
        },
      };

      vi.mocked(strapiApi.post).mockResolvedValueOnce({
        data: { data: mockEffect },
      });
      vi.mocked(strapiApi.post).mockResolvedValueOnce({});
      vi.mocked(strapiApi.get).mockResolvedValueOnce({
        data: { data: mockEffectWithImage },
      });

      const data = {
        name: 'Glassmorphism',
        category: 'ui_enhancement',
        css_code: '.glass { backdrop-filter: blur(10px); }',
      };

      const file = new File([''], 'preview.jpg', { type: 'image/jpeg' });

      const result = await createTextEffect(data, file);

      expect(strapiApi.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockEffectWithImage);
    });
  });

  describe('updateTextEffect', () => {
    it('should update a visual effect without preview image', async () => {
      const mockEffect = {
        id: 1,
        attributes: {
          name: 'Updated Glassmorphism',
          category: 'ui_enhancement' as const,
          css_code: '.glass { backdrop-filter: blur(20px); }',
          sort_order: 0,
          is_default: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      };

      const mockResponse = {
        data: {
          data: mockEffect,
        },
      };

      vi.mocked(strapiApi.put).mockResolvedValue(mockResponse);

      const data = {
        css_code: '.glass { backdrop-filter: blur(20px); }',
      };

      const result = await updateTextEffect(1, data);

      expect(strapiApi.put).toHaveBeenCalledWith('/api/visual-effects/1', {
        data,
      });

      expect(result).toEqual(mockEffect);
    });
  });

  describe('deleteTextEffect', () => {
    it('should delete a visual effect', async () => {
      vi.mocked(strapiApi.delete).mockResolvedValue({});

      await deleteTextEffect(1);

      expect(strapiApi.delete).toHaveBeenCalledWith('/api/visual-effects/1');
    });
  });

  describe('publishTextEffect', () => {
    it('should publish a visual effect', async () => {
      const mockEffect = {
        id: 1,
        attributes: {
          name: 'Glassmorphism',
          category: 'ui_enhancement' as const,
          css_code: '.glass { backdrop-filter: blur(10px); }',
          sort_order: 0,
          is_default: false,
          publishedAt: '2024-01-02',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      };

      const mockResponse = {
        data: {
          data: mockEffect,
        },
      };

      vi.mocked(strapiApi.put).mockResolvedValue(mockResponse);

      const result = await publishTextEffect(1);

      expect(strapiApi.put).toHaveBeenCalledWith('/api/visual-effects/1', {
        data: { publishedAt: expect.any(String) },
      });

      expect(result).toEqual(mockEffect);
    });
  });

  describe('unpublishTextEffect', () => {
    it('should unpublish a visual effect', async () => {
      const mockEffect = {
        id: 1,
        attributes: {
          name: 'Glassmorphism',
          category: 'ui_enhancement' as const,
          css_code: '.glass { backdrop-filter: blur(10px); }',
          sort_order: 0,
          is_default: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      };

      const mockResponse = {
        data: {
          data: mockEffect,
        },
      };

      vi.mocked(strapiApi.put).mockResolvedValue(mockResponse);

      const result = await unpublishTextEffect(1);

      expect(strapiApi.put).toHaveBeenCalledWith('/api/visual-effects/1', {
        data: { publishedAt: null },
      });

      expect(result).toEqual(mockEffect);
    });
  });
});
