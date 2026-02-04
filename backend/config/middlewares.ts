export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'global::correlation-id',
    config: {},
  },
  {
    name: 'global::logging',
    config: {
      skipPaths: ['/_health', '/admin'],
    },
  },
  'global::log-user-context',
  'global::rate-limit',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:', 'blob:'],
          'script-src': ["'self'", "'unsafe-inline'", 'blob:', 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'res.cloudinary.com',
            'https:',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            'res.cloudinary.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:1337')
        .split(',')
        .map(origin => origin.trim()),
      credentials: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
