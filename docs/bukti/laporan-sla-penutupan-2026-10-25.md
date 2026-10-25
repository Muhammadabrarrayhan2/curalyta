# Laporan Pencapaian SLA — Curalyta

| Atribut | Nilai |
|---|---|
| Dibuat | 2026-10-25 16:53:53 WIB |
| Periode kueri | 24h terakhir |
| Data tersedia sejak | 7.3 jam lalu |
| Sumber | Prometheus `http://localhost:9090`, job `blackbox-health` (interval 30 detik) |
| Endpoint | `http://192.168.45.20/health` (jalur internal) |

## Ringkasan terhadap target

| Indikator | Target | Aktual | Status |
|---|---|---|---|
| Ketersediaan | ≥ 99% | 88.998% | TIDAK TERPENUHI |
| Waktu respons /health (p95) | < 1 s | 0.092 s | TERPENUHI |
| Umur backup database terakhir | < 24 jam (RPO) | 0.0 jam | TERPENUHI |

## Detail

| Metrik | Nilai |
|---|---|
| Jumlah pemeriksaan | 609 |
| Pemeriksaan gagal | 67 |
| Perkiraan downtime | 33.5 menit |
| Batas downtime sesuai target pada rentang data | 4.4 menit |
| Jumlah insiden (transisi UP→DOWN) | 10 |
| Latensi rata-rata | 0.042 s |
| Latensi maksimum | 6.227 s |
| Ketersediaan jalur publik (tunnel HTTPS) | 85.541% |

Catatan perhitungan: ketersediaan = rata-rata `probe_success` (1 = sehat, 0 = gagal)
selama periode. Downtime = jumlah pemeriksaan gagal × 30 detik.
