FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 1337
CMD ["npm", "run", "develop"]

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strapi
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
USER strapi
EXPOSE 1337
CMD ["npm", "run", "start"]
