/**
 * Email controller
 * Provides health check and test endpoints for email service
 */

import { EmailService } from '../../../services/email';

export default {
  /**
   * Health check endpoint - tests SMTP connection
   * GET /api/email/health
   */
  async health(ctx) {
    try {
      const emailService = EmailService.getInstance();
      const isConnected = await emailService.verifyConnection();

      if (isConnected) {
        ctx.send({
          status: 'ok',
          message: 'Email service is properly configured and can connect to SMTP server',
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
          },
        });
      } else {
        ctx.status = 503;
        ctx.send({
          status: 'error',
          message: 'Cannot connect to SMTP server. Please check your email configuration.',
        });
      }
    } catch (error) {
      ctx.status = 500;
      ctx.send({
        status: 'error',
        message: 'Email service health check failed',
        error: error.message,
      });
    }
  },

  /**
   * Test email endpoint - sends a test email
   * POST /api/email/test
   * Body: { to: string, subject?: string }
   */
  async test(ctx) {
    const user = ctx.state.user;

    // Only admins can send test emails
    if (!user || user.userType !== 'admin') {
      return ctx.forbidden('Admin access required');
    }

    try {
      const { to, subject } = ctx.request.body;

      if (!to) {
        ctx.status = 400;
        ctx.send({
          status: 'error',
          message: 'Recipient email address is required',
        });
        return;
      }

      const emailService = EmailService.getInstance();

      // Send test email
      const result = await emailService.sendEmail({
        to,
        subject: subject || 'BC Flame - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Service Test</h2>
            <p>This is a test email from the BC Flame Premium Client Portal.</p>
            <p>If you received this email, the email service is working correctly!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="color: #666; font-size: 12px;">
              Sent at: ${new Date().toISOString()}<br />
              From: ${process.env.EMAIL_FROM_NAME} &lt;${process.env.EMAIL_FROM_ADDRESS}&gt;<br />
              SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}
            </p>
          </div>
        `,
        text: `Email Service Test\n\nThis is a test email from the BC Flame Premium Client Portal.\n\nIf you received this email, the email service is working correctly!\n\nSent at: ${new Date().toISOString()}`,
      });

      ctx.send({
        status: 'success',
        message: `Test email sent successfully to ${to}`,
        messageId: result.messageId,
      });
    } catch (error) {
      ctx.status = 500;
      ctx.send({
        status: 'error',
        message: 'Failed to send test email',
        error: error.message,
      });
    }
  },
};
