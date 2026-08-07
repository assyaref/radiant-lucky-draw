# ============================================================
# RADIANT LUCKY DRAW - Backend Production Dockerfile
# ============================================================

# ─── Stage 1: Build ─────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install build dependencies for Prisma
RUN apk add --no-cache python3 make g++ openssl

# Copy dependency manifests
COPY package.json package-lock.json ./

# Copy Prisma schema and migrations (needed for postinstall prisma generate)
COPY prisma ./prisma

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client (idempotent; postinstall already ran it)
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production dependencies
COPY package.json package-lock.json ./

# Copy Prisma schema and migrations (needed for postinstall prisma generate)
COPY prisma ./prisma

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Generate Prisma client for production (idempotent; postinstall already ran it)
RUN npx prisma generate

# Copy built application
COPY --from=build /app/dist ./dist

# Set permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check (uses Railway-injected PORT; falls back to 3001)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f "http://localhost:${PORT:-3001}/api/health" || exit 1

# Start server.
# prisma migrate deploy runs first to ensure the schema is synchronized.
# This covers the case where the CI migration step was skipped because
# GitHub Actions cannot reach the Railway database (IP restriction).
# The command is idempotent — it only applies pending migrations.
CMD ["sh", "-c", "npx prisma migrate deploy; npm start"]