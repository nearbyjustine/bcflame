import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create shared mock instances BEFORE vi.mock calls
const mockSendEmail = vi.fn().mockResolvedValue({ success: true, messageId: 'test-123' })
const mockVerifyConnection = vi.fn().mockResolvedValue(true)
const mockEmailService = {
  sendEmail: mockSendEmail,
  verifyConnection: mockVerifyConnection,
}

// Mock the email service and templates
vi.mock('../../../../services/resend-email', () => ({
  getResendEmailService: vi.fn(() => mockEmailService),
}))

vi.mock('../../../../templates/order-email', () => ({
  generateNewOrderEmailForAdmin: vi.fn(() => ({
    subject: 'New Order: INQ-123',
    html: '<p>Test HTML</p>',
    text: 'Test Text',
  })),
  generateNewOrderEmailForCustomer: vi.fn(() => ({
    subject: 'Order Received: INQ-123',
    html: '<p>Customer HTML</p>',
    text: 'Customer Text',
  })),
  generateOrderStatusUpdateEmail: vi.fn(() => ({
    subject: 'Order Update: INQ-123',
    html: '<p>Update HTML</p>',
    text: 'Update Text',
  })),
}))

vi.mock('../../../../services/notification', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 1 }),
}))

vi.mock('../../../../services/order-message', () => ({
  createOrderPlacedMessage: vi.fn().mockResolvedValue({ id: 1 }),
  createOrderStatusChangeMessage: vi.fn().mockResolvedValue({ id: 1 }),
}))

import { getResendEmailService } from '../../../../services/resend-email'
import {
  generateNewOrderEmailForAdmin,
  generateNewOrderEmailForCustomer,
  generateOrderStatusUpdateEmail,
} from '../../../../templates/order-email'

// Create a shared findOne mock that can be overridden per-test
const mockFindOne = vi.fn()

