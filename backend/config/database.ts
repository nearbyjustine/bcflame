export default ({ env }) => {
  // Railway provides DATABASE_URL, parse if available
  const databaseUrl = env('DATABASE_URL');

  if (databaseUrl) {
    // Parse Railway's DATABASE_URL
    const url = new URL(databaseUrl);
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: url.hostname,
          port: parseInt(url.port, 10),
          database: url.pathname.slice(1), // Remove leading '/'
          user: url.username,
          password: url.password,
          ssl: env.bool('DATABASE_SSL', true) ? { rejectUnauthorized: false } : false,
        },
        debug: false,
      },
    };
  }

  // Fallback to individual environment variables (local development)
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', env('DB_HOST', 'localhost')),
        port: env.int('DATABASE_PORT', env.int('DB_PORT', 5432)),
        database: env('DATABASE_NAME', env('DB_NAME', 'bcflame_db')),
        user: env('DATABASE_USERNAME', env('DB_USER', 'bcflame')),
        password: env('DATABASE_PASSWORD', env('DB_PASSWORD', 'bcflame_dev_password')),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        },
      },
      debug: false,
    },
  };
};
