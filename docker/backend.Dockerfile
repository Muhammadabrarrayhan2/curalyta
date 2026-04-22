# ============================================================
# Curalyta Backend — Multi-stage Dockerfile
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY backend/package.json ./backend/package.json
COPY package.json package-lock.json* ./
RUN npm install --workspaces=false --prefix backend --no-audit --no-fund

# ---------- Builder ----------
FROM base AS builder
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# ---------- Production runtime ----------
FROM base AS runner
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 curalyta

WORKDIR /app/backend

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/docker-entrypoint.sh ./docker-entrypoint.sh

# Upload directory (will be mounted as volume in compose)
RUN mkdir -p uploads \
  && chown -R curalyta:nodejs uploads \
  && chmod +x docker-entrypoint.sh

USER curalyta

EXPOSE 4000

# Auto-migrate + auto-seed admin + start server
ENTRYPOINT ["./docker-entrypoint.sh"]
