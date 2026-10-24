#!/bin/sh
# ============================================================
# Curalyta backend entrypoint
#
# Runs on every container start:
#   1. Apply pending Prisma migrations (prisma migrate deploy, idempotent)
#   2. Start the Node server
#      (server.ts ensures the default admin exists at startup)
# ============================================================

set -e

echo "[curalyta] Starting backend..."
echo "[curalyta] Node version: $(node --version)"
echo "[curalyta] Environment:  ${NODE_ENV:-development}"

# Prisma's schema declares directUrl; without a pooler it equals DATABASE_URL.
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

# ---- 1. Apply database migrations ----
echo "[curalyta] Applying database migrations (prisma migrate deploy)..."
attempt=1
until npx --no-install prisma migrate deploy; do
  if [ "$attempt" -ge 5 ]; then
    echo "[curalyta] Migration failed after $attempt attempts" >&2
    exit 1
  fi
  echo "[curalyta] Migration attempt $attempt failed, retrying in 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

# ---- 2. Start server ----
echo "[curalyta] Starting API server on port ${PORT:-4000}..."
exec node dist/server.js
