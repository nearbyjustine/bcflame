export interface OrderItem {
  productName: string
  size: string
  quantity: number
  unitPrice: number
}

export interface OrderEmailData {
  inquiryNumber: string
  customerName: string
  customerEmail: string
  customerCompany: string
  customerPhone?: string
  customerBusinessLicense?: string
  items: OrderItem[]
  totalItems: number
  estimatedTotal: number
  specialInstructions?: string
  createdAt: string
}

export interface OrderStatusUpdateData extends OrderEmailData {
  status: string
  statusMessage: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Generate email for admin when new order is created
 */
export function generateNewOrderEmailForAdmin(data: OrderEmailData): EmailTemplate {
  const subject = `New Order Inquiry: ${data.inquiryNumber}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #dc2626;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 0 0 5px 5px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 10px;
          color: #dc2626;
        }
        .info-row {
          padding: 5px 0;
        }
        .info-label {
          font-weight: bold;
          display: inline-block;
          width: 150px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th {
          background-color: #dc2626;
          color: white;
          padding: 10px;
          text-align: left;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .total-row {
          font-weight: bold;
          background-color: #f0f0f0;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Inquiry</h1>
        </div>
        <div class="content">
          <div class="section">
            <div class="section-title">Order Information</div>
            <div class="info-row">
              <span class="info-label">Inquiry Number:</span>
              <span>${data.inquiryNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${new Date(data.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span>${data.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></span>
            </div>
            <div class="info-row">
              <span class="info-label">Company:</span>
              <span>${data.customerCompany}</span>
            </div>
            ${data.customerPhone ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${data.customerPhone}</span>
            </div>
            ` : ''}
            ${data.customerBusinessLicense ? `
            <div class="info-row">
              <span class="info-label">Business License:</span>
              <span>${data.customerBusinessLicense}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unitPrice.toFixed(2)}</td>
                    <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2">Total</td>
                  <td>${data.totalItems}</td>
                  <td></td>
                  <td>$${data.estimatedTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${data.specialInstructions ? `
          <div class="section">
            <div class="section-title">Special Instructions</div>
            <p>${data.specialInstructions}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>This is an automated notification from BC Flame Premium Client Portal.</p>
            <p>Please review and respond to this inquiry promptly.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
NEW ORDER INQUIRY

Order Information:
Inquiry Number: ${data.inquiryNumber}
Date: ${new Date(data.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

Customer Information:
Name: ${data.customerName}
Email: ${data.customerEmail}
Company: ${data.customerCompany}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
${data.customerBusinessLicense ? `Business License: ${data.customerBusinessLicense}` : ''}

Order Items:
${data.items.map(item => `- ${item.productName} (${item.size}) x ${item.quantity} @ $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`).join('\n')}

Total Items: ${data.totalItems}
Estimated Total: $${data.estimatedTotal.toFixed(2)}

${data.specialInstructions ? `Special Instructions:\n${data.specialInstructions}\n` : ''}
---
This is an automated notification from BC Flame Premium Client Portal.
  `.trim()

  return { subject, html, text }
}

/**
 * Generate confirmation email for customer when order is created
 */
export function generateNewOrderEmailForCustomer(data: OrderEmailData): EmailTemplate {
  const subject = `Order Inquiry Received: ${data.inquiryNumber}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #dc2626;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 0 0 5px 5px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 10px;
          color: #dc2626;
        }
        .info-box {
          background-color: #fff;
          padding: 15px;
          border-left: 4px solid #dc2626;
          margin: 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          background-color: white;
        }
        th {
          background-color: #dc2626;
          color: white;
          padding: 10px;
          text-align: left;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .total-row {
          font-weight: bold;
          background-color: #f0f0f0;
        }
        .next-steps {
          background-color: #fff;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .next-steps ol {
          padding-left: 20px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Order Inquiry</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Thank you for submitting your order inquiry. We have received your request and our team will review it shortly.</p>

          <div class="info-box">
            <strong>Your Inquiry Number:</strong> ${data.inquiryNumber}<br>
            <strong>Date Submitted:</strong> ${new Date(data.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>

          <div class="section">
            <div class="section-title">Order Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2">Total</td>
                  <td>${data.totalItems} items</td>
                  <td>$${data.estimatedTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="next-steps">
            <div class="section-title">What happens next?</div>
            <ol>
              <li>Our team will review your order inquiry within 1-2 business days</li>
              <li>We'll verify product availability and pricing</li>
              <li>You'll receive an email confirmation with the final details</li>
              <li>Once approved, we'll process your order and arrange delivery</li>
            </ol>
          </div>

          <p>If you have any questions, please don't hesitate to contact us. Reference your inquiry number <strong>${data.inquiryNumber}</strong> in all communications.</p>

          <div class="footer">
            <p><strong>BC Flame Premium Client Portal</strong></p>
            <p>This is an automated confirmation email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
THANK YOU FOR YOUR ORDER INQUIRY

Dear ${data.customerName},

Thank you for submitting your order inquiry. We have received your request and our team will review it shortly.

Your Inquiry Number: ${data.inquiryNumber}
Date Submitted: ${new Date(data.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

ORDER SUMMARY:
${data.items.map(item => `- ${item.productName} (${item.size}) x ${item.quantity} = $${(item.quantity * item.unitPrice).toFixed(2)}`).join('\n')}

Total: ${data.totalItems} items - $${data.estimatedTotal.toFixed(2)}

WHAT HAPPENS NEXT?
1. Our team will review your order inquiry within 1-2 business days
2. We'll verify product availability and pricing
3. You'll receive an email confirmation with the final details
4. Once approved, we'll process your order and arrange delivery

If you have any questions, please reference your inquiry number ${data.inquiryNumber} in all communications.

---
BC Flame Premium Client Portal
This is an automated confirmation email.
  `.trim()

  return { subject, html, text }
}

/**
 * Generate email for customer when order status is updated
 */
export function generateOrderStatusUpdateEmail(data: OrderStatusUpdateData): EmailTemplate {
  const subject = `Order Update: ${data.inquiryNumber} - ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  }

  const statusColor = statusColors[data.status] || '#6b7280'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #dc2626;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 0 0 5px 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          text-transform: uppercase;
          background-color: ${statusColor};
        }
        .info-box {
          background-color: #fff;
          padding: 15px;
          border-left: 4px solid ${statusColor};
          margin: 20px 0;
        }
        .section {
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${data.customerName},</p>
          <p>Your order inquiry <strong>${data.inquiryNumber}</strong> has been updated.</p>

          <div class="info-box">
            <strong>Status:</strong> <span class="status-badge">${data.status}</span>
          </div>

          <div class="section">
            <p><strong>Update Details:</strong></p>
            <p>${data.statusMessage}</p>
          </div>

          <p>If you have any questions about this update, please contact us and reference your inquiry number <strong>${data.inquiryNumber}</strong>.</p>

          <div class="footer">
            <p><strong>BC Flame Premium Client Portal</strong></p>
            <p>This is an automated notification email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
ORDER STATUS UPDATE

Dear ${data.customerName},

Your order inquiry ${data.inquiryNumber} has been updated.

Status: ${data.status.toUpperCase()}

Update Details:
${data.statusMessage}

If you have any questions about this update, please contact us and reference your inquiry number ${data.inquiryNumber}.

---
BC Flame Premium Client Portal
This is an automated notification email.
  `.trim()

  return { subject, html, text }
}
