import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getConversationForCustomer,
  createOrderPlacedMessage,
  createOrderStatusChangeMessage,
} from './order-message'

describe('Order Message Service', () => {
  let mockStrapi: any
  let mockDb: any
  let mockIo: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Socket.IO
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    }

    // Mock database query responses
    mockDb = {
      query: vi.fn((entityName: string) => ({
        findOne: vi.fn().mockImplementation((options) => {
          // Handle conversation queries
          if (entityName === 'api::conversation.conversation') {
            return Promise.resolve({
              id: 1,
              participant_admin: { id: 10 },
              participant_partner: { id: 20 },
              status: 'active',
              unreadCount_admin: 0,
              unreadCount_partner: 0,
            })
          }
          // Handle admin user queries
          if (entityName === 'plugin::users-permissions.user') {
            return Promise.resolve({
              id: 10,
              username: 'admin',
              userType: 'admin',
            })
          }
          // Handle order queries
          if (entityName === 'api::order-inquiry.order-inquiry') {
            return Promise.resolve({
              id: 1,
              inquiry_number: 'INQ-20260123-0001',
              customer: { id: 20 },
            })
          }
          return Promise.resolve(null)
        }),
        create: vi.fn().mockImplementation(() => {
          return Promise.resolve({
            id: 1,
            participant_admin: { id: 10 },
            participant_partner: { id: 20 },
            status: 'active',
            unreadCount_admin: 0,
            unreadCount_partner: 0,
          })
        }),
        update: vi.fn().mockResolvedValue({}),
      })),
    }

    // Mock Strapi global
    mockStrapi = {
      db: mockDb,
      io: mockIo,
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }

    // Set global strapi
    global.strapi = mockStrapi
  })

  describe('getConversationForCustomer', () => {
    it('should return existing active conversation for customer', async () => {
      const customerId = 20
      const conversation = await getConversationForCustomer(customerId)

      expect(conversation).toBeDefined()
      expect(conversation?.id).toBe(1)
      expect(mockDb.query).toHaveBeenCalledWith('api::conversation.conversation')
    })

    it('should create new conversation if none exists', async () => {
      // Mock no existing conversation
      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockImplementation((options) => {
          if (entityName === 'api::conversation.conversation') {
            return Promise.resolve(null)
          }
          if (entityName === 'plugin::users-permissions.user') {
            return Promise.resolve({
              id: 10,
              username: 'admin',
              userType: 'admin',
            })
          }
          return Promise.resolve(null)
        }),
        create: vi.fn().mockResolvedValue({
          id: 2,
          participant_admin: { id: 10 },
          participant_partner: { id: 20 },
          status: 'active',
          unreadCount_admin: 0,
          unreadCount_partner: 0,
        }),
      }))

      mockStrapi.db = mockDb

      const customerId = 20
      const conversation = await getConversationForCustomer(customerId)

      expect(conversation).toBeDefined()
      expect(conversation?.id).toBe(2)
    })

    it('should return null if no admin user exists', async () => {
      // Mock no conversation and no admin user
      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      }))

      mockStrapi.db = mockDb

      const conversation = await getConversationForCustomer(20)

      expect(conversation).toBeNull()
      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        'No admin user found to create conversation'
      )
    })
  })

  describe('createOrderPlacedMessage', () => {
    it('should create order placed message with correct format', async () => {
      const orderId = 1
      const customerId = 20

      await createOrderPlacedMessage(orderId, customerId)

      // Verify message was created
      expect(mockDb.query).toHaveBeenCalledWith('api::message.message')

      // Verify Socket.IO emission
      expect(mockIo.to).toHaveBeenCalledWith('conversation:1')
      expect(mockIo.emit).toHaveBeenCalledWith(
        'message:new',
        expect.objectContaining({
          conversationId: 1,
        })
      )

      expect(mockIo.to).toHaveBeenCalledWith('user:20')
      expect(mockIo.emit).toHaveBeenCalledWith(
        'conversation:unread',
        expect.objectContaining({
          conversationId: 1,
        })
      )
    })

    it('should log warning if order not found', async () => {
      // Mock order not found
      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockResolvedValue(null),
      }))

      mockStrapi.db = mockDb

      await createOrderPlacedMessage(999, 20)

      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('Order 999 not found')
      )
    })

    it('should handle missing inquiry_number gracefully', async () => {
      // Mock order without inquiry_number
      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockImplementation(() => {
          if (entityName === 'api::order-inquiry.order-inquiry') {
            return Promise.resolve({ id: 1 }) // Missing inquiry_number
          }
          return Promise.resolve(null)
        }),
      }))

      mockStrapi.db = mockDb

      await createOrderPlacedMessage(1, 20)

      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing inquiry_number')
      )
    })

    it('should not throw error if conversation creation fails', async () => {
      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockImplementation(() => {
          if (entityName === 'api::order-inquiry.order-inquiry') {
            return Promise.resolve({
              id: 1,
              inquiry_number: 'INQ-123',
              customer: { id: 20 },
            })
          }
          return Promise.resolve(null)
        }),
      }))

      mockStrapi.db = mockDb

      // Should not throw
      await expect(createOrderPlacedMessage(1, 20)).resolves.toBeUndefined()

      expect(mockStrapi.log.error).toHaveBeenCalled()
    })
  })

  describe('createOrderStatusChangeMessage', () => {
    it('should create status change message with correct format', async () => {
      const orderId = 1
      const oldStatus = 'pending'
      const newStatus = 'approved'

      await createOrderStatusChangeMessage(orderId, oldStatus, newStatus)

      // Verify message was created
      expect(mockDb.query).toHaveBeenCalledWith('api::message.message')

      // Verify Socket.IO emission
      expect(mockIo.to).toHaveBeenCalledWith('conversation:1')
      expect(mockIo.emit).toHaveBeenCalledWith('message:new', expect.any(Object))

      expect(mockStrapi.log.info).toHaveBeenCalledWith(
        expect.stringContaining('pending → approved')
      )
    })

    it('should capitalize status in message content', async () => {
      const orderId = 1
      const oldStatus = 'pending'
      const newStatus = 'reviewing'

      // Mock to capture the create call
      const createSpy = vi.fn().mockResolvedValue({
        id: 1,
        content: '',
      })

      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockImplementation(() => {
          if (entityName === 'api::order-inquiry.order-inquiry') {
            return Promise.resolve({
              id: 1,
              inquiry_number: 'INQ-123',
              customer: { id: 20 },
            })
          }
          if (entityName === 'api::conversation.conversation') {
            return Promise.resolve({
              id: 1,
              participant_admin: { id: 10 },
              participant_partner: { id: 20 },
              unreadCount_partner: 0,
            })
          }
          return Promise.resolve(null)
        }),
        create: createSpy,
        update: vi.fn().mockResolvedValue({}),
      }))

      mockStrapi.db = mockDb

      await createOrderStatusChangeMessage(orderId, oldStatus, newStatus)

      // Verify the message content was properly formatted
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: expect.stringContaining('Reviewing'), // Capitalized
          }),
        })
      )
    })

    it('should log warning if order not found', async () => {
      mockDb.query = vi.fn((entityName: string) => ({
        findOne: vi.fn().mockResolvedValue(null),
      }))

      mockStrapi.db = mockDb

      await createOrderStatusChangeMessage(999, 'pending', 'approved')

      expect(mockStrapi.log.warn).toHaveBeenCalledWith(
        expect.stringContaining('Order 999 not found')
      )
    })

    it('should not throw error on failure', async () => {
      mockDb.query = vi.fn(() => ({
        findOne: vi.fn().mockRejectedValue(new Error('Database error')),
      }))

      mockStrapi.db = mockDb

      // Should not throw
      await expect(
        createOrderStatusChangeMessage(1, 'pending', 'approved')
      ).resolves.toBeUndefined()

      expect(mockStrapi.log.error).toHaveBeenCalled()
    })
  })
})
