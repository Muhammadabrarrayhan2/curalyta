#!/usr/bin/env bash
# ============================================================
# tunnel-watchdog.sh — pulihkan Cloudflare quick tunnel yang kedaluwarsa
#
# Dijalankan setiap 2 menit oleh curalyta-tunnel-watchdog.timer (root).
# Quick tunnel dihapus Cloudflare bila koneksinya lama terputus (mis. laptop
# host tidur). cloudflared lalu terus mencoba ID lama ("Tunnel not found")
# tanpa keluar, sehingga Restart=always tidak menolong. Watchdog ini
# me-restart service dan mencatat URL baru ke /opt/curalyta/.public-url.
# Sinkronisasi URL ke CORS/Prometheus/Vercel: ops/lab/update-public-url.sh.
# ============================================================
set -euo pipefail

SCRIPT_TAG="curalyta-tunnel-watchdog"
# shellcheck source=ops/lib.sh
. "$(dirname "$(readlink -f "$0")")/../lib.sh"

if journalctl -u curalyta-tunnel --since "-3min" --no-pager -o cat 2>/dev/null | grep -q "Tunnel not found"; then
  log WARNING "Tunnel kedaluwarsa terdeteksi, restart curalyta-tunnel"
  systemctl restart curalyta-tunnel
  url=""
  for i in $(seq 1 30); do
    url=$(journalctl -u curalyta-tunnel --since "-1min" --no-pager -o cat | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n1 || true)
    [ -n "$url" ] && break
    sleep 2
  done
  echo "$url" > "$APP_DIR/.public-url"
  log WARNING "URL publik baru: ${url:-belum tersedia} (jalankan ops/lab/update-public-url.sh dari laptop)"
fi
