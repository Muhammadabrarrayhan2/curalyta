# Service Level Agreement (SLA) Layanan Curalyta

Unit kompetensi: J.631120.014.01, Memantau sarana dan prasarana agar bisa digunakan oleh user sesuai dengan SLA

| Atribut | Nilai |
|---|---|
| Layanan | Curalyta (web dan API) di lingkungan produksi lab: VM `curalyta-app` 192.168.45.20 dan URL HTTPS publik |
| Penyedia | Tim operasional Curalyta (L1 helpdesk, L2 operator infrastruktur, L3 pengembang) |
| Pengguna | Dokter, pasien, dan admin Curalyta |
| Berlaku sejak | 25 Oktober 2026 |
| Periode pengukuran | Bulan kalender (dilaporkan juga harian/mingguan selama masa uji) |

## 1. Indikator dan target

| No | Indikator (SLI) | Target (SLO) | Cara ukur |
|---|---|---|---|
| 1 | Ketersediaan layanan | ≥ 99,0% per bulan | Rata-rata `probe_success` uptime check `GET /health` (Blackbox Exporter, setiap 30 detik, jalur internal `http://192.168.45.20/health`) |
| 2 | Waktu respons `/health` | < 1 detik (p95 per periode) | `probe_duration_seconds` dari uptime check yang sama |
| 3 | RPO (kehilangan data maksimum) | 24 jam | Backup database harian 02:00 WIB; metrik `curalyta_backup_last_success_timestamp_seconds` |
| 4 | RTO (waktu pemulihan maksimum) | 1 jam | Diuji dengan simulasi restore (`docs/LAPORAN_INSIDEN_001.md`) |
| 5 | Respons awal insiden | P1 15 menit, P2 30 menit, P3 4 jam, P4 1 hari kerja | Waktu tiket/alert sampai respons pertama (`docs/SOP_DUKUNGAN_TEKNIS.md`) |

### Arti target ketersediaan 99%

| Periode | Downtime maksimum yang diizinkan |
|---|---|
| Per hari | 14 menit 24 detik |
| Per minggu | 1 jam 40 menit 48 detik |
| Per bulan (30,4 hari) | 7 jam 18 menit |

Rumus: `ketersediaan = (waktu layanan − downtime tidak terencana) / waktu layanan × 100%`.

Layanan dianggap tidak tersedia pada satu titik pemeriksaan bila `GET /health` tidak mengembalikan HTTP 200 dengan body `"status":"ok"` dalam 10 detik. Endpoint ini memeriksa koneksi database (`SELECT 1`), sehingga database mati juga dihitung sebagai tidak tersedia.

## 2. Jam layanan

| Komponen | Jam |
|---|---|
| Layanan aplikasi | 24 jam × 7 hari |
| Pemantauan otomatis dan alert | 24 jam × 7 hari |
| Dukungan L1 (helpdesk) | Senin–Jumat 08.00–17.00 WIB; di luar jam itu hanya P1 |
| Dukungan L2/L3 | On-call untuk P1/P2 |
| Jendela pemeliharaan terencana | Minggu 01.00–03.00 WIB, diumumkan minimal 24 jam sebelumnya |

## 3. Pengecualian (tidak dihitung sebagai downtime)

1. Pemeliharaan terencana dalam jendela pemeliharaan yang sudah diumumkan.
2. Gangguan pada layanan pihak ketiga di luar kendali (Groq, Cloudflare, GitHub, Vercel, ntfy.sh), selama layanan inti (`/health`) tetap sehat. Fitur AI yang gagal karena Groq tidak membuat layanan dianggap tidak tersedia.
3. Gangguan akibat kesalahan konfigurasi atau penyalahgunaan di sisi pengguna.
4. Kejadian kahar (bencana, padam listrik total di lokasi host).

Catatan untuk lingkungan lab: host berjalan di laptop, sehingga laptop mati atau tidur menyebabkan downtime nyata yang tetap dicatat di laporan, tidak disembunyikan.

## 4. Tingkat keparahan insiden

| Tingkat | Definisi | Contoh | Respons awal | Target pulih |
|---|---|---|---|---|
| P1 (Critical) | Layanan utama tidak dapat dipakai oleh semua pengguna | `/health` gagal, database mati, VM aplikasi mati | 15 menit | 1 jam (RTO) |
| P2 (High) | Fungsi utama terganggu atau kinerja di bawah target | Login gagal sebagian, p95 > 1 detik, CPU/memori/disk melewati ambang, backup gagal | 30 menit | 4 jam |
| P3 (Medium) | Dampak terbatas, ada jalan pintas | Satu fitur sekunder error (berita, unggah format tertentu) | 4 jam | 2 hari kerja |
| P4 (Low) | Gangguan kecil atau permintaan informasi | Tampilan, pertanyaan pemakaian | 1 hari kerja | Sesuai jadwal rilis |

## 5. Pemantauan dan pelaporan

- Otomatis: Prometheus + Blackbox Exporter memeriksa `/health` setiap 30 detik (jalur internal dan publik). Alert dikirim ke ntfy.sh (push + email) bila kondisi melewati ambang (`docs/PEMANTAUAN.md`).
- Dashboard: Grafana "Curalyta, SLA & Infrastruktur" menampilkan status, ketersediaan pada rentang waktu yang dipilih, latensi, dan umur backup.
- Laporan: `ops/laporan-sla.sh <periode>` menghasilkan ringkasan pencapaian dalam Markdown dari data Prometheus.
- Penyimpangan SLA: setiap pelanggaran target dianalisis dengan langkah bukti → evaluasi terhadap target dan pengecualian → tindak lanjut (RCA, perbaikan) → laporan insiden.

## 6. Hasil pencapaian SLA

Hasil terukur dari `ops/laporan-sla.sh` dicantumkan di `docs/PEMANTAUAN.md` bagian "Hasil laporan SLA", dan file aslinya disimpan di `docs/bukti/`.
