# ============================================================
# Curalyta Backend — production image
#
# Stages:
#   deps      : full install (incl. dev) from the workspace lockfile
#   build     : prisma generate + TypeScript compile
#   prod-deps : production-only dependencies (prisma CLI kept for migrations)
#   runner    : minimal runtime, non-root user, healthcheck
# ============================================================

ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

# ---------- Dependencies (with dev tools) ----------
FROM base AS deps
RUN npm ci --workspace=backend --include-workspace-root=false --no-audit --no-fund \
  && mkdir -p backend/node_modules

# ---------- Build ----------
FROM deps AS build
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate && npx tsc -p tsconfig.json && npx tsc-alias -p tsconfig.json

# ---------- Production dependencies ----------
FROM base AS prod-deps
COPY backend/prisma ./backend/prisma
RUN npm ci --workspace=backend --include-workspace-root=false --omit=dev --no-audit --no-fund \
  && mkdir -p backend/node_modules \
  && cd backend && npx prisma generate \
  && npm cache clean --force

# ---------- Runtime ----------
FROM ${NODE_IMAGE} AS runner
RUN apk add --no-cache openssl libc6-compat tini
ENV NODE_ENV=production \
    PORT=4000

RUN addgroup -S -g 1001 curalyta && adduser -S -u 1001 -G curalyta curalyta

WORKDIR /app
COPY --from=prod-deps --chown=curalyta:curalyta /app/node_modules ./node_modules
COPY --from=prod-deps --chown=curalyta:curalyta /app/backend/node_modules ./backend/node_modules
COPY --from=build --chown=curalyta:curalyta /app/backend/dist ./backend/dist
COPY --chown=curalyta:curalyta backend/prisma ./backend/prisma
COPY --chown=curalyta:curalyta backend/package.json ./backend/package.json
COPY --chown=curalyta:curalyta backend/docker-entrypoint.sh ./backend/docker-entrypoint.sh

WORKDIR /app/backend
RUN mkdir -p uploads && chown curalyta:curalyta uploads && chmod +x docker-entrypoint.sh

USER curalyta
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# tini reaps zombies and forwards SIGTERM for graceful shutdown
ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]
