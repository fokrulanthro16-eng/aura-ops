# ==============================================================================
# Production Multi-Stage Dockerfile for AURA-OPS
# Meta VR Start Developer Competition 2026
# WebXR 6-Axis Industrial Digital Twin & Autonomous Telemetry Engine
# ==============================================================================

# --- Stage 1: Dependency Installation ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit

# --- Stage 2: Application Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compile Next.js with standalone output
RUN npm run build

# --- Stage 3: Minimal Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Create unprivileged system user for hardened container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Container healthcheck testing the 3-Tier AI diagnostic endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f -X POST http://localhost:3000/api/diagnostics \
      -H "Content-Type: application/json" \
      -d '{"coreTemp":45,"vibration":1.0,"spindleRpm":1400,"jointAngles":{},"status":"NORMAL"}' || exit 1

CMD ["node", "server.js"]
