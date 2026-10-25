#!/usr/bin/env bash
# ============================================================
# app-vm-setup.sh — setup VM 101 curalyta-app (idempotent)
#
# Dijalankan sebagai root di VM aplikasi. Nilai rahasia dari luar
# diberikan lewat environment (tidak pernah ditulis ke repo):
#   GROQ_API_KEYS=... BACKUP_S3_ACCESS_KEY=... BACKUP_S3_SECRET_KEY=... \
#     bash ops/lab/app-vm-setup.sh
#
#   1. Docker Engine + Compose, rotasi log container
#   2. Repositori Curalyta di /opt/curalyta
#   3. .env produksi: password DB, JWT secret, password admin acak (izin 600)
#   4. Build image dan jalankan stack (nginx, frontend, backend, postgres)
#   5. cAdvisor untuk metrik per container
#   6. Cron backup database harian + logrotate
#   7. Patch keamanan otomatis (unattended-upgrades)
#   8. Cloudflare Tunnel: HTTPS publik tanpa membuka port router
# ============================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Muhammadabrarrayhan2/curalyta.git}"
APP_DIR=/opt/curalyta
LAB_DIR="$(dirname "$(readlink -f "$0")")"

step() { printf '\n==== %s ====\n' "$*"; }

step "1. Docker"
bash "$LAB_DIR/install-docker.sh"

step "2. Repositori"
# Repo dimiliki user curalyta; root perlu pengecualian safe.directory git
git config --system --get-all safe.directory 2>/dev/null | grep -qx "$APP_DIR" || \
  git config --system --add safe.directory "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --quiet "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --quiet --ff-only
fi
chown -R curalyta:curalyta "$APP_DIR"

step "3. Konfigurasi .env produksi"
rand() { openssl rand -hex "$1"; }
if [ ! -f "$APP_DIR/.env" ]; then
  umask 077
  cat > "$APP_DIR/.env" <<EOF
# Dibuat oleh ops/lab/app-vm-setup.sh pada $(date -Iseconds)
BACKEND_IMAGE=curalyta-backend:local
FRONTEND_IMAGE=curalyta-frontend:local
REGISTRY=ghcr.io/muhammadabrarrayhan2/curalyta
SERVER_NAME=_
NGINX_SITE=http
POSTGRES_USER=curalyta
POSTGRES_PASSWORD=$(rand 24)
POSTGRES_DB=curalyta
CORS_ORIGIN=http://192.168.45.20
JWT_SECRET=$(rand 64)
ADMIN_EMAIL=admin@curalyta.app
ADMIN_PASSWORD=Adm-$(rand 10)
GROQ_API_KEYS=${GROQ_API_KEYS:-}
BACKUP_BUCKET=curalyta-db-backups
BACKUP_DIR=/var/backups/curalyta
BACKUP_S3_ENDPOINT=http://192.168.45.30:3900
BACKUP_S3_ACCESS_KEY=${BACKUP_S3_ACCESS_KEY:-}
BACKUP_S3_SECRET_KEY=${BACKUP_S3_SECRET_KEY:-}
EOF
  umask 022
fi
chown curalyta:curalyta "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

step "4. Stack aplikasi"
cd "$APP_DIR"
# Normalnya image diambil dari GHCR oleh job deploy CI/CD (ops/deploy.sh).
# BUILD_LOCAL=1 membangun image langsung di VM (misalnya saat CI tidak tersedia).
if [ "${BUILD_LOCAL:-0}" = "1" ]; then
  docker compose build
  docker compose up -d --wait --wait-timeout 300
  docker compose ps
else
  echo "Lewati build lokal: deploy pertama dilakukan pipeline CI/CD (runner self-hosted)"
fi

step "5. cAdvisor"
docker compose -f "$LAB_DIR/app-agents.yml" -p curalyta-agents up -d

step "6. Cron backup harian dan logrotate"
mkdir -p /var/backups/curalyta /var/log/curalyta
# Runner CI/CD (user curalyta) menulis log deploy ke sini
chown curalyta:curalyta /var/log/curalyta
cat > /etc/cron.d/curalyta-backup <<'EOF'
# Backup database Curalyta setiap hari pukul 02:00 WIB (RPO 24 jam)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * * root /opt/curalyta/ops/backup-db.sh >> /var/log/curalyta/backup-cron.log 2>&1
EOF
cat > /etc/logrotate.d/curalyta <<'EOF'
/var/log/curalyta/*.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
    copytruncate
}
EOF

step "7. Patch keamanan otomatis"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true

step "8. Cloudflare Tunnel (HTTPS publik)"
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -fsSL -o /tmp/cloudflared.deb \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i /tmp/cloudflared.deb >/dev/null
fi
cat > /etc/systemd/system/curalyta-tunnel.service <<'EOF'
[Unit]
Description=Curalyta public HTTPS via Cloudflare quick tunnel
After=network-online.target docker.service
Wants=network-online.target

[Service]
ExecStart=/usr/bin/cloudflared tunnel --no-autoupdate --url http://localhost:80
Restart=always
RestartSec=5
User=nobody

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now curalyta-tunnel
for i in $(seq 1 30); do
  url=$(journalctl -u curalyta-tunnel --no-pager -o cat | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n1 || true)
  [ -n "$url" ] && break
  sleep 2
done
echo "${url:-}" > "$APP_DIR/.public-url"
echo "URL publik: ${url:-belum tersedia}"

# Watchdog: restart tunnel yang kedaluwarsa ("Tunnel not found") setiap 2 menit
cat > /etc/systemd/system/curalyta-tunnel-watchdog.service <<'EOF'
[Unit]
Description=Curalyta tunnel watchdog

[Service]
Type=oneshot
ExecStart=/opt/curalyta/ops/lab/tunnel-watchdog.sh
EOF
cat > /etc/systemd/system/curalyta-tunnel-watchdog.timer <<'EOF'
[Unit]
Description=Jalankan Curalyta tunnel watchdog setiap 2 menit

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now curalyta-tunnel-watchdog.timer

"$APP_DIR/ops/healthcheck.sh" "http://localhost/health" || true
