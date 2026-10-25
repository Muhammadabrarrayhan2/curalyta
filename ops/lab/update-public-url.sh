#!/usr/bin/env bash
# ============================================================
# update-public-url.sh — sinkronkan semua yang bergantung pada URL publik
#
# Cloudflare quick tunnel memberi URL *.trycloudflare.com baru setiap kali
# service curalyta-tunnel di-restart. Skrip ini (dijalankan dari laptop admin
# di root repo, Git Bash) memperbarui:
#   1. CORS_ORIGIN backend di VM aplikasi (lalu backend dibuat ulang)
#   2. Target uptime check publik Prometheus di VM monitoring (file_sd)
#   3. Rewrite /api staging Vercel di frontend/vercel.json (commit + push
#      memicu build Vercel dan pipeline CI/CD)
#
# Pemakaian: ops/lab/update-public-url.sh [--no-push]
# ============================================================
set -euo pipefail

KEY="${SSH_KEY:-$HOME/.ssh/curalyta_lab}"
APP=curalyta@192.168.45.20
MON=curalyta@192.168.45.30
STAGING_ORIGINS="https://curalyta-frontend.vercel.app,https://curalyta-frontend-hxd7.vercel.app"
PUSH=true
[ "${1:-}" = "--no-push" ] && PUSH=false

ssh_app() { ssh -i "$KEY" -o BatchMode=yes "$APP" "$@"; }
ssh_mon() { ssh -i "$KEY" -o BatchMode=yes "$MON" "$@"; }

# URL terbaru dari log service tunnel
url=$(ssh_app "journalctl -u curalyta-tunnel --no-pager -o cat | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n1")
[ -n "$url" ] || { echo "URL tunnel tidak ditemukan" >&2; exit 1; }
echo "URL publik: $url"
ssh_app "echo '$url' | sudo tee /opt/curalyta/.public-url >/dev/null"

# ---- 1. CORS backend ----
cors="http://192.168.45.20,${url},${STAGING_ORIGINS}"
ssh_app "cd /opt/curalyta && sed -i 's#^CORS_ORIGIN=.*#CORS_ORIGIN=${cors}#' .env && docker compose up -d --wait backend >/dev/null && grep '^CORS_ORIGIN=' .env"

# ---- 2. Target Prometheus ----
staging_url="https://curalyta-frontend.vercel.app"
ssh_mon "cd /opt/curalyta/ops/lab/monitor/prometheus/targets && sudo tee health-public.yml >/dev/null <<EOF
# Diperbarui oleh ops/lab/update-public-url.sh pada $(date -Iseconds)
- targets: ['${url}/health']
  labels: { path: public }
EOF
sudo tee web-public.yml >/dev/null <<EOF
# Diperbarui oleh ops/lab/update-public-url.sh pada $(date -Iseconds)
- targets: ['${url}/']
  labels: { path: public, env: production }
- targets: ['${staging_url}/']
  labels: { path: public, env: staging }
EOF
echo 'Target Prometheus diperbarui'"

# ---- 3. Rewrite staging Vercel ----
cat > frontend/vercel.json <<EOF
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "${url}/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF
if [ -z "$(git status --porcelain -- frontend/vercel.json)" ]; then
  echo "frontend/vercel.json sudah sesuai"
elif $PUSH; then
  git add frontend/vercel.json
  git commit -q -m "chore(staging): point Vercel /api rewrite to ${url}"
  git push -q origin main
  echo "frontend/vercel.json di-commit dan di-push (Vercel + CI/CD berjalan)"
else
  echo "frontend/vercel.json diperbarui (belum di-commit)"
fi
