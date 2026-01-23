/**
 * Order Message Service
 *
 * Centralized service for creating order-related automated messages in conversations.
 * Handles conversation finding/creation and Socket.IO event emission.
 */

interface ConversationData {
  id: number;
  participant_admin: any;
  participant_partner: any;
  unreadCount_admin: number;
  unreadCount_partner: number;
}

/**
 * Find an existing conversation for a customer or create a new one
 * @param customerId - The customer's user ID
 * @returns Conversation object with admin and partner info
 */
export async function getConversationForCustomer(customerId: number): Promise<ConversationData | null> {
  // 1. Check for existing conversation with this customer
  let conversation = await strapi.db.query('api::conversation.conversation').findOne({
    where: {
      participant_partner: customerId,
      status: 'active',
    },
    populate: ['participant_admin', 'participant_partner'],
  });

  if (conversation) {
    return conversation;
  }

  // 2. Find an admin user to assign to the conversation
  const adminUser = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { userType: 'admin' },
  });

  if (!adminUser) {
    strapi.log.warn('No admin user found to create conversation');
    return null;
  }

  // 3. Create new conversation
  conversation = await strapi.db.query('api::conversation.conversation').create({
    data: {
      participant_admin: adminUser.id,
      participant_partner: customerId,
      status: 'active',
      lastMessageAt: new Date(),
      lastMessagePreview: 'Conversation started',
      unreadCount_admin: 0,
      unreadCount_partner: 0,
    },
    populate: ['participant_admin', 'participant_partner'],
  });

  return conversation;
}

/**
 * Create an automated message when an order is placed
 * @param orderId - The order inquiry ID
 * @param customerId - The customer's user ID
 */
export async function createOrderPlacedMessage(orderId: number, customerId: number): Promise<void> {
  try {
    // Get the order to extract inquiry_number
    const order = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
      where: { id: orderId },
      select: ['id', 'inquiry_number'],
    });

    if (!order || !order.inquiry_number) {
      strapi.log.warn(`Order ${orderId} not found or missing inquiry_number`);
      return;
    }

    // Get or create conversation
    const conversation = await getConversationForCustomer(customerId);
    if (!conversation) {
      strapi.log.error(`Failed to get conversation for customer ${customerId}`);
      return;
    }

    const adminId = typeof conversation.participant_admin === 'object'
      ? conversation.participant_admin.id
      : conversation.participant_admin;

    // Create the message
    const messageContent = `Your order ${order.inquiry_number} has been placed and is being reviewed.`;

    const message = await strapi.db.query('api::message.message').create({
      data: {
        content: messageContent,
        conversation: conversation.id,
        sender: adminId,
        messageType: 'order_update',
        relatedOrder: orderId,
        isRead: false,
        readAt: null,
        publishedAt: new Date(),
      },
      populate: {
        sender: {
          select: ['id', 'username', 'userType'],
        },
        relatedOrder: {
          select: ['id', 'inquiry_number'],
        },
      },
    });

    // Update conversation metadata
    await strapi.db.query('api::conversation.conversation').update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: messageContent,
        unreadCount_partner: (conversation.unreadCount_partner || 0) + 1,
      },
    });

    // Emit Socket.IO events
    const io = strapi.io;
    if (io) {
      io.to(`conversation:${conversation.id}`).emit('message:new', {
        message,
        conversationId: conversation.id,
      });

      io.to(`user:${customerId}`).emit('conversation:unread', {
        conversationId: conversation.id,
        unreadCount: (conversation.unreadCount_partner || 0) + 1,
      });
    }

    strapi.log.info(`Created order placed message for order ${order.inquiry_number}`);
  } catch (error) {
    strapi.log.error('Failed to create order placed message:', error);
    // Don't throw - we don't want to fail the order creation if messaging fails
  }
}

/**
 * Create an automated message when an order status changes
 * @param orderId - The order inquiry ID
 * @param oldStatus - The previous status
 * @param newStatus - The new status
 */
export async function createOrderStatusChangeMessage(
  orderId: number,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    // Get the order with customer info
    const order = await strapi.db.query('api::order-inquiry.order-inquiry').findOne({
      where: { id: orderId },
      select: ['id', 'inquiry_number'],
      populate: {
        customer: {
          select: ['id'],
        },
      },
    });

    if (!order || !order.inquiry_number) {
      strapi.log.warn(`Order ${orderId} not found or missing inquiry_number`);
      return;
    }

    const customerId = typeof order.customer === 'object' ? order.customer.id : order.customer;

    // Get or create conversation
    const conversation = await getConversationForCustomer(customerId);
    if (!conversation) {
      strapi.log.error(`Failed to get conversation for customer ${customerId}`);
      return;
    }

    const adminId = typeof conversation.participant_admin === 'object'
      ? conversation.participant_admin.id
      : conversation.participant_admin;

    // Create the message
    const messageContent = `Order ${order.inquiry_number} status updated: ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`;

    const message = await strapi.db.query('api::message.message').create({
      data: {
        content: messageContent,
        conversation: conversation.id,
        sender: adminId,
        messageType: 'order_update',
        relatedOrder: orderId,
        isRead: false,
        readAt: null,
        publishedAt: new Date(),
      },
      populate: {
        sender: {
          select: ['id', 'username', 'userType'],
        },
        relatedOrder: {
          select: ['id', 'inquiry_number'],
        },
      },
    });

    // Update conversation metadata
    await strapi.db.query('api::conversation.conversation').update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: messageContent,
        unreadCount_partner: (conversation.unreadCount_partner || 0) + 1,
      },
    });

    // Emit Socket.IO events
    const io = strapi.io;
    if (io) {
      io.to(`conversation:${conversation.id}`).emit('message:new', {
        message,
        conversationId: conversation.id,
      });

      io.to(`user:${customerId}`).emit('conversation:unread', {
        conversationId: conversation.id,
        unreadCount: (conversation.unreadCount_partner || 0) + 1,
      });
    }

    strapi.log.info(`Created status change message for order ${order.inquiry_number}: ${oldStatus} → ${newStatus}`);
  } catch (error) {
    strapi.log.error('Failed to create order status change message:', error);
    // Don't throw - we don't want to fail the order update if messaging fails
  }
}
