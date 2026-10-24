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
