export default ({ env }) => ({
  // Resend configuration
  resendApiKey: env('RESEND_API_KEY'),
  resendFromEmail: env('RESEND_FROM_EMAIL', 'onboarding@resend.dev'),

  // Email settings
  adminRecipients: env.array('EMAIL_ADMIN_RECIPIENTS', ['admin@bcflame.com']),

  // SMTP configuration (LEGACY - deprecated, kept for backward compatibility)
  smtpHost: env('SMTP_HOST', 'localhost'),
  smtpPort: env.int('SMTP_PORT', 587),
  smtpSecure: env.bool('SMTP_SECURE', false),
  smtpUser: env('SMTP_USER'),
  smtpPass: env('SMTP_PASS'),
  fromName: env('EMAIL_FROM_NAME', 'BC Flame'),
  fromAddress: env('EMAIL_FROM_ADDRESS', 'noreply@bcflame.com'),
})
