/**
 * Payment reminder service
 * Creates notifications for overdue orders
 */

/**
 * Create payment reminders for approved orders older than 7 days
 * Prevents duplicate reminders within 3 days
 */
export async function createPaymentReminders() {
  try {
    // Find all approved orders that are overdue (7 days old)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueOrders = await strapi.db.query('api::order-inquiry.order-inquiry').findMany({
      where: {
        status: 'approved',
        createdAt: {
          $lt: sevenDaysAgo.toISOString(),
        },
      },
      populate: ['customer'],
    });

    let reminderCount = 0;

    for (const order of overdueOrders) {
      const customerId = typeof order.customer === 'object' ? order.customer.id : order.customer;

      // Check if reminder already sent recently (within 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const existingReminder = await strapi.db.query('api::notification.notification').findOne({
        where: {
          type: 'payment_reminder',
          relatedOrder: order.id,
          recipient: customerId,
          createdAt: {
            $gte: threeDaysAgo.toISOString(),
          },
        },
      });

      if (!existingReminder) {
        await strapi.entityService.create('api::notification.notification', {
          data: {
            type: 'payment_reminder',
            title: `Payment Reminder: ${order.inquiry_number}`,
            message: 'Your approved order is awaiting payment. Please complete your payment to proceed.',
            isRead: false,
            recipient: customerId,
            relatedOrder: order.id,
            link: `/orders/${order.id}`,
          },
        });

        reminderCount++;
        strapi.log.info(`Created payment reminder for order ${order.inquiry_number}`);
      }
    }

    strapi.log.info(`Payment reminder job completed. Created ${reminderCount} reminders for ${overdueOrders.length} overdue orders.`);

    return {
      success: true,
      overdueOrdersCount: overdueOrders.length,
      remindersCreated: reminderCount,
    };
  } catch (error) {
    strapi.log.error('Error creating payment reminders:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
