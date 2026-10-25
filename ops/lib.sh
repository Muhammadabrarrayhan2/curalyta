#!/usr/bin/env bash
# ============================================================
# Fungsi bersama untuk skrip ops Curalyta (di-source, bukan dijalankan).
# ============================================================

# Direktori aplikasi di VM (berisi docker-compose.yml dan .env)
APP_DIR="${APP_DIR:-/opt/curalyta}"
LOG_DIR="${LOG_DIR:-/var/log/curalyta}"

# Muat variabel dari .env tanpa menampilkan nilainya
load_env() {
  if [ -f "$APP_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$APP_DIR/.env"
    set +a
  fi
}

# Log ke layar, ke file, dan ke syslog (diteruskan Ops Agent ke Cloud Logging)
log() {
  local level="$1"; shift
  local tag="${SCRIPT_TAG:-curalyta-ops}"
  local line
  line="$(date '+%Y-%m-%dT%H:%M:%S%z') [$level] $*"
  echo "$line"
  if [ -w "$LOG_DIR" ] || mkdir -p "$LOG_DIR" 2>/dev/null; then
    echo "$line" >> "$LOG_DIR/${tag}.log" 2>/dev/null || true
  fi
  command -v logger >/dev/null 2>&1 && logger -t "$tag" -p "user.${level,,}" -- "$*" || true
}

compose() {
  docker compose --project-directory "$APP_DIR" -f "$APP_DIR/docker-compose.yml" "$@"
}

# Klien object storage S3-compatible (rclone) sebagai container sekali pakai.
# Remote "backup:" menunjuk ke BACKUP_S3_ENDPOINT (Garage di VM monitoring);
# direktori backup lokal di-mount ke /backups. Kredensial hanya lewat
# environment. no_check_bucket: key backup sengaja tidak boleh membuat bucket.
objstore() {
  : "${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT belum diisi}"
  : "${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY belum diisi}"
  : "${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY belum diisi}"
  docker run --rm --network host \
    -e RCLONE_CONFIG_BACKUP_TYPE=s3 \
    -e RCLONE_CONFIG_BACKUP_PROVIDER=Other \
    -e "RCLONE_CONFIG_BACKUP_ENDPOINT=${BACKUP_S3_ENDPOINT}" \
    -e "RCLONE_CONFIG_BACKUP_ACCESS_KEY_ID=${BACKUP_S3_ACCESS_KEY}" \
    -e "RCLONE_CONFIG_BACKUP_SECRET_ACCESS_KEY=${BACKUP_S3_SECRET_KEY}" \
    -e RCLONE_CONFIG_BACKUP_REGION=garage \
    -e RCLONE_CONFIG_BACKUP_FORCE_PATH_STYLE=true \
    -e RCLONE_CONFIG_BACKUP_NO_CHECK_BUCKET=true \
    -e RCLONE_CONFIG=/dev/null -e RCLONE_LOG_LEVEL=ERROR \
    -v "${BACKUP_DIR:-/var/backups/curalyta}:/backups" \
    "${RCLONE_IMAGE:-rclone/rclone:1.71.1}" "$@"
}
