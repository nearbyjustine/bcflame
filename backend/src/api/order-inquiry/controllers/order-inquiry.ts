/**
 * order-inquiry controller
 */

import { factories } from '@strapi/strapi';
import { generateInquiryNumber } from '../services/inquiry-number';

export default factories.createCoreController('api::order-inquiry.order-inquiry', ({ strapi }) => ({
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

      const createdInquiries = [];
      const inquiryNumbers = [];

      // Create each inquiry
      for (const inquiryData of inquiries) {
        const inquiry = await strapi.entityService.create('api::order-inquiry.order-inquiry', {
          data: {
            ...inquiryData,
            customer: userId,
            inquiry_number: generateInquiryNumber(),
            status: 'pending',
          },
        });

        createdInquiries.push(inquiry);
        inquiryNumbers.push(inquiry.inquiry_number);
      }

      // Send batch email notification
      // TODO: Implement email service
      // await strapi.service('api::order-inquiry.order-inquiry').sendBatchEmail({
      //   inquiries: createdInquiries,
      //   customer: ctx.state.user,
      // });

      return {
        data: createdInquiries,
        meta: {
          inquiry_numbers: inquiryNumbers,
          total: createdInquiries.length,
        },
      };
    } catch (error) {
      strapi.log.error('Batch order inquiry creation failed:', error);
      return ctx.internalServerError('Failed to create order inquiries');
    }
  },
}));
