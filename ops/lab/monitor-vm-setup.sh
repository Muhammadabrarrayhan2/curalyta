#!/usr/bin/env bash
# ============================================================
# monitor-vm-setup.sh — setup VM 102 curalyta-monitor (idempotent)
#
# Dijalankan sebagai root di VM monitoring:
#   ALERT_EMAIL=alamat@contoh.com bash ops/lab/monitor-vm-setup.sh
#
#   1. Docker Engine + Compose
#   2. Repositori Curalyta di /opt/curalyta
#   3. Rahasia acak di ops/lab/monitor/.env (izin 600, tidak di-commit)
#   4. Render konfigurasi Alertmanager (topik ntfy + email penerima)
#   5. Jalankan Prometheus, Alertmanager, Grafana, Blackbox, MinIO
# ============================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Muhammadabrarrayhan2/curalyta.git}"
APP_DIR=/opt/curalyta
MON_DIR="$APP_DIR/ops/lab/monitor"
ALERT_EMAIL="${ALERT_EMAIL:?ALERT_EMAIL wajib diisi}"

step() { printf '\n==== %s ====\n' "$*"; }

step "1. Docker"
bash "$(dirname "$(readlink -f "$0")")/install-docker.sh"

step "2. Repositori"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --quiet "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --quiet --ff-only
fi
chown -R curalyta:curalyta "$APP_DIR"

step "3. Rahasia stack monitoring"
rand() { openssl rand -hex "$1"; }
if [ ! -f "$MON_DIR/.env" ]; then
  umask 077
  cat > "$MON_DIR/.env" <<EOF
GRAFANA_ADMIN_PASSWORD=$(rand 12)
MINIO_ROOT_USER=labadmin
MINIO_ROOT_PASSWORD=$(rand 16)
BACKUP_BUCKET=curalyta-db-backups
BACKUP_S3_ACCESS_KEY=curalyta-backup
BACKUP_S3_SECRET_KEY=$(rand 16)
NTFY_TOPIC=curalyta-alerts-$(rand 6)
ALERT_EMAIL=${ALERT_EMAIL}
EOF
  umask 022
fi
chmod 600 "$MON_DIR/.env"
set -a; . "$MON_DIR/.env"; set +a

step "4. Konfigurasi Alertmanager"
# Judul dan isi notifikasi memakai template ntfy atas payload JSON Alertmanager
NTFY_URL=$(python3 - <<EOF
from urllib.parse import urlencode
title = "[{{.status}}] {{.commonLabels.alertname}} ({{.commonLabels.priority}})"
message = ("{{range .alerts}}{{.status}}: {{.annotations.summary}}\n"
           "Mulai: {{.startsAt}}\n{{end}}")
params = {"tpl": "yes", "t": title, "m": message, "tags": "rotating_light",
          "email": "${ALERT_EMAIL}"}
print("https://ntfy.sh/${NTFY_TOPIC}?" + urlencode(params))
EOF
)
NTFY_URL="$NTFY_URL" python3 -c '
import os, sys
src, dst = sys.argv[1], sys.argv[2]
open(dst, "w").write(open(src).read().replace("__NTFY_URL__", os.environ["NTFY_URL"]))
' "$MON_DIR/alertmanager/alertmanager.yml.tmpl" "$MON_DIR/alertmanager/alertmanager.yml"
chmod 644 "$MON_DIR/alertmanager/alertmanager.yml"

step "5. Menjalankan stack monitoring"
cd "$MON_DIR"
docker compose pull --quiet
docker compose up -d --wait --wait-timeout 180 prometheus alertmanager blackbox grafana minio
docker compose up minio-init
docker compose ps

echo
echo "Grafana     : http://$(hostname -I | awk '{print $1}'):3000 (user admin)"
echo "Prometheus  : http://$(hostname -I | awk '{print $1}'):9090"
echo "MinIO       : http://$(hostname -I | awk '{print $1}'):9001"
echo "Topik ntfy  : https://ntfy.sh/${NTFY_TOPIC}"
echo "Rahasia     : $MON_DIR/.env (root/curalyta, izin 600)"
