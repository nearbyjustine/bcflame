import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    email: string
  }
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailService {
  sendEmail: (params: SendEmailParams) => Promise<EmailResult>
  verifyConnection: () => Promise<boolean>
}

/**
 * Creates an email service instance with nodemailer
 */
export function createEmailService(config: EmailConfig): EmailService {
  // Validate configuration
  if (!config.host || !config.port || !config.auth || !config.from) {
    throw new Error('Invalid email configuration')
  }

  // Create transporter
  const transporter: Transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  })

  /**
   * Send an email
   */
  async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      // Validate parameters
      if (!params.to || (Array.isArray(params.to) && params.to.length === 0)) {
        return {
          success: false,
          error: 'Recipient email address is required',
        }
      }

      if (!params.subject) {
        return {
          success: false,
          error: 'Email subject is required',
        }
      }

      if (!params.html) {
        return {
          success: false,
          error: 'Email content is required',
        }
      }

      // Format 'to' field
      const to = Array.isArray(params.to) ? params.to.join(',') : params.to

      // Send email
      const info = await transporter.sendMail({
        from: `${config.from.name} <${config.from.email}>`,
        to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify SMTP connection
   */
  async function verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify()
      return true
    } catch (error) {
      return false
    }
  }

  return {
    sendEmail,
    verifyConnection,
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null

/**
 * Get or create email service singleton
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    // Get configuration from environment variables
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'BC Flame',
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@bcflame.com',
      },
    }

    emailServiceInstance = createEmailService(config)
  }

  return emailServiceInstance
}
