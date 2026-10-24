# ============================================================
# Curalyta Frontend — production image
#
# Builds the Vite SPA, then serves static files with the unprivileged
# nginx image (runs as non-root user "nginx", listens on 8080).
# The same image is used behind the Nginx reverse proxy on the VM and
# on Cloud Run (which injects PORT=8080).
# ============================================================

ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace=frontend --include-workspace-root=false --no-audit --no-fund

FROM deps AS build
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

# ---------- Runtime ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

# API_UPSTREAM: where /api is proxied. Empty = the reverse proxy in front
# already routes /api (VM). On Cloud Run it is the production API origin.
ENV API_UPSTREAM="" \
    PORT=8080

COPY --chown=nginx:nginx docker/frontend/default.conf.template /etc/nginx/templates/default.conf.template
COPY --chown=nginx:nginx --chmod=0755 docker/frontend/40-api-upstream.sh /docker-entrypoint.d/40-api-upstream.sh
COPY --from=build --chown=nginx:nginx /app/frontend/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/healthz" || exit 1
