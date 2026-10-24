#!/usr/bin/env bash
# ============================================================
# laporan-sla.sh — ringkasan pencapaian SLA dari data Prometheus
#
# Pemakaian:
#   ops/laporan-sla.sh [PERIODE] [PROMETHEUS_URL]
#     PERIODE         rentang PromQL, default 30d (contoh: 24h, 7d, 30d)
#     PROMETHEUS_URL  default http://192.168.45.30:9090
#
# Sumber data: uptime check Blackbox Exporter ke endpoint /health
# (job blackbox-health, setiap 30 detik). Output Markdown ke stdout,
# sehingga bisa disimpan: ops/laporan-sla.sh 7d > docs/bukti/laporan-sla.md
#
# Target (docs/SLA.md): ketersediaan >= 99% per bulan, waktu respons
# /health < 1 detik, RPO 24 jam.
# ============================================================
set -euo pipefail

PERIOD="${1:-30d}"
PROM="${2:-${PROMETHEUS_URL:-http://192.168.45.30:9090}}"
TARGET_AVAIL=99
TARGET_LATENCY=1
SEL='job="blackbox-health",path="internal"'

q() {
  curl -fsS --get "$PROM/api/v1/query" --data-urlencode "query=$1" \
    | jq -r '.data.result[0].value[1] // "NaN"'
}
fmt() { awk -v v="$1" -v d="$2" 'BEGIN { if (v == "NaN") print "n/a"; else printf "%.*f", d, v }'; }

now_epoch=$(date +%s)
availability=$(q "100 * avg(avg_over_time(probe_success{$SEL}[$PERIOD]))")
samples=$(q "sum(count_over_time(probe_success{$SEL}[$PERIOD]))")
failed=$(q "sum(count_over_time((probe_success{$SEL} == 0)[$PERIOD:30s]))")
latency_avg=$(q "avg(avg_over_time(probe_duration_seconds{$SEL}[$PERIOD]))")
latency_p95=$(q "max(quantile_over_time(0.95, probe_duration_seconds{$SEL}[$PERIOD]))")
latency_max=$(q "max(max_over_time(probe_duration_seconds{$SEL}[$PERIOD]))")
incidents=$(q "sum(changes(probe_success{$SEL}[$PERIOD])) / 2")
public_avail=$(q "100 * avg(avg_over_time(probe_success{job=\"blackbox-health\",path=\"public\"}[$PERIOD]))")
backup_age=$(q "time() - max(curalyta_backup_last_success_timestamp_seconds)")
data_since=$(q "time() - min_over_time(timestamp(probe_success{$SEL})[$PERIOD:5m])")

downtime_min=$(awk -v f="$failed" 'BEGIN { if (f == "NaN") print "n/a"; else printf "%.1f", f * 30 / 60 }')
allowed_min=$(awk -v s="$data_since" -v t="$TARGET_AVAIL" 'BEGIN { if (s == "NaN") print "n/a"; else printf "%.1f", s / 60 * (100 - t) / 100 }')
verdict() { awk -v v="$1" -v t="$2" -v op="$3" 'BEGIN {
  if (v == "NaN") { print "Tidak ada data"; exit }
  ok = (op == ">=") ? (v >= t) : (v < t); print ok ? "TERPENUHI" : "TIDAK TERPENUHI" }'; }

cat <<EOF
# Laporan Pencapaian SLA — Curalyta

| Atribut | Nilai |
|---|---|
| Dibuat | $(date -d "@$now_epoch" '+%Y-%m-%d %H:%M:%S %Z') |
| Periode kueri | $PERIOD terakhir |
| Data tersedia sejak | $(awk -v s="$data_since" 'BEGIN { if (s == "NaN") print "n/a"; else printf "%.1f jam lalu", s/3600 }') |
| Sumber | Prometheus \`$PROM\`, job \`blackbox-health\` (interval 30 detik) |
| Endpoint | \`http://192.168.45.20/health\` (jalur internal) |

## Ringkasan terhadap target

| Indikator | Target | Aktual | Status |
|---|---|---|---|
| Ketersediaan | ≥ ${TARGET_AVAIL}% | $(fmt "$availability" 3)% | $(verdict "$availability" "$TARGET_AVAIL" ">=") |
| Waktu respons /health (p95) | < ${TARGET_LATENCY} s | $(fmt "$latency_p95" 3) s | $(verdict "$latency_p95" "$TARGET_LATENCY" "<") |
| Umur backup database terakhir | < 24 jam (RPO) | $(awk -v a="$backup_age" 'BEGIN { if (a == "NaN") print "n/a"; else printf "%.1f jam", a/3600 }') | $(verdict "$backup_age" 86400 "<") |

## Detail

| Metrik | Nilai |
|---|---|
| Jumlah pemeriksaan | $(fmt "$samples" 0) |
| Pemeriksaan gagal | $(fmt "$failed" 0) |
| Perkiraan downtime | $downtime_min menit |
| Batas downtime sesuai target pada rentang data | $allowed_min menit |
| Jumlah insiden (transisi UP→DOWN) | $(fmt "$incidents" 0) |
| Latensi rata-rata | $(fmt "$latency_avg" 3) s |
| Latensi maksimum | $(fmt "$latency_max" 3) s |
| Ketersediaan jalur publik (tunnel HTTPS) | $(fmt "$public_avail" 3)% |

Catatan perhitungan: ketersediaan = rata-rata \`probe_success\` (1 = sehat, 0 = gagal)
selama periode. Downtime = jumlah pemeriksaan gagal × 30 detik.
EOF
