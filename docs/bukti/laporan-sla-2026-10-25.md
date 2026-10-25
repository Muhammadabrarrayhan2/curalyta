# Laporan Pencapaian SLA — Curalyta

| Atribut | Nilai |
|---|---|
| Dibuat | 2026-10-25 11:55:22 WIB |
| Periode kueri | 24h terakhir |
| Data tersedia sejak | 2.3 jam lalu |
| Sumber | Prometheus `http://localhost:9090`, job `blackbox-health` (interval 30 detik) |
| Endpoint | `http://192.168.45.20/health` (jalur internal) |

## Ringkasan terhadap target

| Indikator | Target | Aktual | Status |
|---|---|---|---|
| Ketersediaan | ≥ 99% | 62.275% | TIDAK TERPENUHI |
| Waktu respons /health (p95) | < 1 s | 0.426 s | TERPENUHI |
| Umur backup database terakhir | < 24 jam (RPO) | 1.8 jam | TERPENUHI |

## Detail

| Metrik | Nilai |
|---|---|
| Jumlah pemeriksaan | 167 |
| Pemeriksaan gagal | 63 |
| Perkiraan downtime | 31.5 menit |
| Batas downtime sesuai target pada rentang data | 1.4 menit |
| Jumlah insiden (transisi UP→DOWN) | 6 |
| Latensi rata-rata | 0.113 s |
| Latensi maksimum | 6.227 s |
| Ketersediaan jalur publik (tunnel HTTPS) | 72.586% |

Catatan perhitungan: ketersediaan = rata-rata `probe_success` (1 = sehat, 0 = gagal)
selama periode. Downtime = jumlah pemeriksaan gagal × 30 detik.
