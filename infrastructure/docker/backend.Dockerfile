# Multi-stage production Dockerfile for backend

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/ ./packages/shared/
RUN npm ci
COPY backend/ ./backend/
RUN npm run build --workspace=crewora-backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --only=production
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
EXPOSE 5000
CMD ["npm", "run", "start", "--workspace=crewora-backend"]
