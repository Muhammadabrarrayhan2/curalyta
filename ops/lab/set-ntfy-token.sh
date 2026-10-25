#!/usr/bin/env bash
# ============================================================
# set-ntfy-token.sh — aktifkan email alert lewat akun ntfy.sh
#
# Dijalankan oleh pemilik akun dari laptop admin (Git Bash, di root repo):
#   bash ops/lab/set-ntfy-token.sh
#
# Token akses ntfy diketik tanpa ditampilkan di layar, dikirim lewat stdin
# SSH ke VM monitoring, disimpan di .env (izin 600), lalu konfigurasi
# Alertmanager dibangun ulang. Token tidak pernah ditulis ke repo atau log.
# Syarat: akun ntfy.sh dengan email penerima alert sudah diverifikasi.
# ============================================================
set -euo pipefail

KEY="${SSH_KEY:-$HOME/.ssh/curalyta_lab}"
MON=curalyta@192.168.45.30
ALERT_EMAIL="${ALERT_EMAIL:-abrarrayhan8@gmail.com}"

read -rsp "Tempel token akses ntfy (diawali tk_), lalu Enter: " token
echo
token=$(printf '%s' "$token" | tr -d '[:space:]')
case "$token" in
  tk_*) ;;
  *) echo "Token tidak valid: harus diawali tk_" >&2; exit 1 ;;
esac
# Token ntfy = "tk_" + 29 karakter; paste yang terpotong ditolak sebelum disimpan
if [ "${#token}" -ne 32 ]; then
  echo "Token terpotong: panjangnya ${#token} karakter, seharusnya 32. Salin ulang dari ntfy.sh → Account." >&2
  exit 1
fi
kode=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" https://ntfy.sh/v1/account)
if [ "$kode" != "200" ]; then
  echo "Token ditolak ntfy.sh (HTTP $kode). Pastikan token masih aktif di Account → Access tokens." >&2
  exit 1
fi
echo "Token valid."

printf '%s' "$token" | ssh -i "$KEY" -o BatchMode=yes "$MON" '
  set -e
  T=$(cat)
  ENV=/opt/curalyta/ops/lab/monitor/.env
  sudo sed -i "/^NTFY_TOKEN=/d" "$ENV"
  printf "NTFY_TOKEN=%s\n" "$T" | sudo tee -a "$ENV" >/dev/null
  sudo chmod 600 "$ENV"
  sudo git -C /opt/curalyta pull -q --ff-only
  sudo ALERT_EMAIL='"$ALERT_EMAIL"' bash /opt/curalyta/ops/lab/monitor-vm-setup.sh > /tmp/mon-ntfy.log 2>&1
  grep "^Alert:" /tmp/mon-ntfy.log
  cd /opt/curalyta/ops/lab/monitor && docker compose restart alertmanager >/dev/null 2>&1
  echo "Alertmanager dimuat ulang dengan konfigurasi email"
'
unset token

read -rp "Kirim 1 notifikasi uji (memakai 1 dari 5 kuota email harian)? [y/N] " jawab
if [ "$jawab" = "y" ] || [ "$jawab" = "Y" ]; then
  ssh -i "$KEY" -o BatchMode=yes "$MON" '
    cd /opt/curalyta/ops/lab/monitor
    URL=$(sudo grep -o "https://ntfy.sh[^\"]*" alertmanager/alertmanager.yml | head -1)
    curl -s -o /tmp/ntfy-uji.json -w "HTTP %{http_code}\n" -X POST "$URL" -H "Content-Type: application/json" \
      -d "{\"status\":\"firing\",\"commonLabels\":{\"alertname\":\"UjiEmailAlert\",\"priority\":\"P4\"},\"alerts\":[{\"status\":\"firing\",\"annotations\":{\"summary\":\"Uji email alert lab Curalyta\"},\"startsAt\":\"$(date -u +%FT%TZ)\"}]}"
    grep -o "\"error\":\"[^\"]*\"" /tmp/ntfy-uji.json || echo "Terkirim. Periksa inbox/spam email Anda."
  '
fi