describe('Order Inquiry Lifecycles', () => {
  let mockStrapi: any
  let mockEvent: any
  let emailService: any
  let lifecycles: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mock email service (always the same singleton)
    emailService = getResendEmailService()

    // Set default mock return value for findOne (can be overridden per-test)
    mockFindOne.mockResolvedValue({
      id: 1,
      inquiry_number: 'INQ-20260113-1234',
      status: 'pending',
      product: {
        id: 1,
        name: 'Test Product',
        base_price_per_pound: 3234.21,
        pricing_model: 'per_pound',
        pricing: [
          { weight: '7g', amount: 50.00, currency: 'USD' },
          { weight: '14g', amount: 90.00, currency: 'USD' },
        ],
      },
      customer: {
        id: 1,
        username: 'testuser',
        email: 'customer@test.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Test Company',
        phone: '(555) 123-4567',
        businessLicense: 'CA-LIC-123456',
      },
      total_weight: 0.22,
      weight_unit: 'P',
      notes: 'Test notes',
      createdAt: '2026-01-13T10:00:00.000Z',
    })

    // Mock Strapi instance
    mockStrapi = {
      config: {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'email.adminRecipients') return ['admin@bcflame.com']
          return defaultValue ?? null
        }),
      },
      log: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      },
      requestContext: {
        get: vi.fn(() => ({
          state: {
            user: null,
          },
        })),
      },
      db: {
        query: vi.fn(() => ({
          findOne: mockFindOne,
        })),
      },
    }

    // Mock event
    mockEvent = {
      strapi: mockStrapi,
      result: {
        id: 1,
        inquiry_number: null,
        status: 'pending',
      },
      params: {
        where: {
          id: 1,
        },
        data: {
          status: 'pending',
        },
      },
      state: {
        previousStatus: 'pending',
      },
    }

    // Set global strapi for lifecycle code
    global.strapi = mockStrapi

    // Import lifecycles module
    const lifecyclesModule = await import('./lifecycles')
    lifecycles = lifecyclesModule.default
  })

  describe('afterCreate', () => {
    it('generates inquiry number after creation', async () => {
      // Call beforeCreate first to generate the inquiry number
      const beforeCreateEvent = {
        ...mockEvent,
        params: {
          ...mockEvent.params,
          data: {
            ...mockEvent.params.data,
          },
        },
      }
      
      await lifecycles.beforeCreate(beforeCreateEvent)
      
      // The inquiry number should be in params.data after beforeCreate
      expect(beforeCreateEvent.params.data.inquiry_number).toMatch(/^INQ-\d{8}-\d{4}$/)
    })

    it('sends email to admin after creation', async () => {
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate(mockEvent)

      expect(generateNewOrderEmailForAdmin).toHaveBeenCalled()
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['admin@bcflame.com'],
          subject: 'New Order: INQ-123',
        })
      )
    })

    it('sends confirmation email to customer after creation', async () => {
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate(mockEvent)

      expect(generateNewOrderEmailForCustomer).toHaveBeenCalled()
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@test.com',
          subject: 'Order Received: INQ-123',
        })
      )
    })

    it('handles email send failures gracefully', async () => {
      emailService.sendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP Error' })
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      // Should not throw
      await expect(lifecycles.afterCreate(mockEvent)).resolves.not.toThrow()
    })

    it('handles missing customer email', async () => {
      const mockData = {
        id: 1,
        inquiry_number: 'INQ-20260113-1234',
        status: 'pending',
        product: {
          id: 1,
          name: 'Test Product',
          base_price_per_pound: 3234.21,
        },
        customer: {
          id: 1,
          email: null,
        },
        total_weight: 0.22,
        weight_unit: 'P',
        createdAt: '2026-01-13T10:00:00.000Z',
      }
      // afterCreate calls findOne twice (raw + with populate)
      mockFindOne.mockResolvedValueOnce(mockData).mockResolvedValueOnce(mockData)
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate(mockEvent)

      // Should only send admin email
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('afterUpdate', () => {
    beforeEach(() => {
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'
      mockEvent.params.data.status = 'approved'
      mockEvent.state.previousStatus = 'pending'
    })

    it('sends status update email when status changes', async () => {
      await lifecycles.afterUpdate(mockEvent)

      expect(generateOrderStatusUpdateEmail).toHaveBeenCalled()
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@test.com',
          subject: 'Order Update: INQ-123',
        })
      )
    })

    it('does not send email when status unchanged', async () => {
      mockEvent.params.data.status = 'pending'
      mockEvent.state.previousStatus = 'pending'

      await lifecycles.afterUpdate(mockEvent)

      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('tracks previous status in state', async () => {
      mockEvent.state = {}

      await lifecycles.beforeUpdate(mockEvent)

      expect(mockEvent.state.previousStatus).toBe('pending')
    })

    it('handles missing customer email on update', async () => {
      mockStrapi.db.query().findOne.mockResolvedValueOnce({
        customer: {
          email: null,
        },
      })

      await lifecycles.afterUpdate(mockEvent)

      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('beforeUpdate', () => {
    it('stores previous status in event state', async () => {
      mockEvent.result.status = 'pending'
      mockEvent.state = {}

      await lifecycles.beforeUpdate(mockEvent)

      expect(mockEvent.state.previousStatus).toBe('pending')
    })

    it('fetches current record to get previous status', async () => {
      await lifecycles.beforeUpdate(mockEvent)

      expect(mockStrapi.db.query).toHaveBeenCalledWith('api::order-inquiry.order-inquiry')
    })
  })

  describe('price calculation', () => {
    it('calculates price using base_price_per_pound for custom weights', async () => {
      // Set up mock for custom weight (0.022 P = ~10g) not in pricing tiers
      // Price calculation: base_price_per_pound * weight_in_pounds = 3234.21 * 0.022 = 71.15262
      const mockData = {
        id: 1,
        inquiry_number: 'INQ-20260113-1234',
        product: {
          id: 1,
          name: 'Test Product',
          base_price_per_pound: 3234.21,
          pricing_model: 'per_pound',
        },
        customer: {
          id: 1,
          email: 'customer@test.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Company',
          phone: '(555) 123-4567',
          businessLicense: 'CA-LIC-123456',
        },
        total_weight: 0.022,
        weight_unit: 'P',
        createdAt: '2026-01-13T10:00:00.000Z',
      }
      // afterCreate calls findOne twice (raw + with populate)
      mockFindOne.mockResolvedValueOnce(mockData).mockResolvedValueOnce(mockData)

      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate(mockEvent)

      // Verify email was called with correct data including calculated price
      // 3234.21 * 0.022 = 71.15262
      expect(generateNewOrderEmailForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              unitPrice: expect.closeTo(71.15, 0.01),
            }),
          ]),
        })
      )
    })

    it('falls back to tiered pricing when base_price_per_pound not available', async () => {
      // Set up mock without base_price_per_pound - should use tiered pricing
      // Weight: 0.015 P, matching tier should be '0.015P' = $50
      const mockData = {
        id: 1,
        inquiry_number: 'INQ-20260113-1234',
        product: {
          id: 1,
          name: 'Test Product',
          pricing: [
            { weight: '0.015P', amount: 50.00, currency: 'USD' },
            { weight: '14g', amount: 90.00, currency: 'USD' },
          ],
        },
        customer: {
          id: 1,
          email: 'customer@test.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Company',
          phone: '(555) 123-4567',
          businessLicense: 'CA-LIC-123456',
        },
        total_weight: 0.015,
        weight_unit: 'P',
        createdAt: '2026-01-13T10:00:00.000Z',
      }
      // afterCreate calls findOne twice (raw + with populate)
      mockFindOne.mockResolvedValueOnce(mockData).mockResolvedValueOnce(mockData)

      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate(mockEvent)

      // Verify email was called with correct tiered pricing
      expect(generateNewOrderEmailForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              unitPrice: 50.00,
            }),
          ]),
        })
      )
    })
  })
})
