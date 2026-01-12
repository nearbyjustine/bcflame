import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEmailService } from './email'
import nodemailer from 'nodemailer'

// Mock nodemailer
vi.mock('nodemailer')

describe('Email Service', () => {
  let mockTransporter: any
  let emailService: ReturnType<typeof createEmailService>

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock transporter
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: vi.fn().mockResolvedValue(true),
    }

    // Mock nodemailer.createTransport
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as any)

    // Create email service with test config
    emailService = createEmailService({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@test.com',
        pass: 'test-password',
      },
      from: {
        name: 'BC Flame',
        email: 'noreply@bcflame.com',
      },
    })
  })

  describe('createEmailService', () => {
    it('creates transporter with correct configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'test-password',
        },
      })
    })

    it('throws error if configuration is invalid', () => {
      expect(() => createEmailService({} as any)).toThrow('Invalid email configuration')
    })
  })

  describe('sendEmail', () => {
    it('sends email with correct parameters', async () => {
      await emailService.sendEmail({
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      })

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'BC Flame <noreply@bcflame.com>',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      })
    })

    it('sends email with multiple recipients', async () => {
      await emailService.sendEmail({
        to: ['user1@test.com', 'user2@test.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      })

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'BC Flame <noreply@bcflame.com>',
        to: 'user1@test.com,user2@test.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: undefined,
      })
    })

    it('returns success result on successful send', async () => {
      const result = await emailService.sendEmail({
        to: 'recipient@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
      })
    })

    it('returns error result on failed send', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'))

      const result = await emailService.sendEmail({
        to: 'recipient@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result).toEqual({
        success: false,
        error: 'SMTP Error',
      })
    })

    it('handles missing to field', async () => {
      const result = await emailService.sendEmail({
        to: '',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result).toEqual({
        success: false,
        error: 'Recipient email address is required',
      })
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    it('handles missing subject', async () => {
      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: '',
        html: '<p>Test</p>',
      })

      expect(result).toEqual({
        success: false,
        error: 'Email subject is required',
      })
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    it('handles missing html content', async () => {
      const result = await emailService.sendEmail({
        to: 'test@test.com',
        subject: 'Test',
        html: '',
      })

      expect(result).toEqual({
        success: false,
        error: 'Email content is required',
      })
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })
  })

  describe('verifyConnection', () => {
    it('returns true when connection is valid', async () => {
      const result = await emailService.verifyConnection()
      expect(result).toBe(true)
      expect(mockTransporter.verify).toHaveBeenCalled()
    })

    it('returns false when connection fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'))
      const result = await emailService.verifyConnection()
      expect(result).toBe(false)
    })
  })
})
