#!/bin/sh
set -e

echo "🚀 Starting BC Flame Strapi in production mode..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
timeout=30
# Check if database needs seeding (first time setup)
if [ "$SEED_DATA" = "true" ]; then
    echo "🌱 Seeding database..."
    # Seeding needs to run before the main server starts because it spins up its own Strapi instance
    npm run seed || echo "⚠️ Seeding failed"
fi

echo "🚀 Starting Strapi Server..."
exec npm run start
