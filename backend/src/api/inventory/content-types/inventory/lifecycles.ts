/**
 * Inventory Lifecycle Hooks
 * Creates notifications for low stock alerts
 */

export default {
  async afterUpdate(event: any) {
    const { result } = event;
    const strapi = (global as any).strapi;

    // Check if stock is low
    const quantity = result.quantity || 0;
    const threshold = result.lowStockThreshold || result.low_stock_threshold || 10;

    if (quantity <= threshold && quantity > 0) {
      try {
        // Check if we already sent a low stock notification recently (within 24 hours)
        const recentNotification = await strapi.db.query('api::notification.notification').findOne({
          where: {
            type: 'low_stock',
            relatedProduct: result.product?.id || result.product,
            createdAt: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        });

        if (!recentNotification) {
          // Get product details
          const product = result.product?.name 
            ? result.product 
            : await strapi.entityService.findOne('api::product.product', result.product);

          await strapi.entityService.create('api::notification.notification', {
            data: {
              type: 'low_stock',
              title: `Low Stock Alert: ${product?.name || 'Unknown Product'}`,
              message: `Only ${quantity} units remaining (threshold: ${threshold})`,
              isRead: false,
              relatedProduct: result.product?.id || result.product,
              link: `/admin-portal/products?filter=low-stock`,
              metadata: {
                quantity,
                threshold,
              },
            },
          });

          console.log(`[Notification] Created low stock alert for product ${product?.name || result.product}`);
        }
      } catch (error) {
        console.error('[Notification] Failed to create low stock notification:', error);
      }
    }
  },
};
