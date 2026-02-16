import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, getProductById, getRelatedProducts } from './products';
import { strapiApi } from './strapi';
import type { ProductsResponse, SingleProductResponse, ProductAttributes } from '@/types/product';

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
                  weight: '1g',
                  amount: 10.0,
                  currency: 'USD',
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
          populate: 'images,bud_images,pricing,features',
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
          populate: 'images,bud_images,pricing,features',
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
          populate: 'images,bud_images,pricing,features',
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
          populate: 'images,bud_images,pricing,features',
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

    it('should not filter when featured is false', async () => {
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

      await getProducts({ featured: false });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 25,
          },
        },
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(strapiApi.get).mockRejectedValue(error);

      await expect(getProducts()).rejects.toThrow('Network error');
    });

    it('should search products by name', async () => {
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

      await getProducts({ search: 'OG Kush' });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 25,
          },
          filters: {
            name: {
              $containsi: 'OG Kush',
            },
          },
        },
      });
    });

    it('should filter by price range', async () => {
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

      await getProducts({ minPrice: 10, maxPrice: 50 });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 25,
          },
          filters: {
            pricing: {
              amount: {
                $gte: 10,
                $lte: 50,
              },
            },
          },
        },
      });
    });

    it('should filter by THC content range', async () => {
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

      await getProducts({ minTHC: 15, maxTHC: 25 });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 25,
          },
          filters: {
            thc_content: {
              $gte: 15,
              $lte: 25,
            },
          },
        },
      });
    });

    it('should combine multiple filters', async () => {
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

      await getProducts({
        search: 'Kush',
        category: 'Indica',
        featured: true,
        onSale: true,
        minPrice: 10,
        maxPrice: 50,
      });

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 25,
          },
          filters: {
            name: {
              $containsi: 'Kush',
            },
            category: {
              $eq: 'Indica',
            },
            featured: {
              $eq: true,
            },
            on_sale: {
              $eq: true,
            },
            pricing: {
              amount: {
                $gte: 10,
                $lte: 50,
              },
            },
          },
        },
      });
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
                weight: '1g',
                amount: 10.0,
                currency: 'USD',
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
          populate: 'images,bud_images,pricing,features,selection_limits',
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

  describe('getRelatedProducts', () => {
    it('should fetch related products with same category', async () => {
      const mockResponse: ProductsResponse = {
        data: [
          {
            id: 2,
            attributes: {
              name: 'Related Product 1',
              sku: 'IND-002',
              category: 'Indica',
              description: 'Related product',
              on_sale: false,
              featured: false,
              sort_order: 0,
              pricing: [],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 3,
            attributes: {
              name: 'Related Product 2',
              sku: 'IND-003',
              category: 'Indica',
              description: 'Related product',
              on_sale: false,
              featured: false,
              sort_order: 0,
              pricing: [],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 5,
            pageCount: 1,
            total: 2,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getRelatedProducts(1, 'Indica', 4);

      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 5, // limit + 1 for filtering
          },
          filters: {
            category: {
              $eq: 'Indica',
            },
          },
        },
      });
      expect(result.data).toHaveLength(2);
    });

    it('should exclude current product from results', async () => {
      const mockResponse: ProductsResponse = {
        data: [
          {
            id: 1, // Current product
            attributes: {
              name: 'Current Product',
              sku: 'IND-001',
              category: 'Indica',
              description: 'Current product',
              on_sale: false,
              featured: false,
              sort_order: 0,
              pricing: [],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
          {
            id: 2,
            attributes: {
              name: 'Related Product',
              sku: 'IND-002',
              category: 'Indica',
              description: 'Related product',
              on_sale: false,
              featured: false,
              sort_order: 0,
              pricing: [],
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 5,
            pageCount: 1,
            total: 2,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getRelatedProducts(1, 'Indica', 4);

      // Should exclude product with id 1
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(2);
    });

    it('should respect limit parameter', async () => {
      const mockResponse: ProductsResponse = {
        data: [
          { id: 2, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 3, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 4, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 5, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 6, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 3,
            pageCount: 1,
            total: 5,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getRelatedProducts(1, 'Hybrid', 2);

      // Should return only 2 products (respecting limit)
      expect(result.data).toHaveLength(2);
    });

    it('should use default limit of 4 when not specified', async () => {
      const mockResponse: ProductsResponse = {
        data: [
          { id: 2, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 3, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 4, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 5, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
          { id: 6, attributes: {} as Partial<ProductAttributes> as ProductAttributes },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 5,
            pageCount: 1,
            total: 5,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getRelatedProducts(1, 'Indica');

      // Should call with default limit + 1
      expect(strapiApi.get).toHaveBeenCalledWith('/api/products', {
        params: {
          populate: 'images,bud_images,pricing,features',
          pagination: {
            page: 1,
            pageSize: 5, // default 4 + 1
          },
          filters: {
            category: {
              $eq: 'Indica',
            },
          },
        },
      });

      // Should return max 4 products
      expect(result.data).toHaveLength(4);
    });

    it('should handle empty results gracefully', async () => {
      const mockResponse: ProductsResponse = {
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 5,
            pageCount: 1,
            total: 0,
          },
        },
      };

      vi.mocked(strapiApi.get).mockResolvedValue({ data: mockResponse });

      const result = await getRelatedProducts(1, 'Indica', 4);

      expect(result.data).toHaveLength(0);
    });
  });
});
