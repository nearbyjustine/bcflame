#!/bin/sh
set -e

echo "🚀 Starting BC Flame Strapi in production mode..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
timeout=30
while ! wget --spider -q http://localhost:1337/_health 2>/dev/null && [ $timeout -gt 0 ]; do
    sleep 1
    timeout=$((timeout - 1))
done

# Check if database needs seeding (first time setup)
# This checks if any data exists in the database
echo "🔍 Checking if database needs seeding..."

# Start Strapi in background to allow seeding
npm run start &
STRAPI_PID=$!

# Wait for Strapi to be ready
sleep 10

# Run seed script if SEED_DATA env var is set to true
if [ "$SEED_DATA" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run seed || echo "⚠️ Seeding failed or already seeded"
fi

# Keep Strapi running in foreground
wait $STRAPI_PID
