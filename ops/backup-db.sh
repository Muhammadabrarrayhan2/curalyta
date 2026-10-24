#!/usr/bin/env bash
# ============================================================
# backup-db.sh — backup database PostgreSQL Curalyta ke object storage
#
# Alur:
#   1. pg_dump (format custom, terkompresi) dari container postgres
#   2. Simpan lokal dengan timestamp + checksum SHA-256
#   3. Upload ke bucket S3-compatible (MinIO di VM monitoring) memakai
#      klien "mc" yang dijalankan sebagai container sekali pakai
#   4. Simpan hanya 7 file terbaru di disk lokal (bucket punya lifecycle 30 hari)
#
# Dijalankan harian oleh cron (/etc/cron.d/curalyta-backup) dan bisa manual:
#   sudo /opt/curalyta/ops/backup-db.sh
# Target RPO: 24 jam (lihat docs/SLA.md).
# ============================================================
set -euo pipefail

SCRIPT_TAG="curalyta-backup"
# shellcheck source=ops/lib.sh
. "$(dirname "$(readlink -f "$0")")/lib.sh"
load_env

: "${BACKUP_BUCKET:?BACKUP_BUCKET belum diisi di $APP_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/curalyta}"
KEEP_LOCAL="${KEEP_LOCAL:-7}"
DB_USER="${POSTGRES_USER:-curalyta}"
DB_NAME="${POSTGRES_DB:-curalyta}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
file="$BACKUP_DIR/curalyta-${timestamp}.dump"
started=$(date +%s)

log INFO "Mulai backup database $DB_NAME -> $file"

# pg_dump dijalankan di dalam container postgres; output di-stream ke host
if ! compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc --no-owner > "$file.partial"; then
  rm -f "$file.partial"
  log ERROR "pg_dump gagal"
  exit 1
fi
mv "$file.partial" "$file"
sha256sum "$file" | awk '{print $1}' > "$file.sha256"
size=$(stat -c %s "$file")

dest="${BACKUP_BUCKET}/postgres/$(basename "$file")"
if ! objstore cp --quiet "/backups/$(basename "$file")" "/backups/$(basename "$file").sha256" "backup/${BACKUP_BUCKET}/postgres/"; then
  log ERROR "Upload ke object storage ($dest) gagal; file lokal tetap disimpan"
  exit 2
fi

# Rotasi file lokal: simpan $KEEP_LOCAL dump terbaru
ls -1t "$BACKUP_DIR"/curalyta-*.dump 2>/dev/null | tail -n +"$((KEEP_LOCAL + 1))" | while read -r old; do
  rm -f "$old" "$old.sha256"
done

elapsed=$(( $(date +%s) - started ))
log INFO "Backup selesai: s3://$dest ukuran=${size}B durasi=${elapsed}s"

# Metrik untuk Prometheus (textfile collector node_exporter) — dipakai
# alert BackupDatabaseTerlambat untuk menjaga RPO 24 jam
TEXTFILE_DIR="${TEXTFILE_DIR:-/var/lib/prometheus/node-exporter}"
if [ -d "$TEXTFILE_DIR" ]; then
  cat > "$TEXTFILE_DIR/curalyta_backup.prom.$$" <<EOF
# HELP curalyta_backup_last_success_timestamp_seconds Waktu backup database terakhir yang berhasil.
# TYPE curalyta_backup_last_success_timestamp_seconds gauge
curalyta_backup_last_success_timestamp_seconds $(date +%s)
# HELP curalyta_backup_last_size_bytes Ukuran file backup terakhir.
# TYPE curalyta_backup_last_size_bytes gauge
curalyta_backup_last_size_bytes $size
# HELP curalyta_backup_last_duration_seconds Durasi backup terakhir.
# TYPE curalyta_backup_last_duration_seconds gauge
curalyta_backup_last_duration_seconds $elapsed
EOF
  mv "$TEXTFILE_DIR/curalyta_backup.prom.$$" "$TEXTFILE_DIR/curalyta_backup.prom"
fi
