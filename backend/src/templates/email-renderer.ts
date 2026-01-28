import * as fs from 'fs'
import * as path from 'path'

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

/**
 * Read an HTML template file from the templates/html directory
 * Works in both development (src/) and production (dist/) environments
 */
function readTemplate(templateName: string): string {
  // Try dist path first (production)
  let templatePath = path.join(__dirname, 'html', templateName)

  // If file doesn't exist in dist, try src path (development)
  if (!fs.existsSync(templatePath)) {
    // __dirname in development: /backend/src/templates
    // __dirname in production: /backend/dist/src/templates
    // Go up to project root and find src/templates/html
    const srcPath = path.join(__dirname, '..', '..', '..', 'src', 'templates', 'html', templateName)

    if (fs.existsSync(srcPath)) {
      templatePath = srcPath
    } else {
      throw new Error(
        `Template not found: ${templateName}. ` +
        `Tried paths: ${templatePath}, ${srcPath}`
      )
    }
  }

  return fs.readFileSync(templatePath, 'utf-8')
}

/**
 * Replace a single placeholder in the template
 */
function replacePlaceholder(template: string, placeholder: string, value: string): string {
  const regex = new RegExp(`{{${placeholder}}}`, 'g')
  return template.replace(regex, value)
}

/**
 * Format date for email display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Render order items as HTML table rows for admin email
 */
function renderOrderItemsAdmin(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unitPrice.toFixed(2)}</td>
                    <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                `
    )
    .join('')
}

/**
 * Render order items as HTML table rows for customer email
 */
function renderOrderItemsCustomer(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                `
    )
    .join('')
}

/**
 * Render admin order email HTML
 */
export function renderAdminOrderEmail(data: OrderEmailData): string {
  let template = readTemplate('new-order-admin.html')

  // Replace basic placeholders
  template = replacePlaceholder(template, 'inquiryNumber', data.inquiryNumber)
  template = replacePlaceholder(template, 'createdAt', formatDate(data.createdAt))
  template = replacePlaceholder(template, 'customerName', data.customerName)
  template = replacePlaceholder(template, 'customerEmail', data.customerEmail)
  template = replacePlaceholder(template, 'customerCompany', data.customerCompany)
  template = replacePlaceholder(template, 'totalItems', data.totalItems.toString())
  template = replacePlaceholder(template, 'estimatedTotal', data.estimatedTotal.toFixed(2))

  // Replace order items
  template = replacePlaceholder(template, 'orderItems', renderOrderItemsAdmin(data.items))

  // Handle conditional phone
  if (data.customerPhone) {
    const phoneHtml = `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${data.customerPhone}</span>
            </div>
            `
    template = replacePlaceholder(template, 'customerPhone', phoneHtml)
  } else {
    template = replacePlaceholder(template, 'customerPhone', '')
  }

  // Handle conditional business license
  if (data.customerBusinessLicense) {
    const licenseHtml = `
            <div class="info-row">
              <span class="info-label">Business License:</span>
              <span>${data.customerBusinessLicense}</span>
            </div>
            `
    template = replacePlaceholder(template, 'customerBusinessLicense', licenseHtml)
  } else {
    template = replacePlaceholder(template, 'customerBusinessLicense', '')
  }

  // Handle conditional special instructions
  if (data.specialInstructions) {
    const instructionsHtml = `
          <div class="section">
            <div class="section-title">Special Instructions</div>
            <p>${data.specialInstructions}</p>
          </div>
          `
    template = replacePlaceholder(template, 'specialInstructions', instructionsHtml)
  } else {
    template = replacePlaceholder(template, 'specialInstructions', '')
  }

  return template
}

/**
 * Render customer order confirmation email HTML
 */
export function renderCustomerOrderEmail(data: OrderEmailData): string {
  let template = readTemplate('new-order-customer.html')

  // Replace basic placeholders
  template = replacePlaceholder(template, 'inquiryNumber', data.inquiryNumber)
  template = replacePlaceholder(template, 'createdAt', formatDate(data.createdAt))
  template = replacePlaceholder(template, 'customerName', data.customerName)
  template = replacePlaceholder(template, 'totalItems', data.totalItems.toString())
  template = replacePlaceholder(template, 'estimatedTotal', data.estimatedTotal.toFixed(2))

  // Replace order items
  template = replacePlaceholder(template, 'orderItems', renderOrderItemsCustomer(data.items))

  return template
}

/**
 * Render order status update email HTML
 */
export function renderStatusUpdateEmail(data: OrderStatusUpdateData): string {
  let template = readTemplate('order-status-update.html')

  // Map status to color
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
  }
  const statusColor = statusColors[data.status] || '#6b7280'

  // Replace placeholders
  template = replacePlaceholder(template, 'inquiryNumber', data.inquiryNumber)
  template = replacePlaceholder(template, 'customerName', data.customerName)
  template = replacePlaceholder(template, 'status', data.status)
  template = replacePlaceholder(template, 'statusMessage', data.statusMessage)
  template = replacePlaceholder(template, 'statusColor', statusColor)

  return template
}
