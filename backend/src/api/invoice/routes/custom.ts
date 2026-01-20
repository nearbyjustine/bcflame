/**
 * Custom routes for invoice
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/invoices/generate',
      handler: 'invoice.generate',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/invoices/regenerate',
      handler: 'invoice.regenerate',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/invoices/order/:orderId/history',
      handler: 'invoice.getHistory',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/invoices/:id/send',
      handler: 'invoice.sendEmail',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/invoices/:id/pdf',
      handler: 'invoice.downloadPdf',
      config: {
        policies: [],
      },
    },
  ],
};
