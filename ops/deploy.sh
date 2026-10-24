#!/usr/bin/env bash
# ============================================================
# deploy.sh — deploy (atau rollback) Curalyta di VM
#
# Pemakaian (di VM, sebagai user anggota grup docker):
#   /opt/curalyta/ops/deploy.sh [TAG]
#     TAG default: latest. Untuk rollback isi tag commit sebelumnya,
#     contoh: deploy.sh 3f2a1bc
#
# Alur:
#   1. git pull konfigurasi (compose, nginx, ops) dari branch main
#   2. Autentikasi Docker ke Artifact Registry (service account VM)
#   3. Set BACKEND_IMAGE/FRONTEND_IMAGE ke TAG di .env
#   4. docker compose pull + up -d (hanya container yang berubah di-restart)
#   5. Tunggu semua container healthy, lalu cek /health
#   6. Hapus image lama yang tidak terpakai
# ============================================================
set -euo pipefail

SCRIPT_TAG="curalyta-deploy"
# shellcheck source=ops/lib.sh
. "$(dirname "$(readlink -f "$0")")/lib.sh"
load_env

TAG="${1:-latest}"
REGION="${GCP_REGION:-asia-southeast2}"
REGISTRY="${REGISTRY:-${REGION}-docker.pkg.dev/${GCP_PROJECT:?GCP_PROJECT belum diisi di .env}/curalyta}"

cd "$APP_DIR"
log INFO "Deploy tag $TAG dimulai"

# ---- 1. Konfigurasi terbaru ----
if [ -d .git ]; then
  git fetch --quiet origin main
  git reset --quiet --hard origin/main
  log INFO "Konfigurasi di commit $(git rev-parse --short HEAD)"
fi

# ---- 2. Login registry ----
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet >/dev/null 2>&1

# ---- 3. Tetapkan tag image ----
set_env() {
  if grep -q "^$1=" .env; then
    sed -i "s#^$1=.*#$1=$2#" .env
  else
    echo "$1=$2" >> .env
  fi
}
set_env BACKEND_IMAGE "${REGISTRY}/backend:${TAG}"
set_env FRONTEND_IMAGE "${REGISTRY}/frontend:${TAG}"

# ---- 4. Tarik image dan jalankan ----
compose pull --quiet backend frontend
compose up -d --remove-orphans --no-build

# ---- 5. Tunggu sehat ----
for i in $(seq 1 30); do
  unhealthy=$(compose ps --format '{{.Service}} {{.Health}}' | awk '$2 != "healthy" && $2 != "" {print $1}')
  [ -z "$unhealthy" ] && break
  sleep 5
done
if [ -n "${unhealthy:-}" ]; then
  log ERROR "Container belum sehat setelah 150 detik: $unhealthy"
  compose ps
  exit 1
fi
"$APP_DIR/ops/healthcheck.sh" || { log ERROR "Healthcheck gagal setelah deploy"; exit 1; }

# ---- 6. Bersihkan image lama ----
docker image prune -af --filter "until=168h" >/dev/null 2>&1 || true

log INFO "Deploy tag $TAG selesai"
