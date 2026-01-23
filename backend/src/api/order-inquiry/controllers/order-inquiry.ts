/**
 * order-inquiry controller
 */

import { factories } from '@strapi/strapi';
import { generateInquiryNumber } from '../services/inquiry-number';
import { generateCSV, generateXLSX } from '../services/export';

export default factories.createCoreController('api::order-inquiry.order-inquiry', ({ strapi }) => ({
  /**
   * Create a single order inquiry
   * POST /api/order-inquiries
   */
  async create(ctx) {
    strapi.log.info('═══════════════════════════════════════════════════════');
    strapi.log.info('📦 ORDER INQUIRY CONTROLLER - CREATE');
    strapi.log.info('═══════════════════════════════════════════════════════');
    strapi.log.info(`User ID from ctx.state.user: ${ctx.state.user?.id || 'NOT SET'}`);
    strapi.log.info(`User email: ${ctx.state.user?.email || 'N/A'}`);

    // Get authenticated user
    const userId = ctx.state.user?.id;
    if (!userId) {
      strapi.log.warn('📦 No authenticated user - returning 401');
      return ctx.unauthorized('You must be authenticated to submit orders');
    }

    // Add customer to the request data
    if (!ctx.request.body.data) {
      ctx.request.body.data = {};
    }

    ctx.request.body.data.customer = userId;
    strapi.log.info(`📦 Customer ID set in request body: ${userId}`);

    // Call the default create controller
    const response = await super.create(ctx);
    strapi.log.info('📦 Order inquiry created successfully');
    return response;
  },

  /**
   * Batch create multiple order inquiries
   * POST /api/order-inquiries/batch
   */
  async batch(ctx) {
    try {
      const { inquiries } = ctx.request.body;

      if (!Array.isArray(inquiries) || inquiries.length === 0) {
        return ctx.badRequest('inquiries must be a non-empty array');
      }

      // Get authenticated user
      const userId = ctx.state.user?.id;
      if (!userId) {
        return ctx.unauthorized('You must be authenticated to submit orders');
      }

      // Generate inquiry numbers upfront to detect collisions early
      const inquiryNumbers = inquiries.map(() => generateInquiryNumber());

      // Check for duplicates (very rare but possible with random generation)
      const uniqueNumbers = new Set(inquiryNumbers);
      if (uniqueNumbers.size !== inquiryNumbers.length) {
        // Regenerate if collision detected
        for (let i = 0; i < inquiryNumbers.length; i++) {
          while (uniqueNumbers.has(inquiryNumbers[i])) {
            inquiryNumbers[i] = generateInquiryNumber();
          }
          uniqueNumbers.add(inquiryNumbers[i]);
        }
      }

      // Use database transaction for atomic batch creation
      // All inquiries are created or none are (rollback on error)
      const createdInquiries = await strapi.db.transaction(async () => {
        const results = [];

        for (let i = 0; i < inquiries.length; i++) {
          const inquiry = await strapi.entityService.create('api::order-inquiry.order-inquiry', {
            data: {
              ...inquiries[i],
              customer: userId,
              inquiry_number: inquiryNumbers[i],
              status: 'pending',
            },
          });

          results.push(inquiry);
        }

        return results;
      });

      // Send batch email notification
      // TODO: Implement email service
      // await strapi.service('api::order-inquiry.order-inquiry').sendBatchEmail({
      //   inquiries: createdInquiries,
      //   customer: ctx.state.user,
      // });

      return {
        data: createdInquiries,
        meta: {
          inquiry_numbers: createdInquiries.map(i => i.inquiry_number),
          total: createdInquiries.length,
        },
      };
    } catch (error) {
      strapi.log.error('Batch order inquiry creation failed:', error);
      return ctx.internalServerError('Failed to create order inquiries');
    }
  },

  /**
   * Get order statistics for filter counts
   * GET /api/order-inquiries/statistics
   */
  async statistics(ctx) {
    try {
      // Total orders
      const total = await strapi.db.query('api::order-inquiry.order-inquiry').count();

      // Orders by status
      const pending = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { status: 'pending' },
      });

      const reviewing = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { status: 'reviewing' },
      });

      const approved = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { status: 'approved' },
      });

      const fulfilled = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { status: 'fulfilled' },
      });

      const rejected = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { status: 'rejected' },
      });

      // Orders by payment status
      const unpaid = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { payment_status: 'unpaid' },
      });

      const partial = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { payment_status: 'partial' },
      });

      const paid = await strapi.db.query('api::order-inquiry.order-inquiry').count({
        where: { payment_status: 'paid' },
      });

      return {
        data: {
          total,
          byStatus: {
            pending,
            reviewing,
            approved,
            fulfilled,
            rejected,
          },
          byPaymentStatus: {
            unpaid,
            partial,
            paid,
          },
        },
      };
    } catch (error) {
      console.error('Order statistics error:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Bulk update order status
   * POST /api/order-inquiries/bulk-update-status
   */
  async bulkUpdateStatus(ctx) {
    const user = ctx.state.user;

    // Verify admin role
    if (user?.userType !== 'admin') {
      return ctx.forbidden('Only admins can bulk update orders');
    }

    const { orderIds, status } = ctx.request.body;

    // Validation
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return ctx.badRequest('orderIds must be a non-empty array');
    }

    if (orderIds.length > 100) {
      return ctx.badRequest('Cannot update more than 100 orders at once');
    }

    const validStatuses = ['pending', 'reviewing', 'approved', 'fulfilled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return ctx.badRequest('Invalid status. Must be one of: ' + validStatuses.join(', '));
    }

    try {
      const updates = [];
      const errors = [];

      // Update each order (triggers lifecycle hooks for emails/notifications)
      for (const id of orderIds) {
        try {
          const updated = await strapi.entityService.update(
            'api::order-inquiry.order-inquiry',
            id,
            {
              data: { status },
            }
          );

          updates.push({
            id,
            success: true,
            inquiry_number: updated.inquiry_number || `#${id}`,
          });

          strapi.log.info(`✅ Bulk update: Order ${id} updated to ${status}`);
        } catch (error) {
          const errorMessage = error.message || 'Unknown error';
          errors.push({ id, error: errorMessage });
          strapi.log.error(`❌ Bulk update: Failed to update order ${id}:`, errorMessage);
        }
      }

      strapi.log.info(`Bulk update completed: ${updates.length} success, ${errors.length} failed`);

      return {
        success: true,
        updated: updates.length,
        failed: errors.length,
        details: {
          updates,
          errors,
        },
      };
    } catch (error) {
      strapi.log.error('Bulk update error:', error);
      return ctx.internalServerError('Bulk update failed');
    }
  },

  /**
   * Export orders to CSV or Excel
   * GET /api/order-inquiries/export?format=csv&orderIds=1,2,3
   */
  async export(ctx) {
    const user = ctx.state.user;

    // Verify admin role
    if (user?.userType !== 'admin') {
      return ctx.forbidden('Only admins can export orders');
    }

    const { format = 'csv', orderIds } = ctx.query;

    try {
      // Build query
      const where: any = {};
      if (orderIds) {
        const ids = String(orderIds).split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          where.id = { $in: ids };
        }
      }

      // Fetch orders with all relations
      const orders = await strapi.db.query('api::order-inquiry.order-inquiry').findMany({
        where,
        populate: {
          customer: true,
          product: {
            populate: ['pricing'],
          },
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Format data for export with ALL fields
      const exportData = orders.map(order => ({
        'Inquiry Number': order.inquiry_number || `#${order.id}`,
        'Customer Name': order.customer
          ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.username || 'N/A'
          : 'N/A',
        'Customer Email': order.customer?.email || 'N/A',
        'Company': order.customer?.company || 'N/A',
        'Phone': order.customer?.phone || 'N/A',
        'Product': order.product?.name || 'N/A',
        'Weight': `${order.total_weight || 0}${order.weight_unit || ''}`,
        'Status': order.status || 'pending',
        'Payment Status': order.paymentStatus || 'unpaid',
        'Order Date': order.createdAt ? new Date(order.createdAt).toISOString() : 'N/A',
        'Updated Date': order.updatedAt ? new Date(order.updatedAt).toISOString() : 'N/A',
        'Notes': order.notes || '',
        'Internal Notes': order.internal_notes || '',
        'Tracking Number': order.tracking_number || '',
        'Total Price': order.total_price || '',
        'Customizations': order.customizations ? JSON.stringify(order.customizations) : '',
      }));

      strapi.log.info(`Exporting ${exportData.length} orders as ${format}`);

      if (format === 'csv') {
        const csv = generateCSV(exportData);
        ctx.set('Content-Type', 'text/csv; charset=utf-8');
        ctx.set('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
        return csv;
      } else if (format === 'xlsx') {
        const xlsx = generateXLSX(exportData);
        ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        ctx.set('Content-Disposition', `attachment; filename="orders-${Date.now()}.xlsx"`);
        return xlsx;
      } else {
        return ctx.badRequest('Invalid format. Must be csv or xlsx');
      }
    } catch (error) {
      strapi.log.error('Export error:', error);
      return ctx.internalServerError('Export failed');
    }
  },
}));
