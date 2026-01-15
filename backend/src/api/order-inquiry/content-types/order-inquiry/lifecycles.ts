import { generateInquiryNumber } from '../../services/inquiry-number'
import { getEmailService } from '../../../../services/email'
import {
  generateNewOrderEmailForAdmin,
  generateNewOrderEmailForCustomer,
  generateOrderStatusUpdateEmail,
} from '../../../../templates/order-email'

// Access global strapi instance (Strapi 4 doesn't pass it in lifecycle events)
declare const strapi: any

/** Number of grams in one pound */
const GRAMS_PER_POUND = 453.592

/**
 * Format order data for email templates
 */
function formatOrderDataForEmail(inquiry: any) {
  // db.query returns direct objects, not wrapped in data/attributes
  const customer = inquiry.customer || {}
  const product = inquiry.product || {}

  // Calculate unit price from base_price_per_pound
  let unitPrice = 0
  if (product.base_price_per_pound) {
    // Convert weight to pounds if needed (prebagging options are in grams)
    let weightInPounds = inquiry.total_weight
    if (inquiry.weight_unit === 'g') {
      weightInPounds = inquiry.total_weight / GRAMS_PER_POUND
    }
    unitPrice = product.base_price_per_pound * weightInPounds
  }

  // Fallback to tiered pricing if base_price_per_pound not set (backward compatibility)
  if (unitPrice === 0 && product.pricing && Array.isArray(product.pricing)) {
    const orderWeight = `${inquiry.total_weight}${inquiry.weight_unit}`
    const matchingPrice = product.pricing.find(
      (p: any) => p.weight === orderWeight
    )
    if (matchingPrice) {
      unitPrice = matchingPrice.amount || 0
    }
  }
  
  return {
    inquiryNumber: inquiry.inquiry_number,
    customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || 'Customer',
    customerEmail: customer.email || 'Not provided',
    customerCompany: customer.company || 'N/A',
    customerPhone: customer.phone || 'Not provided',
    customerBusinessLicense: customer.businessLicense || 'Not provided',
    items: [
      {
        productName: product.name || 'Product',
        size: `${inquiry.total_weight}${inquiry.weight_unit}`,
        quantity: 1,
        unitPrice: unitPrice,
      },
    ],
    totalItems: 1,
    estimatedTotal: unitPrice, // Based on single item
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
    // In Strapi 4 lifecycles, use requestContext to access HTTP context
    if (!data.customer) {
      // Try getting user from Strapi's request context (populated by middleware)
      const requestContext = strapi.requestContext?.get?.()
      const user = requestContext?.state?.user
      
      if (user?.id) {
        data.customer = user.id
        strapi.log.info(`beforeCreate - Customer set from requestContext: ${user.id}`)
      } else {
        strapi.log.warn('beforeCreate - No user found in requestContext')
      }
    }

    strapi.log.debug(`beforeCreate - Final customer ID: ${data.customer || 'NOT SET'}`)
  },

  /**
   * Before update - store previous status for comparison
   */
  async beforeUpdate(event: any) {
    const { id } = event.params?.where || {}

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
    const { result } = event

    try {
      strapi.log.debug('afterCreate - result object:', JSON.stringify(result, null, 2))

      // First fetch without populate to see the raw customer ID
      const rawInquiry = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
        where: { id: result.id },
      })
      strapi.log.debug('Raw inquiry (no populate):', JSON.stringify(rawInquiry, null, 2))

      // Fetch full inquiry data with relations using db.query for better control
      const inquiry = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
        where: { id: result.id },
        populate: {
          customer: true,
          product: {
            populate: ['pricing'],
          },
        },
      })

      if (!inquiry) {
        strapi.log.warn('Order inquiry not found after creation:', result.id)
        return
      }

      // If customer wasn't populated, fetch it separately using the raw customer ID
      if (!inquiry.customer && rawInquiry.customer) {
        const customerId = typeof rawInquiry.customer === 'object' ? rawInquiry.customer.id : rawInquiry.customer
        strapi.log.debug('Fetching customer separately with ID:', customerId)
        inquiry.customer = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: customerId },
        })
      }

      strapi.log.info(`Order inquiry created: ${inquiry.inquiry_number}`)
      strapi.log.debug('Full inquiry object:', JSON.stringify(inquiry, null, 2))
      strapi.log.debug('Customer data:', JSON.stringify(inquiry.customer, null, 2))

      // Get email service - with defensive check for configuration
      let emailService
      try {
        emailService = getEmailService()
      } catch (emailConfigError) {
        strapi.log.warn('Email service not configured, skipping email notifications:', emailConfigError)
        return
      }

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
    const { result, params, state } = event

    try {
      const previousStatus = state?.previousStatus
      const newStatus = params.data?.status || result.status

      // Only send email if status changed
      if (previousStatus && newStatus && previousStatus !== newStatus) {
        // Fetch full inquiry data with relations using db.query for better control
        const inquiry = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
          where: { id: result.id },
          populate: {
            customer: true,
            product: {
              populate: ['pricing'],
            },
          },
        })

        if (!inquiry) {
          strapi.log.warn('Order inquiry not found:', result.id)
          return
        }

        // If customer wasn't populated, fetch it separately
        if (!inquiry.customer && result.customer) {
          const customerId = typeof result.customer === 'object' ? result.customer.id : result.customer
          inquiry.customer = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: customerId },
          })
        }

        if (!inquiry.customer?.email) {
          strapi.log.warn('Cannot send status update email - customer email not found')
          return
        }

        // Get email service - with defensive check for configuration
        let emailService
        try {
          emailService = getEmailService()
        } catch (emailConfigError) {
          strapi.log.warn('Email service not configured, skipping status update email:', emailConfigError)
          return
        }

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
