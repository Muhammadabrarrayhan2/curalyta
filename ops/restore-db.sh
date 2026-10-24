#!/usr/bin/env bash
# ============================================================
# restore-db.sh — restore backup PostgreSQL Curalyta
#
# Pemakaian:
#   restore-db.sh [SUMBER] [--target DB] [--production]
#
#   SUMBER       latest (default) | gs://bucket/postgres/file.dump | /path/file.dump
#   --target DB  database tujuan (default: curalyta_restore_test, database UJI)
#   --production restore ke database produksi ($POSTGRES_DB). Backend dihentikan
#                selama restore lalu dinyalakan lagi. Wajib konfirmasi "RESTORE".
#
# Skrip mengukur durasi setiap langkah untuk dibandingkan dengan target
# RTO 1 jam (docs/SLA.md) dan memverifikasi checksum SHA-256.
# ============================================================
set -euo pipefail

SCRIPT_TAG="curalyta-restore"
# shellcheck source=ops/lib.sh
. "$(dirname "$(readlink -f "$0")")/lib.sh"
load_env

DB_USER="${POSTGRES_USER:-curalyta}"
PROD_DB="${POSTGRES_DB:-curalyta}"
WORK_DIR="${BACKUP_DIR:-/var/backups/curalyta}/restore"
source_arg="latest"
target="curalyta_restore_test"
production=false

while [ $# -gt 0 ]; do
  case "$1" in
    --target) target="$2"; shift 2 ;;
    --production) production=true; shift ;;
    -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
    *) source_arg="$1"; shift ;;
  esac
done

if $production; then
  target="$PROD_DB"
  read -r -p "Restore akan MENIMPA database produksi '$target'. Ketik RESTORE untuk lanjut: " answer
  [ "$answer" = "RESTORE" ] || { echo "Dibatalkan."; exit 1; }
fi

mkdir -p "$WORK_DIR"
t0=$(date +%s)

# ---- 1. Ambil file backup ----
case "$source_arg" in
  latest)
    : "${BACKUP_BUCKET:?BACKUP_BUCKET belum diisi}"
    source_arg=$(gcloud storage ls "gs://${BACKUP_BUCKET}/postgres/*.dump" | sort | tail -n 1)
    [ -n "$source_arg" ] || { log ERROR "Tidak ada backup di bucket"; exit 1; }
    ;;
esac

if [[ "$source_arg" == gs://* ]]; then
  local_file="$WORK_DIR/$(basename "$source_arg")"
  log INFO "Mengunduh $source_arg"
  gcloud storage cp --quiet "$source_arg" "$source_arg.sha256" "$WORK_DIR/"
else
  local_file="$source_arg"
fi
t1=$(date +%s)

# ---- 2. Verifikasi checksum ----
if [ -f "$local_file.sha256" ]; then
  expected=$(cat "$local_file.sha256")
  actual=$(sha256sum "$local_file" | awk '{print $1}')
  [ "$expected" = "$actual" ] || { log ERROR "Checksum tidak cocok untuk $local_file"; exit 1; }
  log INFO "Checksum SHA-256 cocok"
fi

# ---- 3. Siapkan database tujuan ----
if $production; then
  log INFO "Menghentikan backend selama restore"
  compose stop backend
fi
compose exec -T postgres psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -q \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$target' AND pid <> pg_backend_pid();" \
  -c "DROP DATABASE IF EXISTS \"$target\";" \
  -c "CREATE DATABASE \"$target\" OWNER \"$DB_USER\";" >/dev/null

# ---- 4. Restore ----
log INFO "Restore $(basename "$local_file") ke database '$target'"
compose exec -T postgres pg_restore -U "$DB_USER" -d "$target" --no-owner --exit-on-error < "$local_file"
t2=$(date +%s)

if $production; then
  compose start backend
fi

# ---- 5. Verifikasi isi ----
log INFO "Jumlah baris tabel utama di '$target':"
compose exec -T postgres psql -U "$DB_USER" -d "$target" -At -F ' | ' -c "
  SELECT 'User', count(*) FROM \"User\"
  UNION ALL SELECT 'Doctor', count(*) FROM \"Doctor\"
  UNION ALL SELECT 'Patient', count(*) FROM \"Patient\"
  UNION ALL SELECT 'VitalSign', count(*) FROM \"VitalSign\"
  UNION ALL SELECT 'Observation', count(*) FROM \"Observation\"
  UNION ALL SELECT '_prisma_migrations', count(*) FROM _prisma_migrations;"

t3=$(date +%s)
log INFO "Durasi: unduh=$((t1 - t0))s restore=$((t2 - t1))s verifikasi=$((t3 - t2))s total=$((t3 - t0))s (target RTO 3600s)"
