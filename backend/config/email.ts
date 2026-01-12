export default ({ env }) => ({
  adminRecipients: env.array('EMAIL_ADMIN_RECIPIENTS', ['admin@bcflame.com']),
})
