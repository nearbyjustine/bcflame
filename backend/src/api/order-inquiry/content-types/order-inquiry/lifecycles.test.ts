import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the email service and templates
vi.mock('../../../../services/email', () => ({
  getEmailService: vi.fn(() => ({
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-123' }),
    verifyConnection: vi.fn().mockResolvedValue(true),
  })),
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

import { getEmailService } from '../../../../services/email'
import {
  generateNewOrderEmailForAdmin,
  generateNewOrderEmailForCustomer,
  generateOrderStatusUpdateEmail,
} from '../../../../templates/order-email'

describe('Order Inquiry Lifecycles', () => {
  let mockStrapi: any
  let mockEvent: any
  let emailService: any
  let lifecycles: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mock email service
    emailService = getEmailService()

    // Mock Strapi instance
    mockStrapi = {
      config: {
        get: vi.fn((key: string) => {
          if (key === 'email.adminRecipients') return ['admin@bcflame.com']
          return null
        }),
      },
      db: {
        query: vi.fn(() => ({
          findOne: vi.fn().mockResolvedValue({
            id: 1,
            inquiry_number: 'INQ-20260113-1234',
            status: 'pending',
            product: {
              id: 1,
              name: 'Test Product',
              base_price_per_gram: 7.14,
              pricing_model: 'per_gram',
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
            total_weight: 100,
            weight_unit: 'g',
            notes: 'Test notes',
            createdAt: '2026-01-13T10:00:00.000Z',
          }),
        })),
      },
    }

    // Mock event
    mockEvent = {
      result: {
        id: 1,
        inquiry_number: null,
        status: 'pending',
      },
      params: {
        data: {
          status: 'pending',
        },
      },
      state: {
        previousStatus: 'pending',
      },
    }

    // Import lifecycles module
    const lifecyclesModule = await import('./lifecycles')
    lifecycles = lifecyclesModule.default
  })

  describe('afterCreate', () => {
    it('generates inquiry number after creation', async () => {
      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

      expect(mockEvent.result.inquiry_number).toMatch(/^INQ-\d{8}-\d{4}$/)
    })

    it('sends email to admin after creation', async () => {
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

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

      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

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
      await expect(lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })).resolves.not.toThrow()
    })

    it('handles missing customer email', async () => {
      mockStrapi.db.query().findOne.mockResolvedValueOnce({
        ...mockStrapi.db.query().findOne(),
        customer: {
          id: 1,
          email: null,
        },
      })
      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

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
      await lifecycles.afterUpdate({ strapi: mockStrapi, event: mockEvent })

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

      await lifecycles.afterUpdate({ strapi: mockStrapi, event: mockEvent })

      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('tracks previous status in state', async () => {
      mockEvent.state = {}

      await lifecycles.beforeUpdate({ strapi: mockStrapi, event: mockEvent })

      expect(mockEvent.state.previousStatus).toBe('pending')
    })

    it('handles missing customer email on update', async () => {
      mockStrapi.db.query().findOne.mockResolvedValueOnce({
        customer: {
          email: null,
        },
      })

      await lifecycles.afterUpdate({ strapi: mockStrapi, event: mockEvent })

      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('beforeUpdate', () => {
    it('stores previous status in event state', async () => {
      mockEvent.result.status = 'pending'
      mockEvent.state = {}

      await lifecycles.beforeUpdate({ strapi: mockStrapi, event: mockEvent })

      expect(mockEvent.state.previousStatus).toBe('pending')
    })

    it('fetches current record to get previous status', async () => {
      await lifecycles.beforeUpdate({ strapi: mockStrapi, event: mockEvent })

      expect(mockStrapi.db.query).toHaveBeenCalledWith('api::order-inquiry.order-inquiry')
    })
  })

  describe('price calculation', () => {
    it('calculates price using base_price_per_gram for custom weights', async () => {
      // Set up mock for custom weight (10g) not in pricing tiers
      mockStrapi.db.query().findOne.mockResolvedValueOnce({
        id: 1,
        inquiry_number: 'INQ-20260113-1234',
        product: {
          id: 1,
          name: 'Test Product',
          base_price_per_gram: 7.14,
          pricing_model: 'per_gram',
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
        total_weight: 10,
        weight_unit: 'g',
        createdAt: '2026-01-13T10:00:00.000Z',
      })

      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

      // Verify email was called with correct data including calculated price
      expect(generateNewOrderEmailForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              unitPrice: 71.4, // 7.14 * 10g = 71.4
            }),
          ]),
        })
      )
    })

    it('falls back to tiered pricing when base_price_per_gram not available', async () => {
      // Set up mock without base_price_per_gram
      mockStrapi.db.query().findOne.mockResolvedValueOnce({
        id: 1,
        inquiry_number: 'INQ-20260113-1234',
        product: {
          id: 1,
          name: 'Test Product',
          pricing: [
            { weight: '7g', amount: 50.00, currency: 'USD' },
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
        total_weight: 7,
        weight_unit: 'g',
        createdAt: '2026-01-13T10:00:00.000Z',
      })

      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

      // Verify email was called with correct tiered pricing
      expect(generateNewOrderEmailForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              unitPrice: 50.00, // Matched 7g tier
            }),
          ]),
        })
      )
    })

    it('converts weight units correctly for price calculation', async () => {
      // Set up mock for oz weight
      mockStrapi.db.query().findOne.mockResolvedValueOnce({
        id: 1,
        inquiry_number: 'INQ-20260113-1234',
        product: {
          id: 1,
          name: 'Test Product',
          base_price_per_gram: 7.14,
          pricing_model: 'per_gram',
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
        total_weight: 1,
        weight_unit: 'oz',
        createdAt: '2026-01-13T10:00:00.000Z',
      })

      mockEvent.result.inquiry_number = 'INQ-20260113-1234'

      await lifecycles.afterCreate({ strapi: mockStrapi, event: mockEvent })

      // Verify email was called with correct converted price
      // 1 oz = 28.35 grams, so 7.14 * 28.35 = 202.419
      expect(generateNewOrderEmailForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              unitPrice: expect.closeTo(202.42, 0.1),
            }),
          ]),
        })
      )
    })
  })
})
