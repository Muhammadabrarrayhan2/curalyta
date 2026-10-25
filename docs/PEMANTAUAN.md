# Pemantauan Sarana dan Prasarana Curalyta

Unit kompetensi: J.631120.014.01, Memantau sarana dan prasarana agar bisa digunakan oleh user sesuai dengan SLA
Definisi SLA: `docs/SLA.md`.

## 1. Arsitektur pemantauan

```
node_exporter (pve, curalyta-app, curalyta-monitor) ─┐
cAdvisor (container di curalyta-app)                 ├─► Prometheus v3.5 (scrape 15 s, retensi 45 hari)
Garage metrics (object storage)                      │        ├─► Grafana 12.1 - dashboard "Curalyta - SLA & Infrastruktur"
Blackbox Exporter ── GET /health & / (setiap 30 s) ──┘        └─► Alertmanager 0.28 ─► ntfy.sh (push notification)
```

Semua komponen berjalan di VM 102 `curalyta-monitor` (`ops/lab/monitor/`), yang terpisah dari VM aplikasi, sehingga gangguan aplikasi tidak mematikan pemantauannya.

| Komponen | Alamat (dari laptop admin) | Fungsi |
|---|---|---|
| Grafana | http://192.168.45.30:3000 (user `admin`) | Dashboard; password di `.env` VM 102 |
| Prometheus | http://192.168.45.30:9090 | Metrik, aturan alert, kueri PromQL |
| Alertmanager | http://192.168.45.30:9093 | Routing, pengelompokan, peredaman alert |
| ntfy | aplikasi ntfy (Android/iOS) atau https://ntfy.sh, berlangganan topik `NTFY_TOPIC` | Notifikasi push |

Untuk melihat topik ntfy (nilainya rahasia, tidak ditulis di repo): `ssh curalyta@192.168.45.30 'sudo grep NTFY_TOPIC /opt/curalyta/ops/lab/monitor/.env'`.

## 2. Target yang dipantau (11 target, semua UP)

| Job | Target | Isi |
|---|---|---|
| `node` | 192.168.45.10/.20/.30 :9100 | CPU, memori, disk, jaringan host dan VM |
| `cadvisor` | 192.168.45.20:8080 | CPU/memori per container |
| `garage` | garage:3903 | Metrik object storage |
| `blackbox-health` | `http://192.168.45.20/health` (internal), `https://<tunnel>/health` (publik) | Indikator SLA: ketersediaan dan waktu respons |
| `blackbox-web` | `http://192.168.45.20/`, `https://<tunnel>/`, `https://curalyta-frontend.vercel.app/` | Halaman web produksi dan staging |
| `prometheus` | localhost:9090 | Pemantauan diri |

Target publik diatur lewat `file_sd` (`prometheus/targets/*.yml`), sehingga URL tunnel bisa diganti tanpa restart (`ops/lab/update-public-url.sh`).

## 3. Daftar alert dan ambang batas

| Alert | Kondisi (PromQL) | Durasi | Prioritas |
|---|---|---|---|
| LayananTidakTersedia | `probe_success{job="blackbox-health"} == 0` | 1 menit | P1 (critical) |
| WaktuResponsLambat | `probe_duration_seconds{job="blackbox-health",path="internal"} > 1` | 5 menit | P2 |
| HalamanWebGagal | `probe_success{job="blackbox-web"} == 0` | 3 menit | P2 |
| TargetMonitoringHilang | `up{job=~"node|cadvisor"} == 0` | 2 menit | P2 |
| CPUTinggi | CPU host > 80% | 5 menit | P2 |
| MemoriTinggi | memori terpakai > 85% | 5 menit | P2 |
| DiskHampirPenuh | filesystem terpakai > 80% | 5 menit | P2 |
| BackupDatabaseTerlambat | `time() - curalyta_backup_last_success_timestamp_seconds > 26 jam` | 10 menit | P2 (menjaga RPO) |

Aturan routing: dikelompokkan per `alertname` + `instance`; critical dikirim setelah 10 detik dan diulang tiap 1 jam, lainnya setelah 30 detik dan diulang tiap 3 jam; notifikasi *resolved* ikut dikirim. Inhibit: saat `LayananTidakTersedia` aktif, `WaktuResponsLambat` untuk endpoint yang sama diredam.

Saluran notifikasi. ntfy.sh menolak penerusan email dari pengirim anonim (error 40053, ditemukan saat uji). Karena itu dibuat akun ntfy gratis. Email `abrarrayhan8@gmail.com` diverifikasi di akun tersebut, lalu token aksesnya dipasang dengan `ops/lab/set-ntfy-token.sh`: token diketik tersembunyi, diperiksa ke ntfy.sh, dan disimpan di `.env` VM 102 (izin 600). Sejak 25 Oktober 2026 pukul 14:17 WIB alert dikirim sebagai push notification dan email, dibuktikan dengan email uji yang diterima (`docs/screenshot/U5-05b-ntfy-email-alert.png`). Kuota akun gratis 5 email per hari, sehingga push tetap menjadi saluran utama.

## 4. Cara membaca dashboard Grafana

Buka Dashboards → Curalyta → Curalyta, SLA & Infrastruktur. Rentang waktu di kanan atas menentukan periode perhitungan panel SLA.

