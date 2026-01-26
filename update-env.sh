#!/bin/bash

# Define the target file
ENV_FILE=".env.production"

# Check if the file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    echo "Please make sure you are in the root directory and $ENV_FILE exists."
    exit 1
fi

echo "Updating $ENV_FILE with new domain values..."

# DOMAIN: bcflame.online

# 1. Update NEXT_PUBLIC_SITE_URL
if grep -q "NEXT_PUBLIC_SITE_URL=" "$ENV_FILE"; then
    sed -i \
    's|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://bcflame.online|g' \
    "$ENV_FILE"
else
    echo "NEXT_PUBLIC_SITE_URL=https://bcflame.online" >> "$ENV_FILE"
fi

# 2. Update NEXT_PUBLIC_STRAPI_URL
if grep -q "NEXT_PUBLIC_STRAPI_URL=" "$ENV_FILE"; then
    sed -i \
    's|NEXT_PUBLIC_STRAPI_URL=.*|NEXT_PUBLIC_STRAPI_URL=https://api.bcflame.online|g' \
    "$ENV_FILE"
else
    echo "NEXT_PUBLIC_STRAPI_URL=https://api.bcflame.online" >> "$ENV_FILE"
fi

# 3. Update CORS_ORIGINS
if grep -q "CORS_ORIGINS=" "$ENV_FILE"; then
    sed -i \
    's|CORS_ORIGINS=.*|CORS_ORIGINS=https://bcflame.online,https://www.bcflame.online|g' \
    "$ENV_FILE"
else
    echo "CORS_ORIGINS=https://bcflame.online,https://www.bcflame.online" >> "$ENV_FILE"
fi

echo "✅ Environment variables updated successfully!"
echo "New values:"
grep "NEXT_PUBLIC_SITE_URL" "$ENV_FILE"
grep "NEXT_PUBLIC_STRAPI_URL" "$ENV_FILE"
grep "CORS_ORIGINS" "$ENV_FILE"
