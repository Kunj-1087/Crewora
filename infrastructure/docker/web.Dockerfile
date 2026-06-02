# Multi-stage production Dockerfile for Next.js website

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.js ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/ ./packages/shared/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/ui/tsconfig.json ./packages/ui/
COPY packages/ui/ ./packages/ui/
COPY packages/api-client/package*.json ./packages/api-client/
COPY packages/api-client/tsconfig.json ./packages/api-client/
COPY packages/api-client/ ./packages/api-client/
RUN npm ci
COPY apps/web/ ./apps/web/
RUN npm run build --workspace=@crewora/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/api-client/package*.json ./packages/api-client/
RUN npm ci --only=production
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@crewora/web"]
