/**
 * product controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  /**
   * Get product statistics for filter counts
   * GET /api/products/statistics
   */
  async statistics(ctx) {
    try {
      // Total products
      const total = await strapi.db.query('api::product.product').count();

      // Published products
      const published = await strapi.db.query('api::product.product').count({
        where: { publishedAt: { $notNull: true } },
      });

      // Draft products
      const drafts = total - published;

      // Products on sale
      const onSale = await strapi.db.query('api::product.product').count({
        where: { on_sale: true },
      });

      // Featured products
      const featured = await strapi.db.query('api::product.product').count({
        where: { featured: true },
      });

      // Products by category
      const indica = await strapi.db.query('api::product.product').count({
        where: { category: 'Indica' },
      });

      const hybrid = await strapi.db.query('api::product.product').count({
        where: { category: 'Hybrid' },
      });

      return {
        data: {
          total,
          published,
          drafts,
          onSale,
          featured,
          byCategory: {
            indica,
            hybrid,
          },
        },
      };
    } catch (error) {
      strapi.log.error('Product statistics error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to fetch product statistics');
    }
  },

  /**
   * Get product photos for media hub
   * GET /api/products/photos
   * Returns all product images for admin, or only purchased products for resellers
   */
  async photos(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const userRole = user.userType || 'reseller';

    try {
      let productIds: number[] = [];

      // For resellers, get only products from approved and paid orders
      if (userRole !== 'admin') {
        const paidOrders = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
          filters: {
            customer: { id: user.id },
            status: 'approved',
            paymentStatus: 'paid',
          },
          populate: ['product'],
        });

        // Extract unique product IDs from orders
        const productIdSet = new Set<number>();
        (paidOrders as any[]).forEach((order: any) => {
          if (order.product?.id) {
            productIdSet.add(order.product.id);
          }
        });

        productIds = Array.from(productIdSet);

        // If no products found, return empty array
        if (productIds.length === 0) {
          return {
            data: [],
            meta: { total: 0 },
          };
        }
      }

      // Build query filters
      const filters: any = {
        publishedAt: { $notNull: true },
        images: { id: { $notNull: true } },
      };

      // For resellers, filter to only purchased products
      if (userRole !== 'admin' && productIds.length > 0) {
        filters.id = { $in: productIds };
      }

      // Fetch products with images
      const products = await strapi.entityService.findMany('api::product.product' as any, {
        filters,
        populate: ['images'],
      });

      // Transform products into photo format for media hub
      const photos: any[] = [];
      (products as any[]).forEach((product: any) => {
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((image: any, index: number) => {
            photos.push({
              id: `product-${product.id}-image-${image.id}`,
              productId: product.id,
              productName: product.name,
              title: `${product.name} - Photo ${index + 1}`,
              description: product.description,
              category: 'product_photos',
              file: {
                id: image.id,
                url: image.url,
                name: image.name,
                mime: image.mime,
                size: image.size,
                width: image.width,
                height: image.height,
              },
              thumbnail: image.formats?.thumbnail ? {
                url: image.formats.thumbnail.url,
              } : {
                url: image.url,
              },
              createdAt: image.createdAt || product.createdAt,
            });
          });
        }
      });

      return {
        data: photos,
        meta: {
          total: photos.length,
          productCount: (products as any[]).length,
        },
      };
    } catch (error) {
      strapi.log.error('Product photos error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to fetch product photos');
    }
  },
}));
