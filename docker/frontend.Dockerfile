# ============================================================
# Curalyta Frontend — Multi-stage build with nginx
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY frontend/package.json ./frontend/package.json
COPY package.json package-lock.json* ./
RUN npm install --workspaces=false --prefix frontend --no-audit --no-fund

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

# ---------- nginx runtime ----------
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
