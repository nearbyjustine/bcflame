import { generateInquiryNumber } from '../../services/inquiry-number'
import { getEmailService } from '../../../../services/email'
import {
  generateNewOrderEmailForAdmin,
  generateNewOrderEmailForCustomer,
  generateOrderStatusUpdateEmail,
} from '../../../../templates/order-email'

/**
 * Format order data for email templates
 */
function formatOrderDataForEmail(inquiry: any) {
  const customer = inquiry.customer || {}
  const product = inquiry.product || {}

  return {
    inquiryNumber: inquiry.inquiry_number,
    customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || 'Customer',
    customerEmail: customer.email,
    customerCompany: customer.company || 'N/A',
    items: [
      {
        productName: product.name || 'Product',
        size: `${inquiry.total_weight}${inquiry.weight_unit}`,
        quantity: 1,
        unitPrice: 0, // Price TBD - inquiry stage
      },
    ],
    totalItems: 1,
    estimatedTotal: 0, // Price TBD
    specialInstructions: inquiry.notes || '',
    createdAt: inquiry.createdAt,
  }
}

/**
 * Get status update message based on status
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: 'Your order inquiry is pending review.',
    reviewing: 'Our team is currently reviewing your order inquiry.',
    approved: 'Great news! Your order inquiry has been approved. We will contact you shortly with the next steps.',
    rejected: 'We regret to inform you that we cannot fulfill this order inquiry at this time. Please contact us for more information.',
    fulfilled: 'Your order has been fulfilled. Thank you for your business!',
  }
  return messages[status] || 'Your order status has been updated.'
}

export default {
  async beforeCreate(event) {
    const { data } = event.params

    // Auto-generate inquiry number if not provided
    if (!data.inquiry_number) {
      data.inquiry_number = generateInquiryNumber()
    }

    // Auto-set customer from authenticated user if not provided
    if (!data.customer && event.state?.user) {
      data.customer = event.state.user.id
    }
  },

  /**
   * Before update - store previous status for comparison
   */
  async beforeUpdate(event: any) {
    const { strapi } = event
    const { id } = event.params.where || {}

    if (id) {
      // Fetch current record to get previous status
      const currentRecord = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
        where: { id },
        select: ['status'],
      })

      if (currentRecord) {
        event.state = event.state || {}
        event.state.previousStatus = currentRecord.status
      }
    }
  },

  /**
   * After create - send notification emails
   */
  async afterCreate(event) {
    const { result, strapi } = event

    try {
      // Fetch full inquiry data with relations
      const inquiry = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
        where: { id: result.id },
        populate: {
          customer: true,
          product: {
            populate: ['available_sizes'],
          },
        },
      })

      if (!inquiry) {
        strapi.log.warn('Order inquiry not found after creation:', result.id)
        return
      }

      strapi.log.info(`Order inquiry created: ${inquiry.inquiry_number}`)

      // Get email service
      const emailService = getEmailService()

      // Format order data
      const orderData = formatOrderDataForEmail(inquiry)

      // Send email to admin
      const adminRecipients = strapi.config.get('email.adminRecipients', ['admin@bcflame.com'])
      const adminEmail = generateNewOrderEmailForAdmin(orderData)

      const adminResult = await emailService.sendEmail({
        to: adminRecipients,
        subject: adminEmail.subject,
        html: adminEmail.html,
        text: adminEmail.text,
      })

      if (!adminResult.success) {
        strapi.log.error('Failed to send admin notification email:', adminResult.error)
      } else {
        strapi.log.info('Admin notification email sent successfully:', adminResult.messageId)
      }

      // Send confirmation email to customer
      if (inquiry.customer?.email) {
        const customerEmail = generateNewOrderEmailForCustomer(orderData)

        const customerResult = await emailService.sendEmail({
          to: inquiry.customer.email,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text,
        })

        if (!customerResult.success) {
          strapi.log.error('Failed to send customer confirmation email:', customerResult.error)
        } else {
          strapi.log.info('Customer confirmation email sent successfully:', customerResult.messageId)
        }
      }
    } catch (error) {
      strapi.log.error('Error in afterCreate lifecycle:', error)
      // Don't throw - we don't want to fail the creation if email fails
    }
  },

  /**
   * After update - send status update email if status changed
   */
  async afterUpdate(event: any) {
    const { result, params, state, strapi } = event

    try {
      const previousStatus = state?.previousStatus
      const newStatus = params.data?.status || result.status

      // Only send email if status changed
      if (previousStatus && newStatus && previousStatus !== newStatus) {
        // Fetch full inquiry data with relations
        const inquiry = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
          where: { id: result.id },
          populate: {
            customer: true,
            product: {
              populate: ['available_sizes'],
            },
          },
        })

        if (!inquiry || !inquiry.customer?.email) {
          strapi.log.warn('Cannot send status update email - customer email not found')
          return
        }

        // Get email service
        const emailService = getEmailService()

        // Format order data
        const orderData = formatOrderDataForEmail(inquiry)

        // Generate status update email
        const statusUpdateEmail = generateOrderStatusUpdateEmail({
          ...orderData,
          status: newStatus,
          statusMessage: getStatusMessage(newStatus),
        })

        // Send email to customer
        const emailResult = await emailService.sendEmail({
          to: inquiry.customer.email,
          subject: statusUpdateEmail.subject,
          html: statusUpdateEmail.html,
          text: statusUpdateEmail.text,
        })

        if (!emailResult.success) {
          strapi.log.error('Failed to send status update email:', emailResult.error)
        } else {
          strapi.log.info('Status update email sent successfully:', emailResult.messageId)
        }
      }
    } catch (error) {
      strapi.log.error('Error in afterUpdate lifecycle:', error)
      // Don't throw - we don't want to fail the update if email fails
    }
  },
}
