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
