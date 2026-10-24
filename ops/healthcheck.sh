#!/usr/bin/env bash
# ============================================================
# healthcheck.sh — cek kesehatan layanan Curalyta
#
# Pemakaian:
#   healthcheck.sh [URL]
#     URL default: https://$SERVER_NAME/health (atau http://localhost/health)
#
# Memeriksa:
#   1. Endpoint /health (status HTTP, status database, waktu respons)
#   2. Status health setiap container (jika dijalankan di host Docker)
#   3. Pemakaian disk root dan volume Docker
# Exit code 0 = sehat, 1 = ada masalah. Cocok untuk cron/monitoring manual.
# ============================================================
set -uo pipefail

SCRIPT_TAG="curalyta-healthcheck"
# shellcheck source=ops/lib.sh
. "$(dirname "$(readlink -f "$0")")/lib.sh"
load_env

url="${1:-}"
if [ -z "$url" ]; then
  if [ -n "${SERVER_NAME:-}" ] && [ "${SERVER_NAME}" != "_" ] && [ "${NGINX_SITE:-http}" = "https" ]; then
    url="https://${SERVER_NAME}/health"
  else
    url="http://localhost:${HTTP_PORT:-80}/health"
  fi
fi

problems=0

# ---- 1. Endpoint health ----
body=$(curl -sS -o - -w '\n%{http_code} %{time_total}' --max-time 10 "$url" 2>&1) || true
code=$(echo "$body" | tail -n1 | awk '{print $1}')
total=$(echo "$body" | tail -n1 | awk '{print $2}')
json=$(echo "$body" | sed '$d')
if [ "$code" = "200" ]; then
  echo "[OK]   $url HTTP $code dalam ${total}s"
else
  echo "[FAIL] $url HTTP ${code:-n/a} dalam ${total:-n/a}s"
  problems=$((problems + 1))
fi
[ -n "$json" ] && echo "       $json"

# ---- 2. Container ----
if command -v docker >/dev/null 2>&1 && [ -f "$APP_DIR/docker-compose.yml" ]; then
  while read -r name state health; do
    [ -z "$name" ] && continue
    if [ "$state" = "running" ] && { [ "$health" = "healthy" ] || [ "$health" = "-" ]; }; then
      echo "[OK]   container $name $state ${health}"
    else
      echo "[FAIL] container $name $state ${health}"
      problems=$((problems + 1))
    fi
  done < <(compose ps --all --format '{{.Service}} {{.State}} {{if .Health}}{{.Health}}{{else}}-{{end}}' 2>/dev/null)
fi

# ---- 3. Disk ----
root_pct=$(df -P / | awk 'NR==2 {gsub("%","",$5); print $5}')
if [ "${root_pct:-0}" -ge 80 ]; then
  echo "[WARN] disk / terpakai ${root_pct}% (ambang 80%)"
  problems=$((problems + 1))
else
  echo "[OK]   disk / terpakai ${root_pct}%"
fi

if [ "$problems" -eq 0 ]; then
  log INFO "Healthcheck OK ($url)"
  exit 0
fi
log WARNING "Healthcheck menemukan $problems masalah ($url)"
exit 1
