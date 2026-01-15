/**
 * invoice controller
 */

import { factories } from '@strapi/strapi';
import invoiceService from '../../../services/invoice-service';

export default factories.createCoreController('api::invoice.invoice' as any, ({ strapi }) => ({
  /**
   * Generate a new invoice for an order
   */
  async generate(ctx) {
    const { orderId, lineItems, dueDate, notes } = ctx.request.body;

    if (!orderId) {
      return ctx.badRequest('Order ID is required');
    }

    try {
      // Find the order
      const order: any = await strapi.entityService.findOne('api::order-inquiry.order-inquiry' as any, orderId, {
        populate: ['customer', 'product'],
      });

      if (!order) {
        return ctx.notFound('Order not found');
      }

      // Check if invoice already exists
      const existingInvoice = await strapi.db.query('api::invoice.invoice').findOne({
        where: { order: orderId },
      });

      if (existingInvoice) {
        return ctx.badRequest('Invoice already exists for this order');
      }

      // Generate invoice number
      const invoiceNumber = await invoiceService.generateInvoiceNumber(strapi);

      // Calculate totals
      const subtotal = lineItems?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
      const tax = 0; // Can be calculated based on rules
      const total = subtotal + tax;

      // Create invoice
      const invoice: any = await strapi.entityService.create('api::invoice.invoice' as any, {
        data: {
          invoiceNumber,
          order: orderId,
          subtotal,
          tax,
          total,
          dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          status: 'draft',
          lineItems: lineItems || [],
          notes,
          billingAddress: {
            company: order.customer?.company,
            name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
            email: order.customer?.email,
            phone: order.customer?.phone,
          },
        },
        populate: ['order'],
      });

      // Generate PDF
      const pdfUrl = await invoiceService.generatePdf(strapi, invoice);

      // Update invoice with PDF URL
      await strapi.entityService.update('api::invoice.invoice' as any, invoice.id, {
        data: { pdfUrl } as any,
      });

      return {
        data: {
          ...invoice,
          pdfUrl,
        },
      };
    } catch (error) {
      console.error('Invoice generation error:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Send invoice email to customer
   */
  async sendEmail(ctx) {
    const { id } = ctx.params;

    try {
      const invoice: any = await strapi.entityService.findOne('api::invoice.invoice' as any, id, {
        populate: {
          order: {
            populate: ['customer'],
          },
        },
      });

      if (!invoice) {
        return ctx.notFound('Invoice not found');
      }

      const customer = invoice.order?.customer;
      if (!customer?.email) {
        return ctx.badRequest('Customer email not found');
      }

      // Send email using existing email service
      await strapi.plugins['email'].services.email.send({
        to: customer.email,
        subject: `Invoice ${invoice.invoiceNumber} from BC Flame`,
        html: await invoiceService.generateEmailHtml(invoice),
      });

      // Update invoice status to sent
      await strapi.entityService.update('api::invoice.invoice' as any, id, {
        data: { status: 'sent' } as any,
      });

      return {
        data: {
          message: 'Invoice sent successfully',
          invoiceId: invoice.id,
        },
      };
    } catch (error) {
      console.error('Invoice email error:', error);
      ctx.throw(500, error);
    }
  },

  /**
   * Download invoice PDF
   */
  async downloadPdf(ctx) {
    const { id } = ctx.params;

    try {
      const invoice: any = await strapi.entityService.findOne('api::invoice.invoice' as any, id);

      if (!invoice) {
        return ctx.notFound('Invoice not found');
      }

      if (!invoice.pdfUrl) {
        // Generate PDF if it doesn't exist
        const pdfUrl = await invoiceService.generatePdf(strapi, invoice);
        await strapi.entityService.update('api::invoice.invoice' as any, id, {
          data: { pdfUrl } as any,
        });
        invoice.pdfUrl = pdfUrl;
      }

      return {
        data: {
          pdfUrl: invoice.pdfUrl,
          invoiceNumber: invoice.invoiceNumber,
        },
      };
    } catch (error) {
      console.error('Invoice PDF download error:', error);
      ctx.throw(500, error);
    }
  },
}));
