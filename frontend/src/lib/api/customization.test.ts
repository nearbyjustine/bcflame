import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBudStyles,
  getBackgroundStyles,
  getFontStyles,
  getPreBaggingOptions,
  submitOrderInquiry,
  getMyOrderInquiries,
} from './customization';
import * as strapiModule from './strapi';

vi.mock('./strapi', () => ({
  strapiApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Customization API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBudStyles', () => {
    it('fetches bud styles with correct params', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Hand-Trimmed',
              category: 'trim_quality',
              sort_order: 0,
              createdAt: '2026-01-10T00:00:00.000Z',
              updatedAt: '2026-01-10T00:00:00.000Z',
            },
          },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      };

      vi.mocked(strapiModule.strapiApi.get).mockResolvedValueOnce({ data: mockData });

      const result = await getBudStyles();

      expect(strapiModule.strapiApi.get).toHaveBeenCalledWith('/api/bud-styles', {
        params: {
          sort: 'sort_order:asc',
          populate: '*',
        },
      });
      expect(result).toEqual(mockData.data);
    });
  });

  describe('getBackgroundStyles', () => {
    it('fetches background styles with correct params', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Pure White',
              type: 'solid_color',
              color_hex: '#FFFFFF',
              sort_order: 1,
              createdAt: '2026-01-10T00:00:00.000Z',
              updatedAt: '2026-01-10T00:00:00.000Z',
            },
          },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      };

      vi.mocked(strapiModule.strapiApi.get).mockResolvedValueOnce({ data: mockData });

      const result = await getBackgroundStyles();

      expect(strapiModule.strapiApi.get).toHaveBeenCalledWith('/api/background-styles', {
        params: {
          sort: 'sort_order:asc',
          populate: '*',
        },
      });
      expect(result).toEqual(mockData.data);
    });
  });

  describe('getFontStyles', () => {
    it('fetches font styles with correct params', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Modern Sans',
              font_family: 'Inter, sans-serif',
              category: 'sans_serif',
              sort_order: 1,
              createdAt: '2026-01-10T00:00:00.000Z',
              updatedAt: '2026-01-10T00:00:00.000Z',
            },
          },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      };

      vi.mocked(strapiModule.strapiApi.get).mockResolvedValueOnce({ data: mockData });

      const result = await getFontStyles();

      expect(strapiModule.strapiApi.get).toHaveBeenCalledWith('/api/font-styles', {
        params: {
          sort: 'sort_order:asc',
          populate: '*',
        },
      });
      expect(result).toEqual(mockData.data);
    });
  });

  describe('getPreBaggingOptions', () => {
    it('fetches pre-bagging options with correct params', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Premium Mylar Bags',
              packaging_type: 'mylar_bag',
              available_weights: ['3.5g', '7g', '14g', '28g'],
              sort_order: 1,
              createdAt: '2026-01-10T00:00:00.000Z',
              updatedAt: '2026-01-10T00:00:00.000Z',
            },
          },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      };

      vi.mocked(strapiModule.strapiApi.get).mockResolvedValueOnce({ data: mockData });

      const result = await getPreBaggingOptions();

      expect(strapiModule.strapiApi.get).toHaveBeenCalledWith('/api/prebagging-options', {
        params: {
          sort: 'sort_order:asc',
          populate: '*',
        },
      });
      expect(result).toEqual(mockData.data);
    });
  });

  describe('submitOrderInquiry', () => {
    it('submits inquiry with all selections', async () => {
      const mockResponse = {
        data: {
          id: 1,
          attributes: {
            inquiry_number: 'INQ-20260110-1234',
            status: 'pending',
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-01-10T00:00:00.000Z',
          },
        },
        meta: {},
      };

      vi.mocked(strapiModule.strapiApi.post).mockResolvedValueOnce({ data: mockResponse });

      const selections = {
        photos: [1, 2, 3],
        budStyles: [1, 2],
        backgrounds: [1],
        fonts: [1],
        preBagging: [
          {
            optionId: 1,
            quantity: 100,
            unitSize: 3.5,
            unitSizeUnit: 'g',
            customText: 'Custom label',
          },
        ],
      };

      const result = await submitOrderInquiry(1, selections, 'Test notes');

      expect(strapiModule.strapiApi.post).toHaveBeenCalledWith('/api/order-inquiries', {
        data: {
          product: 1,
          selected_photos: [1, 2, 3],
          selected_bud_styles: [1, 2],
          selected_backgrounds: [1],
          selected_fonts: [1],
          selected_prebagging: [
            {
              option_id: 1,
              quantity: 100,
              unit_size: 3.5,
              unit_size_unit: 'g',
              custom_text: 'Custom label',
            },
          ],
          total_weight: 350,
          weight_unit: 'g',
          notes: 'Test notes',
        },
      });
      expect(result.id).toBe(1);
      expect(result.attributes.inquiry_number).toBe('INQ-20260110-1234');
    });

    it('submits inquiry without notes', async () => {
      const mockResponse = {
        data: {
          id: 2,
          attributes: {
            inquiry_number: 'INQ-20260110-5678',
            status: 'pending',
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-01-10T00:00:00.000Z',
          },
        },
        meta: {},
      };

      vi.mocked(strapiModule.strapiApi.post).mockResolvedValueOnce({ data: mockResponse });

      const selections = {
        photos: [1],
        budStyles: [1],
        backgrounds: [1],
        fonts: [1],
        preBagging: [],
      };

      const result = await submitOrderInquiry(1, selections);

      expect(strapiModule.strapiApi.post).toHaveBeenCalledWith('/api/order-inquiries', {
        data: {
          product: 1,
          selected_photos: [1],
          selected_bud_styles: [1],
          selected_backgrounds: [1],
          selected_fonts: [1],
          selected_prebagging: [],
          total_weight: 0,
          weight_unit: 'P',
          notes: undefined,
        },
      });
      expect(result.id).toBe(2);
    });
  });

  describe('getMyOrderInquiries', () => {
    it('fetches user order inquiries with correct params', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            attributes: {
              inquiry_number: 'INQ-20260110-1234',
              status: 'pending',
              createdAt: '2026-01-10T00:00:00.000Z',
              updatedAt: '2026-01-10T00:00:00.000Z',
            },
          },
        ],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
      };

      vi.mocked(strapiModule.strapiApi.get).mockResolvedValueOnce({ data: mockData });

      const result = await getMyOrderInquiries();

      expect(strapiModule.strapiApi.get).toHaveBeenCalledWith('/api/order-inquiries', {
        params: {
          populate: ['product', 'product.images', 'customer'],
          sort: 'createdAt:desc',
        },
      });
      expect(result).toEqual(mockData.data);
    });
  });
});
