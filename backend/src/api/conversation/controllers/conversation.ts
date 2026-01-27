import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::conversation.conversation',
  ({ strapi }) => ({
    // Find all conversations for current user
    async find(ctx) {
      const user = ctx.state.user;

      const conversations = await strapi.db.query('api::conversation.conversation').findMany({
        where: {
          $or: [
            { participant_admin: user.id },
            { participant_partner: user.id },
          ],
          status: 'active',
        },
        populate: {
          participant_admin: {
            select: ['id', 'username', 'email', 'company', 'userType'],
          },
          participant_partner: {
            select: ['id', 'username', 'email', 'company', 'userType'],
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      return { data: conversations };
    },

    // Find single conversation with messages
    async findOne(ctx) {
      const { id } = ctx.params;
      const user = ctx.state.user;

      const conversation = await strapi.db.query('api::conversation.conversation').findOne({
        where: { id },
        populate: {
          participant_admin: {
            select: ['id', 'username', 'email', 'company', 'userType'],
          },
          participant_partner: {
            select: ['id', 'username', 'email', 'company', 'userType'],
          },
          messages: {
            populate: {
              sender: {
                select: ['id', 'username', 'userType'],
              },
              relatedOrder: {
                select: ['id', 'inquiry_number'],
              },
            },
            orderBy: { createdAt: 'asc' },
            limit: 100, // Last 100 messages
          },
        },
      });

      if (!conversation) {
        return ctx.notFound('Conversation not found');
      }

      // Verify user is a participant
      if (
        conversation.participant_admin.id !== user.id &&
        conversation.participant_partner.id !== user.id &&
        user.userType !== 'admin'
      ) {
        return ctx.forbidden('Access denied');
      }

      return { data: conversation };
    },

    // Find or create conversation with specific user
    async findOrCreate(ctx) {
      try {
        const { userId } = ctx.params;
        const currentUser = ctx.state.user;

        if (!currentUser) {
          return ctx.unauthorized('You must be logged in');
        }

        const targetUserId = parseInt(userId);

        // Prevent self-conversation
        if (targetUserId === currentUser.id) {
          return ctx.badRequest('Cannot create conversation with yourself');
        }

        // Fetch target user using strapi.db.query
        const targetUser = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: targetUserId },
          select: ['id', 'userType', 'username'],
        });

        if (!targetUser) {
          return ctx.notFound('User not found');
        }

        // Determine admin and partner
        // We need to handle cases where userType might be missing (default to reseller behavior if not admin)
        const currentUserIsAdmin = currentUser.userType === 'admin';
        const targetUserIsAdmin = targetUser.userType === 'admin';

        let adminId, partnerId;

        if (currentUserIsAdmin) {
          adminId = currentUser.id;
          partnerId = targetUser.id;
        } else if (targetUserIsAdmin) {
          adminId = targetUser.id;
          partnerId = currentUser.id;
        } else {
          // Fallback: If neither is strictly 'admin' type, 
          // check if we can conceptually treat one as admin based on context or allow it?
          // For now, fail as per requirements "Conversation must include an admin user"
          // BUT - if the system has a "Main Admin", maybe we should find them?
          // For now, strict check:
          return ctx.badRequest('Conversation must be between a reseller and an admin');
        }

        // Check if conversation exists
        let conversation = await strapi.db.query('api::conversation.conversation').findOne({
          where: {
            participant_admin: adminId,
            participant_partner: partnerId,
          },
          populate: {
            participant_admin: {
              select: ['id', 'username', 'email', 'company', 'userType'],
            },
            participant_partner: {
              select: ['id', 'username', 'email', 'company', 'userType'],
            },
          },
        });

        // Create if doesn't exist
        if (!conversation) {
          strapi.log.info(`Creating new conversation between Admin ${adminId} and Partner ${partnerId}`);
          conversation = await strapi.db.query('api::conversation.conversation').create({
            data: {
              participant_admin: adminId,
              participant_partner: partnerId,
              status: 'active',
              lastMessageAt: new Date(),
              lastMessagePreview: 'Conversation started',
              unreadCount_admin: 0,
              unreadCount_partner: 0,
            },
            populate: {
              participant_admin: {
                select: ['id', 'username', 'email', 'company', 'userType'],
              },
              participant_partner: {
                select: ['id', 'username', 'email', 'company', 'userType'],
              },
            },
          });
        }

        return { data: conversation };
      } catch (error) {
        strapi.log.error('Error in findOrCreate conversation:', error);
        return ctx.internalServerError('Failed to start conversation');
      }
    },

    // Mark conversation as read
    async markAsRead(ctx) {
      try {
        const { id } = ctx.params;
        const user = ctx.state.user;

        // Fetch conversation with populated participants to check ID
        const conversation = await strapi.db.query('api::conversation.conversation').findOne({
          where: { id },
          populate: ['participant_admin', 'participant_partner'],
        });

        if (!conversation) {
          return ctx.notFound('Conversation not found');
        }

        // Determine which unread count to reset
        // Relationship fields might be returned as objects or IDs depending on population
        // strapi.db.query with populate returns objects
        
        const adminId = conversation.participant_admin?.id || conversation.participant_admin;
        const partnerId = conversation.participant_partner?.id || conversation.participant_partner;

        const updateData: any = {};
        if (adminId === user.id) {
          updateData.unreadCount_admin = 0;
        } else if (partnerId === user.id) {
          updateData.unreadCount_partner = 0;
        } else if (user.userType === 'admin') {
           // Allow any admin to mark as read, assuming they are acting as the admin participant
           updateData.unreadCount_admin = 0;
        } else {
          return ctx.forbidden('Access denied');
        }

        // Mark messages as read - Step 1: Find unread messages not from current user
        const unreadMessages = await strapi.db.query('api::message.message').findMany({
          where: {
            conversation: id,
            sender: {
              id: { $ne: user.id },
            },
            isRead: false,
          },
          select: ['id'],
        });

        // Step 2: Update found messages
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(m => m.id);
          await strapi.db.query('api::message.message').updateMany({
            where: {
              id: { $in: messageIds },
            },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          });
        }

        // Update conversation unread count
        await strapi.db.query('api::conversation.conversation').update({
          where: { id },
          data: updateData,
        });

        return { success: true };
      } catch (error) {
        strapi.log.error('Error in markAsRead:', error);
        return ctx.internalServerError('Failed to mark conversation as read');
      }
    },

    // Get total unread count for user
    async getUnreadCount(ctx) {
      const user = ctx.state.user;

      const conversations = await strapi.db.query('api::conversation.conversation').findMany({
        where: {
          $or: [
            { participant_admin: user.id },
            { participant_partner: user.id },
          ],
          status: 'active',
        },
        select: ['id', 'participant_admin', 'unreadCount_admin', 'unreadCount_partner'],
      });

      let totalUnread = 0;
      conversations.forEach((conv) => {
        if (conv.participant_admin === user.id) {
          totalUnread += conv.unreadCount_admin || 0;
        } else {
          totalUnread += conv.unreadCount_partner || 0;
        }
      });

      return { unreadCount: totalUnread };
    },

    // Get all orders for the partner in this conversation
    async getPartnerOrders(ctx) {
      try {
        const { id } = ctx.params;
        const user = ctx.state.user;
        const { status } = ctx.query;

        // Get conversation and verify access (admin only)
        const conversation = await strapi.db.query('api::conversation.conversation').findOne({
          where: { id },
          populate: {
            participant_admin: { select: ['id'] },
            participant_partner: { select: ['id'] },
          },
        });

        if (!conversation) {
          return ctx.notFound('Conversation not found');
        }

        // Verify user is admin and participant
        const adminId = conversation.participant_admin?.id || conversation.participant_admin;

        if (user.userType !== 'admin') {
          return ctx.forbidden('Only admins can view partner orders');
        }

        if (adminId !== user.id) {
          return ctx.forbidden('Access denied');
        }

        // Get partnerId
        const partnerId = conversation.participant_partner?.id || conversation.participant_partner;

        // Build where clause
        const where: any = { customer: partnerId };
        if (status) {
          where.status = status;
        }

        // Fetch orders with product info
        const orders = await strapi.db.query('api::order-inquiry.order-inquiry').findMany({
          where,
          populate: {
            product: {
              select: ['id', 'name', 'sku'],
              populate: {
                images: {
                  select: ['id', 'url', 'alternativeText'],
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          limit: 50,
        });

        return { data: orders };
      } catch (error) {
        strapi.log.error('Error in getPartnerOrders:', error);
        return ctx.internalServerError('Failed to fetch partner orders');
      }
    },
  })
);
