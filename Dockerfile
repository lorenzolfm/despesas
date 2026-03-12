# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine
WORKDIR /app
RUN addgroup -S nodejs && adduser -S sveltekit -G nodejs
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
USER sveltekit
EXPOSE 3000
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
CMD ["node", "build"]
