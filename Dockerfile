# ============================================================
# RADIANT LUCKY DRAW - Production Dockerfile
# Multi-stage build: Frontend (Vite) + Backend (Express)
# ============================================================

# ─── Stage 1: Frontend Build ────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy frontend source
COPY . .

# Build frontend
RUN npm run build

# ─── Stage 2: Backend Build ─────────────────────────────────
FROM node:22-alpine AS backend-build

WORKDIR /app/backend

# Install build dependencies for Prisma
RUN apk add --no-cache python3 make g++ openssl

# Copy backend dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy backend source
COPY server/ .

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN npm run build

# ─── Stage 3: Production Image ──────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy backend build
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./
COPY --from=backend-build /app/backend/prisma ./prisma

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

# Set permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start server
CMD ["node", "dist/index.js"]
