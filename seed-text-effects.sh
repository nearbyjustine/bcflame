#!/bin/bash

# Seed Text Effects Script
# This script creates 5 text effects via Strapi's REST API

STRAPI_URL="http://localhost:1337"
API_TOKEN="YOUR_API_TOKEN_HERE"  # Get from Strapi Admin > Settings > API Tokens

echo "🌱 Seeding Text Effects..."
echo ""

# Effect 1: Bubbly Shadow (default)
curl -X POST "$STRAPI_URL/api/text-effects" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Bubbly Shadow",
      "description": "Multi-layered 3D text shadow with customizable colors creating a bubbly depth effect",
      "css_code": ".text {\n  position: relative;\n  margin: 0;\n  padding: 0;\n  font-family: \"Cubano\", monaco, courier;\n  font-size: var(--font-size, 120px);\n  font-weight: 400;\n  text-align: center;\n  font-style: normal;\n  color: aquamarine;\n  text-shadow: \n    -1px 0 #4b6b00, 0 1px #4b6b00, 1px 0 #4b6b00, 0 -1px #4b6b00,\n    -8px 8px #4b6b00, -7px 7px #4b6b00, -6px 6px #4b6b00, -5px 5px #4b6b00,\n    -4px 4px #4b6b00, -3px 3px #4b6b00, -2px 2px #4b6b00, -1px 1px #4b6b00;\n}",
      "html_structure": "<h1 class=\"text\">Your Text</h1>",
      "browser_support": "98%",
      "sort_order": 1,
      "is_default": true,
      "publishedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
    }
  }'

echo "✅ Created: Bubbly Shadow"

# Note: This is a template. You should create the remaining 4 effects via Strapi Admin UI
# or update this script with your API token

echo ""
echo "⚠️  Manual Seeding Recommended"
echo "For best results, create text effects via Strapi Admin:"
echo "1. Go to http://localhost:1337/admin"
echo "2. Navigate to Content Manager > Text Effect > Create new entry"
echo "3. Use the data from backend/src/seed-data/text-effects.json"
echo ""
