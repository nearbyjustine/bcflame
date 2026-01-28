/**
 * invoice controller
 */

import { factories } from '@strapi/strapi';
import invoiceService from '../../../services/invoice-service';
import { WEIGHT_UNIT } from '../../../constants/units';

export default factories.createCoreController('api::invoice.invoice' as any, ({ strapi }) => ({
  /**
   * Generate a new invoice for an order
   */
  async generate(ctx) {
    // Extract data from request body - handle both direct body and data wrapper
    const bodyData = ctx.request.body?.data || ctx.request.body;
    const { orderId, lineItems, dueDate, notes } = bodyData;

    // Log for debugging
    console.log('Invoice generate - Request body:', ctx.request.body);
    console.log('Invoice generate - Extracted orderId:', orderId);

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

      // Validate required data before calculating line items
      if (!order.product) {
        return ctx.badRequest('Cannot generate invoice: Order has no product assigned. Please assign a product to the order first.');
      }

      if (!order.total_weight || order.total_weight <= 0) {
        return ctx.badRequest('Cannot generate invoice: Order has no weight specified. Please enter the total weight for the order.');
      }

      if (!order.product.base_price_per_pound || order.product.base_price_per_pound <= 0) {
        return ctx.badRequest(`Cannot generate invoice: Product "${order.product.name}" has no price configured. Please set the base price per pound.`);
      }

      if (!order.customer) {
        return ctx.badRequest('Cannot generate invoice: Order has no customer assigned. Please assign a customer to the order.');
      }

      // Check if invoice already exists
      const existingInvoice = await strapi.db.query('api::invoice.invoice').findOne({
        where: { order: orderId },
      });

      if (existingInvoice) {
        return ctx.badRequest('Invoice already exists for this order. Use the regenerate endpoint to create a new version.');
      }

      // Helper function to format weight display
      const formatWeightDisplay = (weight: number, unit: string, weightInPounds: number): string => {
        return `${weight} ${unit} (${weightInPounds.toFixed(2)} ${WEIGHT_UNIT})`;
      };

      // Calculate line items from order data
      const calculatedLineItems: any[] = [];

      // Main product line item
      if (order.product && order.total_weight) {
        // Convert weight to pounds for price calculation
        let weightInPounds = order.total_weight;
        if (order.weight_unit === 'g') {
          weightInPounds = order.total_weight / 453.592;
        } else if (order.weight_unit === 'oz') {
          weightInPounds = order.total_weight / 16;
        }
        // If already in pounds, no conversion needed

        const unitPrice = order.product.base_price_per_pound || 0;
        const lineTotal = weightInPounds * unitPrice;

        calculatedLineItems.push({
          description: `${order.product.name} - ${order.product.category}`,
          quantity: formatWeightDisplay(order.total_weight, order.weight_unit, weightInPounds),
          unitPrice: unitPrice,
          total: lineTotal,
        });
      }

      // Add customization line items (with $0.00 - included in base price)
      const customizations: string[] = [];
      if (order.selected_photos && Array.isArray(order.selected_photos) && order.selected_photos.length > 0) {
        customizations.push(`Photos: ${order.selected_photos.length} selected`);
      }
      if (order.selected_bud_styles && Array.isArray(order.selected_bud_styles) && order.selected_bud_styles.length > 0) {
        customizations.push(`Bud Styles: ${order.selected_bud_styles.length} selected`);
      }
      if (order.selected_backgrounds && Array.isArray(order.selected_backgrounds) && order.selected_backgrounds.length > 0) {
        customizations.push(`Backgrounds: ${order.selected_backgrounds.length} selected`);
      }
      if (order.selected_fonts && Array.isArray(order.selected_fonts) && order.selected_fonts.length > 0) {
        customizations.push(`Fonts: ${order.selected_fonts.length} selected`);
      }
      if (order.selected_prebagging) {
        customizations.push('Pre-bagging options selected');
      }

      if (customizations.length > 0) {
        calculatedLineItems.push({
          description: `Smart Packaging Customizations\n${customizations.join(', ')}`,
          quantity: '1',
          unitPrice: 0,
          total: 0,
        });
      }

      // Use provided line items OR calculated ones
      const finalLineItems = lineItems && lineItems.length > 0 ? lineItems : calculatedLineItems;

      // Validate line items were calculated successfully
      if (!finalLineItems || finalLineItems.length === 0) {
        return ctx.badRequest('Cannot generate invoice: Failed to calculate line items. This should not happen - please contact support.');
      }

      // Calculate totals
      const subtotal = finalLineItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      const tax = 0; // Can be calculated based on rules
      const total = subtotal + tax;

      // Log invoice generation details
      console.log('Invoice generation started:', {
        orderId,
        productName: order.product?.name,
        totalWeight: order.total_weight,
        weightUnit: order.weight_unit,
        basePrice: order.product?.base_price_per_pound,
        calculatedLineItems: finalLineItems.length,
        subtotal,
        total,
      });

      // Generate invoice number and create invoice atomically
      const invoice: any = await invoiceService.createInvoiceWithNumber(strapi, {
        order: orderId,
        subtotal,
        tax,
        total,
        dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: 'draft',
        lineItems: finalLineItems,
        notes,
        version: 1,
        billingAddress: {
          company: order.customer?.company,
          name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
          email: order.customer?.email,
          phone: order.customer?.phone,
        },
      });

      // Log invoice creation
      console.log('Invoice created in database:', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        total: invoice.total,
        lineItemsStored: invoice.lineItems?.length || 0,
      });

      // Generate PDF
      const pdfUrl = await invoiceService.generatePdf(strapi, invoice);

      // Log PDF generation
      console.log('PDF generation completed:', {
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl,
      });

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
      strapi.log.error('Invoice generation error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to generate invoice');
    }
  },

  /**
   * Regenerate an existing invoice (creates new version)
   */
  async regenerate(ctx) {
    // Extract data from request body - handle both direct body and data wrapper
    const bodyData = ctx.request.body?.data || ctx.request.body;
    const { invoiceId, reason, reasonNotes, lineItems, dueDate, notes } = bodyData;

    if (!invoiceId) {
      return ctx.badRequest('Invoice ID is required');
    }

    if (!reason) {
      return ctx.badRequest('Regeneration reason is required');
    }

    try {
      // Find the current invoice
      const currentInvoice: any = await strapi.entityService.findOne('api::invoice.invoice' as any, invoiceId, {
        populate: ['order', 'order.customer', 'order.product'],
      });

      if (!currentInvoice) {
        return ctx.notFound('Invoice not found');
      }

      // Mark current invoice as superseded
      await strapi.entityService.update('api::invoice.invoice' as any, invoiceId, {
        data: { status: 'superseded' } as any,
      });

      // Calculate totals (use new line items if provided, otherwise use current)
      const items = lineItems || currentInvoice.lineItems;
      const subtotal = items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
      const tax = 0;
      const total = subtotal + tax;

      // Generate new invoice number and create atomically
      const newInvoice: any = await invoiceService.createInvoiceWithNumber(strapi, {
        order: currentInvoice.order.id,
        subtotal,
        tax,
        total,
        dueDate: dueDate || currentInvoice.dueDate,
        status: 'draft',
        lineItems: items,
        notes: notes || currentInvoice.notes,
        version: (currentInvoice.version || 1) + 1,
        previousInvoice: invoiceId,
        regenerationReason: reason,
        regenerationNotes: reasonNotes,
        billingAddress: currentInvoice.billingAddress,
      });

      // Generate PDF for new invoice
      const pdfUrl = await invoiceService.generatePdf(strapi, newInvoice);

      // Update new invoice with PDF URL
      await strapi.entityService.update('api::invoice.invoice' as any, newInvoice.id, {
        data: { pdfUrl } as any,
      });

      // Update the order to point to the new invoice
      await strapi.entityService.update('api::order-inquiry.order-inquiry' as any, currentInvoice.order.id, {
        data: { invoice: newInvoice.id } as any,
      });

      return {
        data: {
          ...newInvoice,
          pdfUrl,
          message: `Invoice regenerated successfully. New version: ${newInvoice.version}`,
        },
      };
    } catch (error) {
      strapi.log.error('Invoice regeneration error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to regenerate invoice');
    }
  },

  /**
   * Get invoice history for an order
   */
  async getHistory(ctx) {
    const { orderId } = ctx.params;

    if (!orderId) {
      return ctx.badRequest('Order ID is required');
    }

    try {
      // Find all invoices for this order
      const invoices = await strapi.db.query('api::invoice.invoice').findMany({
        where: { order: orderId },
        orderBy: { version: 'DESC' },
        populate: ['previousInvoice'],
      });

      return {
        data: invoices,
      };
    } catch (error) {
      strapi.log.error('Invoice history error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to fetch invoice history');
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
      strapi.log.error('Invoice email error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to send invoice email');
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

      // Construct the full path to the PDF file
      const fs = require('fs');
      const path = require('path');
      const pdfPath = path.join(strapi.dirs.static.public, invoice.pdfUrl);

      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        strapi.log.error('PDF file not found on disk:', pdfPath);
        return ctx.notFound('PDF file not found. Please regenerate the invoice.');
      }

      // Read the file
      const fileBuffer = fs.readFileSync(pdfPath);

      // Set headers for PDF download
      ctx.set('Content-Type', 'application/pdf');
      ctx.set('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
      ctx.set('Content-Length', fileBuffer.length.toString());

      // Send the file buffer
      ctx.body = fileBuffer;
    } catch (error) {
      strapi.log.error('Invoice PDF download error:', { error: error.message, stack: error.stack });
      return ctx.internalServerError('Failed to download invoice PDF');
    }
  },
}));
