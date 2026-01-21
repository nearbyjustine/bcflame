/**
 * Media Access Service
 * Determines if a user has access to media assets based on payment status
 */

/**
 * Check if a user has any paid orders
 * Resellers must have at least one paid order to access media
 * Admins always have access
 */
export async function canAccessMedia(strapi: any, userId: number, userRole: string): Promise<boolean> {
  // Admin users always have access
  if (userRole === 'admin') {
    return true;
  }

  try {
    // Check if user has any orders with payment status 'paid'
    const paidOrders = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
      filters: {
        customer: {
          id: userId,
        },
        paymentStatus: 'paid',
      },
      limit: 1, // We only need to know if at least one exists
    });

    return Array.isArray(paidOrders) && paidOrders.length > 0;
  } catch (error) {
    strapi.log.error('Error checking media access:', error);
    return false;
  }
}

/**
 * Get media access status for a user
 * Returns detailed information about access status
 */
export async function getMediaAccessStatus(strapi: any, userId: number, userRole: string): Promise<{
  hasAccess: boolean;
  reason?: string;
  paidOrdersCount?: number;
}> {
  // Admin users always have access
  if (userRole === 'admin') {
    return {
      hasAccess: true,
      reason: 'admin',
    };
  }

  try {
    // Count paid orders
    const paidOrdersCount = await strapi.db.query('api::order-inquiry.order-inquiry').count({
      where: {
        customer: {
          id: userId,
        },
        paymentStatus: 'paid',
      },
    });

    const hasAccess = paidOrdersCount > 0;

    return {
      hasAccess,
      reason: hasAccess ? 'paid_orders' : 'no_paid_orders',
      paidOrdersCount,
    };
  } catch (error) {
    strapi.log.error('Error getting media access status:', error);
    return {
      hasAccess: false,
      reason: 'error',
    };
  }
}
