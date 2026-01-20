/**
 * order-inquiry controller
 */

import { factories } from '@strapi/strapi';
import { generateInquiryNumber } from '../services/inquiry-number';

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
}));
