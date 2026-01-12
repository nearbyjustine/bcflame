import { generateInquiryNumber } from '../../services/inquiry-number';

export default {
  async beforeCreate(event) {
    const { data } = event.params;

    // Auto-generate inquiry number if not provided
    if (!data.inquiry_number) {
      data.inquiry_number = generateInquiryNumber();
    }

    // Auto-set customer from authenticated user if not provided
    if (!data.customer && event.state?.user) {
      data.customer = event.state.user.id;
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // TODO: Implement email notification service
    // For now, just log the inquiry creation
    strapi.log.info(`Order inquiry created: ${result.inquiry_number}`);

    // Email functionality to be implemented:
    // - Fetch customer details (email, name)
    // - Fetch admin email from config
    // - Fetch product details
    // - Send email to customer with inquiry details
    // - Send email to admin with notification
    //
    // Example:
    // await strapi.plugins['email'].services.email.send({
    //   to: customerEmail,
    //   subject: `Order Inquiry ${result.inquiry_number} Received`,
    //   text: 'Your order inquiry has been received...',
    // });
  },
};