| Panel | Cara membaca | Tindakan |
|---|---|---|
| Status /health sekarang | Hijau UP / merah DOWN | Merah → SOP dukungan teknis, P1 |
| Ketersediaan (rentang dashboard) | Persentase `probe_success` internal pada rentang terpilih; hijau ≥ 99,5%, oranye ≥ 99%, merah < 99% | Merah → analisis penyimpangan (bagian 6) |
| Target SLA | 99% | Pembanding |
| Latensi /health sekarang & p95 | Hijau < 0,5 s, oranye < 1 s, merah ≥ 1 s | p95 merah → cek CPU/memori dan log Nginx |
| Umur backup DB | Detik sejak backup sukses terakhir; merah > 26 jam | Jalankan `backup-db.sh`, cek log |
| Status uptime check | Garis 1 = sehat, 0 = gagal, per endpoint | Turun ke 0 menandai insiden |
| Latensi uptime check | Garis merah = batas 1 detik | - |
| CPU / Memori / Disk | Garis merah = ambang alert (80/85/80%) | Rencana scale up (`KEBUTUHAN_PERANGKAT_KERAS.md`) |
| Jaringan | rx positif, tx negatif (bit/s) | Lonjakan tak wajar → periksa log akses |
| Container | CPU & memori per container | Container boros → `docker stats`, log |

## 5. Hasil laporan SLA (dijalankan 25 Oktober 2026 pukul 11:54 WIB)

Perintah: `ops/laporan-sla.sh 24h` (file asli: `docs/bukti/laporan-sla-2026-10-25.md`).

| Indikator | Target | Aktual | Status |
|---|---|---|---|
| Ketersediaan | ≥ 99% | 62,28% | Tidak terpenuhi |
| Waktu respons /health p95 (probe sukses) | < 1 s | 0,426 s (rata-rata 0,113 s) | Terpenuhi |
| Umur backup database (RPO) | < 24 jam | 1,8 jam | Terpenuhi |

Data mencakup 167 pemeriksaan (±2,3 jam sejak monitoring aktif pukul 09:31), 63 gagal (±31,5 menit).

### 5.1 Analisis penyimpangan ketersediaan

Rincian kegagalan dari Prometheus (`probe_success` internal = 0):

| Rentang (WIB) | Sampel | Penyebab | Klasifikasi |
|---|---|---|---|
| 09:31–09:51 | 40 | Monitoring aktif sebelum aplikasi pertama kali di-deploy | Pra-peluncuran |
| 10:10 | 1 | Container backend dibuat ulang saat deploy CI/CD | Deploy (perlu strategi tanpa downtime) |
| 10:31–10:36 | 11 | Simulasi insiden pertama, lalu laptop host tidur | Simulasi + gangguan host |
| 11:38–11:52 | 11 | Simulasi insiden ulang dan final, deploy bersinggungan | Simulasi terencana |

- Tanpa periode pra-peluncuran: 23 gagal dari 127 sampel → ±81,9%.
- Bila simulasi terencana diperlakukan sebagai pemeliharaan terencana (pengecualian `SLA.md` bagian 3), sisa downtime tidak terencana hanya deploy (1 sampel) → ±99,0%.
- Celah pemantauan: saat laptop tidur ±1 jam (10:36–11:32), seluruh lab, termasuk Prometheus, ikut berhenti sehingga tidak ada data. Downtime nyata itu tidak tercatat. Pemantauan dari dalam host yang sama tidak dapat mendeteksi matinya host.

Temuan tambahan saat pengambilan screenshot (13:00 WIB):

- Jalur publik (quick tunnel) sempat gagal pukul 11:58–12:05 dan 12:52–12:55, sementara probe internal tetap UP. Log `cloudflared` mencatat `datagram manager error: timeout: no recent network activity` lalu koneksi terdaftar ulang ke edge `sin02`. Penyebabnya gangguan koneksi tunnel ke Cloudflare (pihak ketiga), bukan aplikasi. Quick tunnel hanya memakai satu koneksi dan tidak memiliki SLA, sehingga ketersediaan jalur publik (±79%) lebih rendah daripada jalur internal.
- Panel "Container aplikasi (cAdvisor)" kosong sejak awal. cAdvisor v0.52.1 tidak bisa membaca layer container pada Docker 29 yang memakai image store containerd (`failed to identify the read-write layer ID`). Perbaikan: naik ke cAdvisor v0.55.1 (commit `4c168a2`), diuji dulu dengan container sementara, lalu diterapkan. Metrik kelima container muncul kembali mulai 13:03 WIB.

### 5.2 Tindak lanjut

1. Pasang uptime check eksternal (mis. UptimeRobot/Better Stack paket gratis, dari beberapa region) ke URL publik, agar matinya host tetap terdeteksi.
2. Cegah laptop host tidur saat terhubung daya.
3. Kurangi downtime saat deploy: jalankan kontainer backend baru dan pastikan sehat sebelum yang lama dihentikan (blue-green / dua replika di belakang Nginx).
4. Umumkan jendela pemeliharaan sebelum simulasi agar terpisah dari downtime tidak terencana.
5. Ukur ulang setelah 30 hari operasi normal untuk laporan bulanan.

## 6. Prosedur analisis penyimpangan SLA

1. Bukti: jalankan `ops/laporan-sla.sh <periode>`; ambil rentang kegagalan dari Prometheus; kumpulkan log insiden, log deploy (`/var/log/curalyta/curalyta-deploy.log`), dan log Nginx.
2. Evaluasi: bandingkan dengan target; pisahkan pengecualian (pemeliharaan terencana, gangguan pihak ketiga) dari downtime tidak terencana.
3. Tindak lanjut: RCA untuk setiap insiden P1/P2 (`docs/LAPORAN_INSIDEN_001.md`), tetapkan perbaikan beserta pemilik dan tenggat.
4. Laporan: simpan laporan di `docs/bukti/laporan-sla-<tanggal>.md` dan ringkasan di dokumen ini.
