#!/bin/sh
# ============================================================
# Curalyta backend entrypoint
#
# Runs on every container start:
#   1. Apply pending Prisma migrations (idempotent)
#   2. Start the Node server
#      (server.ts automatically ensures default admin exists at startup)
# ============================================================

set -e

echo "[curalyta] Starting backend..."
echo "[curalyta] Node version: $(node --version)"
echo "[curalyta] Environment:  ${NODE_ENV:-development}"

# ---- 1. Apply database migrations ----
echo "[curalyta] Applying database migrations..."
npx prisma migrate deploy

# ---- 2. Start server (auto-seeds admin on first run) ----
echo "[curalyta] Starting API server on port ${PORT:-4000}..."
exec node dist/server.js
