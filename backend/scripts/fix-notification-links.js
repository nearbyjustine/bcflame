/**
 * Script to fix notification links for admin users
 * Run with: npm run strapi -- scripts:fix-notification-links
 */

module.exports = async ({ strapi }) => {
  console.log('🔧 Fixing notification links for admin users...');

  try {
    // Find all message notifications with /messages/ links (reseller links)
    const notifications = await strapi.db
      .query('api::notification.notification')
      .findMany({
        where: {
          type: 'new_message',
          link: {
            $contains: '/messages/',
            $notContains: '/admin-portal/',
          },
        },
        populate: ['recipient'],
      });

    console.log(`Found ${notifications.length} notifications to check`);

    let fixed = 0;

    for (const notification of notifications) {
      const recipient = notification.recipient;

      if (!recipient) {
        console.log(`Skipping notification ${notification.id} - no recipient`);
        continue;
      }

      const recipientId =
        typeof recipient === 'object' ? recipient.id : recipient;

      // Fetch user to check userType
      const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({
          where: { id: recipientId },
          select: ['id', 'username', 'userType'],
        });

      if (user?.userType === 'admin') {
        // This is an admin user with a reseller link - fix it
        const conversationId = notification.link.split('/messages/')[1];
        const newLink = `/admin-portal/messages/${conversationId}`;

        await strapi.entityService.update(
          'api::notification.notification',
          notification.id,
          {
            data: { link: newLink },
          }
        );

        console.log(
          `✅ Fixed notification ${notification.id} for admin ${user.username}: ${notification.link} → ${newLink}`
        );
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} notification links`);
  } catch (error) {
    console.error('❌ Error fixing notification links:', error);
  }
};
