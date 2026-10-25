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
#   5. Jalankan Prometheus, Alertmanager, Grafana, Blackbox
#   6. Object storage Garage: bucket backup, key hak minimal, lifecycle 30 hari
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
# Repo dimiliki user curalyta; root perlu pengecualian safe.directory git
git config --system --get-all safe.directory 2>/dev/null | grep -qx "$APP_DIR" || \
  git config --system --add safe.directory "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --quiet "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --quiet --ff-only
fi
chown -R curalyta:curalyta "$APP_DIR"

step "3. Rahasia stack monitoring"
rand() { openssl rand -hex "$1"; }
# .env lama dari versi berbasis MinIO tidak punya rahasia Garage: buat ulang
if [ -f "$MON_DIR/.env" ] && ! grep -q '^GARAGE_RPC_SECRET=' "$MON_DIR/.env"; then
  mv "$MON_DIR/.env" "$MON_DIR/.env.lama.$(date +%s)"
fi
if [ ! -f "$MON_DIR/.env" ]; then
  umask 077
  # Format kunci Garage: access key "GK" + 24 hex, secret 64 hex
  cat > "$MON_DIR/.env" <<EOF
GRAFANA_ADMIN_PASSWORD=$(rand 12)
GARAGE_RPC_SECRET=$(rand 32)
GARAGE_ADMIN_TOKEN=$(rand 32)
BACKUP_BUCKET=curalyta-db-backups
BACKUP_S3_ACCESS_KEY=GK$(rand 12)
BACKUP_S3_SECRET_KEY=$(rand 32)
NTFY_TOPIC=curalyta-alerts-$(rand 6)
ALERT_EMAIL=${ALERT_EMAIL}
EOF
  umask 022
fi
chmod 600 "$MON_DIR/.env"
set -a; . "$MON_DIR/.env"; set +a

step "4. Konfigurasi Alertmanager"
# Judul dan isi notifikasi memakai template ntfy atas payload JSON Alertmanager.
# ntfy.sh menolak email dari pengirim anonim (error 40053), jadi email hanya
# diaktifkan bila NTFY_TOKEN (token akun ntfy gratis) diisi di .env; tanpa
# token alert tetap terkirim sebagai push notification ke topik.
NTFY_URL=$(NTFY_TOKEN="${NTFY_TOKEN:-}" python3 - <<EOF
import base64, os
from urllib.parse import urlencode
title = "[{{.status}}] {{.commonLabels.alertname}} ({{.commonLabels.priority}})"
message = ("{{range .alerts}}{{.status}}: {{.annotations.summary}}\n"
           "Mulai: {{.startsAt}}\n{{end}}")
params = {"tpl": "yes", "t": title, "m": message, "tags": "rotating_light"}
token = os.environ.get("NTFY_TOKEN", "")
if token:
    params["email"] = "${ALERT_EMAIL}"
    params["auth"] = base64.urlsafe_b64encode(f"Bearer {token}".encode()).decode().rstrip("=")
print("https://ntfy.sh/${NTFY_TOPIC}?" + urlencode(params))
EOF
)
[ -n "${NTFY_TOKEN:-}" ] && echo "Alert: push + email ke ${ALERT_EMAIL}" || echo "Alert: push ntfy (email butuh NTFY_TOKEN di .env)"
NTFY_URL="$NTFY_URL" python3 -c '
import os, sys
src, dst = sys.argv[1], sys.argv[2]
open(dst, "w").write(open(src).read().replace("__NTFY_URL__", os.environ["NTFY_URL"]))
' "$MON_DIR/alertmanager/alertmanager.yml.tmpl" "$MON_DIR/alertmanager/alertmanager.yml"
chmod 644 "$MON_DIR/alertmanager/alertmanager.yml"

step "5. Menjalankan stack monitoring"
cd "$MON_DIR"
docker compose pull --quiet
docker compose up -d --wait --wait-timeout 180 prometheus alertmanager blackbox grafana
docker compose up -d garage

step "6. Object storage Garage: layout, key backup, bucket, lifecycle"
g() { docker compose exec -T garage /garage "$@"; }
for i in $(seq 1 30); do g status >/dev/null 2>&1 && break; sleep 2; done
g status
# Satu node, kapasitas 15 GB untuk zona "lab" (layout hanya diterapkan sekali)
if ! g layout show 2>/dev/null | grep -qE 'Current cluster layout version: [1-9]'; then
  node=$(g status | awk '/HEALTHY NODES/ {f = 1; next} f && $1 ~ /^[0-9a-f]+$/ {print $1; exit}')
  g layout assign -z lab -c 15G "$node"
  g layout apply --version 1
fi
# Key khusus backup (diimpor agar nilainya sama dengan .env di VM aplikasi)
g key info curalyta-backup >/dev/null 2>&1 || \
  g key import --yes -n curalyta-backup "$BACKUP_S3_ACCESS_KEY" "$BACKUP_S3_SECRET_KEY"
g bucket info "$BACKUP_BUCKET" >/dev/null 2>&1 || g bucket create "$BACKUP_BUCKET"
# Hak minimal: baca + tulis pada satu bucket saja (tanpa hak owner)
g bucket allow --read --write "$BACKUP_BUCKET" --key curalyta-backup
# Lifecycle lewat API S3: objek dihapus otomatis setelah 30 hari.
# Ditandatangani SigV4 dengan Python standar (curl Ubuntu 22.04 tidak ikut
# menandatangani header x-amz-content-sha256 yang diwajibkan Garage).
echo "Lifecycle bucket ${BACKUP_BUCKET}:"
python3 "$APP_DIR/ops/lab/s3-lifecycle.py" put "$BACKUP_BUCKET" 30
g bucket info "$BACKUP_BUCKET"
docker compose ps

echo
echo "Grafana     : http://$(hostname -I | awk '{print $1}'):3000 (user admin)"
echo "Prometheus  : http://$(hostname -I | awk '{print $1}'):9090"
echo "Object store: http://$(hostname -I | awk '{print $1}'):3900 (S3 API, bucket ${BACKUP_BUCKET})"
echo "Topik ntfy  : https://ntfy.sh/${NTFY_TOPIC}"
echo "Rahasia     : $MON_DIR/.env (root/curalyta, izin 600)"
