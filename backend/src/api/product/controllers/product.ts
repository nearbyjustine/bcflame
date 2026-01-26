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
}));
