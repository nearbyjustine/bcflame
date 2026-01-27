/**
 * Product lifecycle hooks
 */

export default {
  /**
   * After create - notify all resellers of new product
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      // Fetch all reseller users
      const resellers = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: {
          userType: 'reseller',
        },
      });

      // Create notification for each reseller
      for (const reseller of resellers) {
        await strapi.entityService.create('api::notification.notification', {
          data: {
            type: 'new_product',
            title: 'New Product Available',
            message: `${result.name} is now available for order`,
            isRead: false,
            recipient: reseller.id,
            relatedProduct: result.id,
            link: `/products/${result.id}`,
          },
        });
      }

      strapi.log.info(`Created new product notifications for ${resellers.length} resellers`);
    } catch (error) {
      strapi.log.error('Error creating product notifications:', error);
    }
  },
};
