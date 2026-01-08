import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, getProductById } from './products';
import { strapiApi } from './strapi';
import type { ProductsResponse, SingleProductResponse } from '@/types/product';

// Mock the strapiApi
vi.mock('./strapi', () => ({
  strapiApi: {
    get: vi.fn(),
  },
}));

describe('Product API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch all products with default pagination', async () => {
      const mockResponse: ProductsResponse = {
        data: [
          {
            id: 1,
            attributes: {
              name: 'Test Product',
              sku: 'TEST-001',
              category: 'Indica',
              description: 'Test description',
              on_sale: false,
              featured: false,
              sort_order: 0,
              pricing: [
                {
                  id: 1,
                  quantity: '1g',
                  price: 10.0,
                  unit: 'gram',
                },
              ],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
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
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getProducts();

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: '*',
          pagination: {
            page: 1,
            pageSize: 25,
          },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should fetch products with custom pagination', async () => {
      const mockResponse: ProductsResponse = {
        data: [],
        meta: {
          pagination: {
            page: 2,
            pageSize: 10,
            pageCount: 1,
            total: 0,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      await getProducts({ page: 2, pageSize: 10 });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: '*',
          pagination: {
            page: 2,
            pageSize: 10,
          },
        },
      });
    });

    it('should fetch products filtered by category', async () => {
      const mockResponse: ProductsResponse = {
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: 0,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      await getProducts({ category: 'Indica' });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: '*',
          pagination: {
            page: 1,
            pageSize: 25,
          },
          filters: {
            category: {
              $eq: 'Indica',
            },
          },
        },
      });
    });

    it('should fetch only featured products', async () => {
      const mockResponse: ProductsResponse = {
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 25,
            pageCount: 1,
            total: 0,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      await getProducts({ featured: true });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: '*',
          pagination: {
            page: 1,
            pageSize: 25,
          },
          filters: {
            featured: {
              $eq: true,
            },
          },
        },
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(strapiApi.get).mockRejectedValue(error);

      await expect(getProducts()).rejects.toThrow('Network error');
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product by ID', async () => {
      const mockResponse: SingleProductResponse = {
        data: {
          id: 1,
          attributes: {
            name: 'Test Product',
            sku: 'TEST-001',
            category: 'Indica',
            description: 'Test description',
            on_sale: false,
            featured: false,
            sort_order: 0,
            pricing: [
              {
                id: 1,
                quantity: '1g',
                price: 10.0,
                unit: 'gram',
              },
            ],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
        meta: {},
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getProductById(1);

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products/1', {
        params: {
          populate: '*',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 errors', async () => {
      const error = new Error('Not found');
      vi.mocked(strapiApi.get).mockRejectedValue(error);

      await expect(getProductById(999)).rejects.toThrow('Not found');
    });
  });
});
