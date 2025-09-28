FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG AUTH_SERVICE_URL
ARG ORDERS_SERVICE_URL
ENV AUTH_SERVICE_URL=${AUTH_SERVICE_URL}
ENV ORDERS_SERVICE_URL=${ORDERS_SERVICE_URL}
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./
COPY postcss.config.mjs ./
EXPOSE 3000
CMD ["npm", "run", "start"]