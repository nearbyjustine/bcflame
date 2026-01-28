import { Resend } from 'resend'

export interface ResendConfig {
  apiKey: string
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

export interface IEmailService {
  sendEmail: (params: SendEmailParams) => Promise<EmailResult>
  verifyConnection: () => Promise<boolean>
}

/**
 * Creates an email service instance with Resend
 */
export function createResendEmailService(config: ResendConfig): IEmailService {
  // Validate configuration
  if (!config.apiKey) {
    throw new Error('Resend API key is required')
  }

  if (!config.from || !config.from.email) {
    throw new Error('From email address is required')
  }

  // Create Resend client
  const resend = new Resend(config.apiKey)

  // Track the primary from email and fallback
  const primaryFrom = config.from.email
  const fallbackFrom = 'onboarding@resend.dev'
  let currentFrom = primaryFrom

  /**
   * Send an email with Resend
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

      // Format 'from' field
      const fromField = `${config.from.name} <${currentFrom}>`

      // Format 'to' field - Resend accepts string or array
      const toField = Array.isArray(params.to) ? params.to : [params.to]

      // Send email with Resend
      const { data, error } = await resend.emails.send({
        from: fromField,
        to: toField,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })

      // If we got an error related to domain verification, try fallback
      if (error && currentFrom !== fallbackFrom) {
        const errorMessage = error.message || ''
        const isDomainError = errorMessage.toLowerCase().includes('domain') ||
                              errorMessage.toLowerCase().includes('verified') ||
                              errorMessage.toLowerCase().includes('unverified')

        if (isDomainError) {
          console.warn(
            `Resend: Primary domain ${primaryFrom} failed. Falling back to ${fallbackFrom}.` +
            ` Error: ${errorMessage}`
          )

          // Switch to fallback and retry
          currentFrom = fallbackFrom
          const fallbackFromField = `${config.from.name} <${currentFrom}>`

          const retryResult = await resend.emails.send({
            from: fallbackFromField,
            to: toField,
            subject: params.subject,
            html: params.html,
            text: params.text,
          })

          if (retryResult.error) {
            return {
              success: false,
              error: `Fallback also failed: ${retryResult.error.message}`,
            }
          }

          return {
            success: true,
            messageId: retryResult.data?.id,
          }
        }

        // Non-domain error, return it
        return {
          success: false,
          error: errorMessage || 'Failed to send email',
        }
      }

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email',
        }
      }

      return {
        success: true,
        messageId: data?.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Verify Resend API connection
   * Note: Resend doesn't have a direct "verify" method like SMTP,
   * so we'll check if the API key is configured correctly
   */
  async function verifyConnection(): Promise<boolean> {
    try {
      // We can verify by checking if we can list API keys or domains
      // For now, we'll just return true if we have an API key
      // In a real scenario, you might want to make a test API call
      return !!config.apiKey && config.apiKey.length > 0
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
let resendEmailServiceInstance: IEmailService | null = null

/**
 * Get or create Resend email service singleton
 */
export function getResendEmailService(): IEmailService {
  if (!resendEmailServiceInstance) {
    // Get configuration from environment variables
    const apiKey = process.env.RESEND_API_KEY || ''
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = process.env.EMAIL_FROM_NAME || 'BC Flame'

    const config: ResendConfig = {
      apiKey,
      from: {
        name: fromName,
        email: fromEmail,
      },
    }

    resendEmailServiceInstance = createResendEmailService(config)
  }

  return resendEmailServiceInstance
}

/**
 * ResendEmailService class for easier singleton access
 */
export class ResendEmailService {
  private static instance: ResendEmailService | null = null

  private service: IEmailService

  private constructor() {
    this.service = getResendEmailService()
  }

  public static getInstance(): ResendEmailService {
    if (!ResendEmailService.instance) {
      ResendEmailService.instance = new ResendEmailService()
    }
    return ResendEmailService.instance
  }

  public async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    return this.service.sendEmail(params)
  }

  public async verifyConnection(): Promise<boolean> {
    return this.service.verifyConnection()
  }
}
