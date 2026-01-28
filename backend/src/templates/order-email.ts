import {
  renderAdminOrderEmail,
  renderCustomerOrderEmail,
  renderStatusUpdateEmail,
} from './email-renderer'

// Re-export interfaces from email-renderer for backward compatibility
export type { OrderItem, OrderEmailData, OrderStatusUpdateData } from './email-renderer'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Format date for plain text email
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Generate email for admin when new order is created
 */
export function generateNewOrderEmailForAdmin(data: any): EmailTemplate {
  const subject = `New Order Inquiry: ${data.inquiryNumber}`

  // Use the HTML renderer
  const html = renderAdminOrderEmail(data)

  // Keep plain text version inline
  const text = `
NEW ORDER INQUIRY

Order Information:
Inquiry Number: ${data.inquiryNumber}
Date: ${formatDate(data.createdAt)}

Customer Information:
Name: ${data.customerName}
Email: ${data.customerEmail}
Company: ${data.customerCompany}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
${data.customerBusinessLicense ? `Business License: ${data.customerBusinessLicense}` : ''}

Order Items:
${data.items.map((item: any) => `- ${item.productName} (${item.size}) x ${item.quantity} @ $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`).join('\n')}

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
export function generateNewOrderEmailForCustomer(data: any): EmailTemplate {
  const subject = `Order Inquiry Received: ${data.inquiryNumber}`

  // Use the HTML renderer
  const html = renderCustomerOrderEmail(data)

  // Keep plain text version inline
  const text = `
THANK YOU FOR YOUR ORDER INQUIRY

Dear ${data.customerName},

Thank you for submitting your order inquiry. We have received your request and our team will review it shortly.

Your Inquiry Number: ${data.inquiryNumber}
Date Submitted: ${formatDate(data.createdAt)}

ORDER SUMMARY:
${data.items.map((item: any) => `- ${item.productName} (${item.size}) x ${item.quantity} = $${(item.quantity * item.unitPrice).toFixed(2)}`).join('\n')}

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
export function generateOrderStatusUpdateEmail(data: any): EmailTemplate {
  const subject = `Order Update: ${data.inquiryNumber} - ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`

  // Use the HTML renderer
  const html = renderStatusUpdateEmail(data)

  // Keep plain text version inline
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
