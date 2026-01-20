/**
 * Dashboard controller
 * Provides statistics for admin and reseller dashboards
 */

import type { Core } from '@strapi/strapi';

export default {
  /**
   * Get admin dashboard statistics
   * GET /api/dashboard/admin
   */
  async getAdminStats(ctx) {
    const strapi = ctx.state.strapi as Core.Strapi;
    const user = ctx.state.user;

    // Verify user is admin
    if (!user || user.userType !== 'admin') {
      return ctx.forbidden('Admin access required');
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      // Get total products count
      const totalProducts = await strapi.db.query('api::product.product').count({
        where: {
          publishedAt: { $notNull: true },
        },
      });

      // Get low stock items count (assuming inventory threshold of 10)
      const lowStockItems = await strapi.db.query('api::product.product').count({
        where: {
          publishedAt: { $notNull: true },
          inventory: { $lt: 10 },
        },
      });

      // Get active resellers count (not blocked)
      const activeResellers = await strapi.db.query('plugin::users-permissions.user').count({
        where: {
          userType: 'reseller',
          blocked: false,
        },
      });

      // Get today's orders
      const todayOrders = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
        filters: {
          createdAt: { $gte: today.toISOString() },
        },
        populate: ['invoice'],
      });

      // Calculate today's revenue from invoices
      let todayRevenue = 0;
      for (const order of todayOrders as any[]) {
        if (order.invoice?.total) {
          todayRevenue += parseFloat(order.invoice.total);
        }
      }

      // Get pending orders count
      const pendingOrders = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: {
          status: 'pending',
        },
      });

      // Get weekly orders for revenue calculation
      const weeklyOrders = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
        filters: {
          createdAt: { $gte: weekAgo.toISOString() },
        },
        populate: ['invoice'],
      });

      // Calculate weekly revenue
      let weeklyRevenue = 0;
      for (const order of weeklyOrders as any[]) {
        if (order.invoice?.total) {
          weeklyRevenue += parseFloat(order.invoice.total);
        }
      }

      // Get recent orders (last 5)
      const recentOrders = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
        sort: { createdAt: 'DESC' },
        limit: 5,
        populate: {
          customer: {
            fields: ['id', 'email', 'firstName', 'lastName', 'company'],
          },
          product: {
            fields: ['id', 'name'],
          },
        },
      });

      return {
        data: {
          todayOrders: todayOrders.length,
          todayRevenue,
          pendingOrders,
          lowStockItems,
          totalProducts,
          activeResellers,
          weeklyRevenue,
          recentOrders: (recentOrders as any[]).map((order) => ({
            id: order.id,
            inquiry_number: order.inquiry_number,
            status: order.status,
            createdAt: order.createdAt,
            customer: {
              id: order.customer?.id,
              email: order.customer?.email,
              name: [order.customer?.firstName, order.customer?.lastName]
                .filter(Boolean)
                .join(' ') || order.customer?.email,
              company: order.customer?.company,
            },
            product: {
              id: order.product?.id,
              name: order.product?.name,
            },
          })),
        },
      };
    } catch (error) {
      strapi.log.error('Dashboard admin stats error:', error);
      ctx.throw(500, 'Failed to fetch dashboard statistics');
    }
  },

  /**
   * Get reseller dashboard statistics
   * GET /api/dashboard/reseller
   */
  async getResellerStats(ctx) {
    const strapi = ctx.state.strapi as Core.Strapi;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    try {
      // Get total orders for this user
      const totalOrders = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: {
          customer: { id: user.id },
        },
      });

      // Get pending orders count
      const pendingOrders = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: {
          customer: { id: user.id },
          status: { $in: ['pending', 'reviewing'] },
        },
      });

      // Get available products count
      const availableProducts = await strapi.db.query('api::product.product').count({
        where: {
          publishedAt: { $notNull: true },
        },
      });

      // Get recent orders (last 5)
      const recentOrders = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
        filters: {
          customer: { id: user.id },
        },
        sort: { createdAt: 'DESC' },
        limit: 5,
        populate: {
          product: {
            fields: ['id', 'name'],
          },
        },
      });

      // Calculate total spent from invoices
      const ordersWithInvoices = await strapi.entityService.findMany('api::order-inquiry.order-inquiry' as any, {
        filters: {
          customer: { id: user.id },
          invoice: { $notNull: true },
        },
        populate: ['invoice'],
      });

      let totalSpent = 0;
      for (const order of ordersWithInvoices as any[]) {
        if (order.invoice?.total) {
          totalSpent += parseFloat(order.invoice.total);
        }
      }

      return {
        data: {
          totalOrders,
          pendingOrders,
          availableProducts,
          totalSpent,
          recentActivity: (recentOrders as any[]).map((order) => ({
            id: order.id,
            inquiry_number: order.inquiry_number,
            status: order.status,
            createdAt: order.createdAt,
            product: {
              id: order.product?.id,
              name: order.product?.name,
            },
          })),
        },
      };
    } catch (error) {
      strapi.log.error('Dashboard reseller stats error:', error);
      ctx.throw(500, 'Failed to fetch dashboard statistics');
    }
  },
};
