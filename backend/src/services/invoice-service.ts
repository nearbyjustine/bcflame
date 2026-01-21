/**
 * Invoice Service
 * Handles invoice number generation, PDF creation, and email templates
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface LineItem {
  description: string;
  quantity: number | string;  // Allow both number and formatted string (e.g., "1000 g (2.2 lb)")
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  status: string;
  lineItems: LineItem[];
  billingAddress: {
    company?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
  createdAt: string;
}

const invoiceService = {
  /**
   * Generate a unique invoice number in format INV-YYYYMMDD-XXXX
   * Uses advisory lock to prevent race conditions
   */
  async generateInvoiceNumber(strapi: any): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lockKey = parseInt(dateStr); // Use date as lock key (e.g., 20260120 becomes an integer)

    // Use PostgreSQL advisory lock to prevent race conditions
    const connection = strapi.db.connection;

    try {
      // Acquire advisory lock (blocks until lock is available)
      await connection.raw('SELECT pg_advisory_lock(?)', [lockKey]);

      // Find the last invoice number for today
      const lastInvoice = await strapi.db.query('api::invoice.invoice').findOne({
        where: {
          invoiceNumber: {
            $startsWith: `INV-${dateStr}`,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let sequence = 1;
      if (lastInvoice) {
        const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
        sequence = lastSeq + 1;
      }

      return `INV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    } finally {
      // Always release the advisory lock
      await connection.raw('SELECT pg_advisory_unlock(?)', [lockKey]);
    }
  },

  /**
   * Create an invoice with a generated invoice number atomically
   * This holds the advisory lock through the entire creation process to prevent race conditions
   */
  async createInvoiceWithNumber(strapi: any, invoiceData: any): Promise<any> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lockKey = parseInt(dateStr); // Use date as lock key (e.g., 20260120 becomes an integer)

    // Use PostgreSQL advisory lock to prevent race conditions
    const connection = strapi.db.connection;

    try {
      // Acquire advisory lock (blocks until lock is available)
      await connection.raw('SELECT pg_advisory_lock(?)', [lockKey]);

      // Find the last invoice number for today
      const lastInvoice = await strapi.db.query('api::invoice.invoice').findOne({
        where: {
          invoiceNumber: {
            $startsWith: `INV-${dateStr}`,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let sequence = 1;
      if (lastInvoice) {
        const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
        sequence = lastSeq + 1;
      }

      const invoiceNumber = `INV-${dateStr}-${sequence.toString().padStart(4, '0')}`;

      console.log('Generated invoice number:', invoiceNumber);

      // Create invoice with the generated number (still under lock)
      const invoice = await strapi.entityService.create('api::invoice.invoice' as any, {
        data: {
          invoiceNumber,
          ...invoiceData,
        },
        populate: ['order'],
      });

      return invoice;
    } finally {
      // Always release the advisory lock
      await connection.raw('SELECT pg_advisory_unlock(?)', [lockKey]);
    }
  },

  /**
   * Generate PDF for invoice
   */
  async generatePdf(strapi: any, invoice: Invoice): Promise<string> {
    const uploadDir = path.join(strapi.dirs.static.public, 'uploads', 'invoices');

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);

        let streamFinished = false;
        let docEnded = false;

        // Error handling and cleanup
        const cleanup = (error?: Error) => {
          if (error && !streamFinished) {
            try {
              writeStream.destroy();
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (cleanupError) {
              console.error('Error during cleanup:', cleanupError);
            }
            reject(error);
          }
        };

        // Error handlers
        writeStream.on('error', cleanup);
        doc.on('error', cleanup);

        // Proper completion handling with fsync
        writeStream.on('finish', () => {
          streamFinished = true;
          if (docEnded) {
            // Ensure file is fully written to disk using close callback
            writeStream.close((err) => {
              if (err) {
                cleanup(err);
              } else {
                // File is now fully written and closed
                resolve(`/uploads/invoices/${fileName}`);
              }
            });
          }
        });

        doc.pipe(writeStream);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('BC FLAME', 50, 50)
          .fontSize(10)
          .font('Helvetica')
          .text('Premium Cannabis Products', 50, 80);

        // Invoice title
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .text('INVOICE', 400, 50, { align: 'right' });

        // Invoice details
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 90, { align: 'right' })
          .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 105, { align: 'right' })
          .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 400, 120, { align: 'right' })
          .text(`Status: ${invoice.status.toUpperCase()}`, 400, 135, { align: 'right' });

        // Bill To section
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Bill To:', 50, 170)
          .fontSize(10)
          .font('Helvetica');

        let billToY = 190;
        if (invoice.billingAddress?.company) {
          doc.text(invoice.billingAddress.company, 50, billToY);
          billToY += 15;
        }
        if (invoice.billingAddress?.name) {
          doc.text(invoice.billingAddress.name, 50, billToY);
          billToY += 15;
        }
        if (invoice.billingAddress?.email) {
          doc.text(invoice.billingAddress.email, 50, billToY);
          billToY += 15;
        }
        if (invoice.billingAddress?.phone) {
          doc.text(invoice.billingAddress.phone, 50, billToY);
        }

        // Line items table
        const tableTop = 280;
        const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
        const columnWidths = [280, 60, 80, 80];
        let xPos = 50;

        // Table header
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#333333');

        doc
          .rect(50, tableTop - 5, 500, 25)
          .fill('#f0f0f0');

        doc.fillColor('#333333');
        tableHeaders.forEach((header, i) => {
          doc.text(header, xPos + 5, tableTop, { width: columnWidths[i] - 10 });
          xPos += columnWidths[i];
        });

        // Table rows
        doc.font('Helvetica');
        let yPos = tableTop + 30;
        const lineItems = invoice.lineItems || [];

        lineItems.forEach((item: LineItem) => {
          xPos = 50;
          doc.text(item.description || '', xPos + 5, yPos, { width: columnWidths[0] - 10 });
          xPos += columnWidths[0];
          // Handle both string (e.g., "1000 g (2.2 lb)") and number quantities
          doc.text(String(item.quantity || 0), xPos + 5, yPos, { width: columnWidths[1] - 10 });
          xPos += columnWidths[1];
          doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, xPos + 5, yPos, { width: columnWidths[2] - 10 });
          xPos += columnWidths[2];
          doc.text(`$${(item.total || 0).toFixed(2)}`, xPos + 5, yPos, { width: columnWidths[3] - 10 });
          yPos += 25;
        });

        // Totals
        const totalsY = yPos + 20;
        doc
          .font('Helvetica')
          .text('Subtotal:', 400, totalsY)
          .text(`$${invoice.subtotal.toFixed(2)}`, 480, totalsY, { align: 'right' })
          .text('Tax:', 400, totalsY + 20)
          .text(`$${invoice.tax.toFixed(2)}`, 480, totalsY + 20, { align: 'right' })
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('Total:', 400, totalsY + 45)
          .text(`$${invoice.total.toFixed(2)}`, 480, totalsY + 45, { align: 'right' });

        // Notes
        if (invoice.notes) {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Notes:', 50, totalsY + 80)
            .font('Helvetica')
            .text(invoice.notes, 50, totalsY + 95, { width: 300 });
        }

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#666666')
          .text(
            'Thank you for your business!',
            50,
            doc.page.height - 50,
            { align: 'center', width: 500 }
          );

        doc.end();
        docEnded = true;
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Generate HTML email template for invoice
   */
  async generateEmailHtml(invoice: Invoice): Promise<string> {
    const lineItemsHtml = (invoice.lineItems || [])
      .map(
        (item: LineItem) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.total.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h1 style="color: #333; margin: 0;">BC FLAME</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Premium Cannabis Products</p>
        </div>
        
        <div style="margin: 30px 0;">
          <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
          <p style="color: #666;">
            Date: ${new Date(invoice.createdAt).toLocaleDateString()}<br>
            Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Description</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Unit Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
              <td style="padding: 10px; text-align: right;">$${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax:</strong></td>
              <td style="padding: 10px; text-align: right;">$${invoice.tax.toFixed(2)}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td colspan="3" style="padding: 15px; text-align: right;"><strong style="font-size: 18px;">Total:</strong></td>
              <td style="padding: 15px; text-align: right;"><strong style="font-size: 18px;">$${invoice.total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        ${invoice.notes ? `<div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
          <p>Thank you for your business!</p>
          <p style="font-size: 12px;">BC Flame - Premium Cannabis Products</p>
        </div>
      </body>
      </html>
    `;
  },
};

export default invoiceService;
