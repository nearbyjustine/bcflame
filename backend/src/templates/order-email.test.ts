import { describe, it, expect } from 'vitest'
import {
  generateNewOrderEmailForAdmin,
  generateNewOrderEmailForCustomer,
  generateOrderStatusUpdateEmail
} from './order-email'

describe('Order Email Templates', () => {
  const mockOrderData = {
    inquiryNumber: 'INQ-20260113-1234',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerCompany: 'Test Company',
    items: [
      {
        productName: 'Indica Strain A',
        size: '3.5g',
        quantity: 10,
        unitPrice: 25.00,
      },
      {
        productName: 'Sativa Strain B',
        size: '7g',
        quantity: 5,
        unitPrice: 45.00,
      },
    ],
    totalItems: 15,
    estimatedTotal: 475.00,
    specialInstructions: 'Please rush this order',
    createdAt: '2026-01-13T10:00:00.000Z',
  }

  describe('generateNewOrderEmailForAdmin', () => {
    it('generates email with correct subject', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.subject).toBe('New Order Inquiry: INQ-20260113-1234')
    })

    it('includes inquiry number in HTML content', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.html).toContain('INQ-20260113-1234')
    })

    it('includes customer information', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.html).toContain('John Doe')
      expect(result.html).toContain('john@example.com')
      expect(result.html).toContain('Test Company')
    })

    it('includes all order items', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.html).toContain('Indica Strain A')
      expect(result.html).toContain('3.5g')
      expect(result.html).toContain('10')
      expect(result.html).toContain('Sativa Strain B')
      expect(result.html).toContain('7g')
      expect(result.html).toContain('5')
    })

    it('includes total items and estimated total', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.html).toContain('15')
      expect(result.html).toContain('475.00')
    })

    it('includes special instructions when provided', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.html).toContain('Please rush this order')
    })

    it('does not include special instructions section when empty', () => {
      const dataWithoutInstructions = { ...mockOrderData, specialInstructions: '' }
      const result = generateNewOrderEmailForAdmin(dataWithoutInstructions)
      expect(result.html).not.toContain('Special Instructions')
    })

    it('includes plain text version', () => {
      const result = generateNewOrderEmailForAdmin(mockOrderData)
      expect(result.text).toBeTruthy()
      expect(result.text).toContain('INQ-20260113-1234')
      expect(result.text).toContain('John Doe')
    })
  })

  describe('generateNewOrderEmailForCustomer', () => {
    it('generates email with correct subject', () => {
      const result = generateNewOrderEmailForCustomer(mockOrderData)
      expect(result.subject).toBe('Order Inquiry Received: INQ-20260113-1234')
    })

    it('includes customer name in greeting', () => {
      const result = generateNewOrderEmailForCustomer(mockOrderData)
      expect(result.html).toContain('John Doe')
    })

    it('includes inquiry number', () => {
      const result = generateNewOrderEmailForCustomer(mockOrderData)
      expect(result.html).toContain('INQ-20260113-1234')
    })

    it('includes order summary with items', () => {
      const result = generateNewOrderEmailForCustomer(mockOrderData)
      expect(result.html).toContain('Indica Strain A')
      expect(result.html).toContain('Sativa Strain B')
      expect(result.html).toContain('15')
      expect(result.html).toContain('475.00')
    })

    it('includes next steps information', () => {
      const result = generateNewOrderEmailForCustomer(mockOrderData)
      expect(result.html).toContain('What happens next')
    })

    it('includes plain text version', () => {
      const result = generateNewOrderEmailForCustomer(mockOrderData)
      expect(result.text).toBeTruthy()
      expect(result.text).toContain('INQ-20260113-1234')
    })
  })

  describe('generateOrderStatusUpdateEmail', () => {
    it('generates email for pending status', () => {
      const result = generateOrderStatusUpdateEmail({
        ...mockOrderData,
        status: 'pending',
        statusMessage: 'Your order is being reviewed',
      })
      expect(result.subject).toContain('Order Update')
      expect(result.html).toContain('pending')
      expect(result.html).toContain('Your order is being reviewed')
    })

    it('generates email for approved status', () => {
      const result = generateOrderStatusUpdateEmail({
        ...mockOrderData,
        status: 'approved',
        statusMessage: 'Your order has been approved',
      })
      expect(result.subject).toContain('Order Update')
      expect(result.html).toContain('approved')
      expect(result.html).toContain('Your order has been approved')
    })

    it('generates email for rejected status', () => {
      const result = generateOrderStatusUpdateEmail({
        ...mockOrderData,
        status: 'rejected',
        statusMessage: 'Unfortunately, we cannot fulfill this order',
      })
      expect(result.subject).toContain('Order Update')
      expect(result.html).toContain('rejected')
      expect(result.html).toContain('Unfortunately, we cannot fulfill this order')
    })

    it('includes inquiry number', () => {
      const result = generateOrderStatusUpdateEmail({
        ...mockOrderData,
        status: 'approved',
        statusMessage: 'Approved',
      })
      expect(result.html).toContain('INQ-20260113-1234')
    })

    it('includes customer name', () => {
      const result = generateOrderStatusUpdateEmail({
        ...mockOrderData,
        status: 'approved',
        statusMessage: 'Approved',
      })
      expect(result.html).toContain('John Doe')
    })

    it('includes plain text version', () => {
      const result = generateOrderStatusUpdateEmail({
        ...mockOrderData,
        status: 'approved',
        statusMessage: 'Approved',
      })
      expect(result.text).toBeTruthy()
      expect(result.text).toContain('INQ-20260113-1234')
    })
  })
})
