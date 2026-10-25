# Curalyta: Clinical Intelligence Platform

Curalyta adalah platform layanan kesehatan untuk dokter, pasien, dan admin. Dokter mengelola pasien, rekam medis SOAP, tanda vital dengan skor NEWS2, jadwal, dan tugas harian. Pasien dapat mencari dokter, membuat janji, dan melihat riwayatnya sendiri. Asisten AI membantu dokter membuat ringkasan klinis dan menjawab pertanyaan umum pasien melalui fitur Tanya AI.

Repositori ini juga menjadi portofolio sertifikasi BNSP skema Insinyur Cloud Computing (SKKNI No. 456 Tahun 2015). Aplikasi dijalankan pada lab IaaS Proxmox, dipantau sesuai SLA, dan dirilis melalui CI/CD. Pemetaan ke unit kompetensi ada di [docs/PEMETAAN_UNIT_KOMPETENSI.md](docs/PEMETAAN_UNIT_KOMPETENSI.md).

Approved by Dr. Muammar Riyandi

Status lab: dimatikan dengan aman pada 25 Oktober 2026 pukul 16:55 WIB setelah seluruh tahap selesai. Sebelum dimatikan, backup database terakhir dibuat (`s3://curalyta-db-backups/postgres/curalyta-20261025T095336Z.dump`) dan laporan SLA penutup disimpan di [docs/bukti/laporan-sla-penutupan-2026-10-25.md](docs/bukti/laporan-sla-penutupan-2026-10-25.md). Selama lab mati, URL quick tunnel dan staging Vercel (yang meneruskan `/api` ke tunnel) tidak dapat diakses. Cara menyalakan kembali ada di [docs/SOP_OPERASIONAL.md](docs/SOP_OPERASIONAL.md) bagian 1; setelah menyala, jalankan `ops/lab/update-public-url.sh` karena URL tunnel akan berubah.

## Fitur

| Peran | Fitur |
|---|---|
| Dokter | Dashboard harian dengan pasien prioritas; manajemen pasien dan catatan SOAP; tanda vital dengan NEWS2 otomatis; analisis anomali dan tren; AI Summary dan AI Chat per pasien; tugas harian; janji temu; unggah dokumen medis |
| Pasien | Pencarian dokter, janji temu, riwayat medis, profil (alergi, kondisi kronis), Tanya AI tanpa login (teks dan foto) |
| Admin | Statistik sistem, verifikasi dokter (STR/SIP), manajemen pengguna, audit log, status AI |

Fitur AI memakai Groq API. Variabel `GROQ_API_KEYS` dapat berisi beberapa key yang dipisah koma. Backend memakai key secara bergiliran dan otomatis pindah ke key lain bila satu key terkena batas pemakaian atau ditolak. Tanpa key, aplikasi tetap berjalan dan fitur AI dinonaktifkan.

## Arsitektur singkat

```
Pengguna --HTTPS--> Cloudflare Tunnel --> VM curalyta-app (Proxmox, 192.168.45.20)
                                            Nginx --> frontend (React, Nginx non-root)
                                                  `-> backend (Express + Prisma) --> PostgreSQL 16
Staging (Vercel) --/api--> Cloudflare Tunnel --> VM curalyta-app
VM curalyta-monitor (192.168.45.30): Prometheus, Grafana, Alertmanager -> ntfy, Blackbox, Garage (S3)
GitHub Actions: test -> build image ke GHCR -> deploy lewat runner self-hosted di VM curalyta-app
```

Lab berjalan di atas VMware Workstation dan Proxmox VE 9.2 (KVM) pada laptop. Diagram lengkap ada di [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md).

| Lingkungan | Alamat |
|---|---|
| Produksi (lab, HTTPS publik) | https://produces-solving-teddy-itself.trycloudflare.com. URL quick tunnel berubah setiap tunnel di-restart; nilai terkini tersimpan di `/opt/curalyta/.public-url` pada VM aplikasi. |
| Staging (PaaS Vercel) | https://curalyta-frontend.vercel.app |
| Health check | `GET /health` dan `GET /api/health` |

## Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand |
| Backend | Node.js 20, Express, TypeScript, Prisma, Zod, JWT, bcrypt, Helmet |
| Database | PostgreSQL 16 |
| AI | Groq (`openai/gpt-oss-120b` untuk teks, `qwen/qwen3.8-27b` untuk gambar) |
| Container | Docker multi-stage dengan user non-root, Docker Compose, Nginx sebagai reverse proxy |
| Infrastruktur | Proxmox VE 9.2, Ubuntu 22.04, Cloudflare Tunnel, Vercel |
| CI/CD | GitHub Actions, GitHub Container Registry |
| Pemantauan | Prometheus, Grafana, Alertmanager, Blackbox Exporter, node_exporter, cAdvisor |
| Backup | `pg_dump` ke Garage (S3), vzdump Proxmox, snapshot VM |

## Menjalankan secara lokal

### Dengan Docker Compose (mirip produksi)

```bash
cp .env.example .env
# isi POSTGRES_PASSWORD, JWT_SECRET (openssl rand -hex 64), ADMIN_PASSWORD, CORS_ORIGIN
docker compose up -d --build --wait
curl http://localhost/health
```

Compose menjalankan empat layanan: `nginx` (satu-satunya yang membuka port 80/443), `frontend`, `backend`, dan `postgres` dengan volume bernama. Migrasi database berjalan otomatis saat backend dinyalakan (`prisma migrate deploy`), dan akun admin dibuat dari `ADMIN_EMAIL` serta `ADMIN_PASSWORD`.

### Mode pengembangan

Prasyarat: Node.js 20 dan PostgreSQL 16.

```bash
npm install
cp backend/.env.example backend/.env      # isi DATABASE_URL, JWT_SECRET, GROQ_API_KEYS (opsional)
npm run db:migrate --workspace=backend
npm run dev                                # backend :4000, frontend :5173
```

Pengujian:

```bash
npm test --workspace=backend
npm test --workspace=frontend
```

## Variabel lingkungan utama

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL; `DIRECT_URL` otomatis sama bila tidak diisi |
| `JWT_SECRET` | Wajib, acak, minimal 32 karakter |
| `CORS_ORIGIN` | Daftar origin yang diizinkan, dipisah koma |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Akun admin awal |
| `GROQ_API_KEYS`, `GROQ_MODEL`, `GROQ_VISION_MODEL` | Konfigurasi AI (opsional) |
| `BACKUP_BUCKET`, `BACKUP_S3_*` | Tujuan backup database (object storage S3) |
| `REGISTRY`, `BACKEND_IMAGE`, `FRONTEND_IMAGE` | Image yang dipakai saat deploy |

Daftar lengkap ada di [.env.example](.env.example). File `.env` tidak pernah di-commit.

## Struktur repositori

```
backend/            API Express + Prisma (src/, prisma/, test/)
frontend/           SPA React + Vite
docker/             Dockerfile production dan konfigurasi Nginx
ops/                Skrip operasional: backup, restore, deploy, healthcheck, laporan SLA
ops/lab/            Provisioning lab: Proxmox, VM aplikasi, VM monitoring, runner, tunnel
.github/workflows/  Pipeline CI/CD
docs/               Dokumentasi portofolio BNSP dan bukti eksekusi (docs/bukti/)
```

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [ANALISIS_AWAL](docs/ANALISIS_AWAL.md) | Kondisi repositori sebelum disiapkan untuk deployment |
| [KONSEP_CLOUD](docs/KONSEP_CLOUD.md) | Unit 1: terminologi dan konsep cloud |
| [TEKNOLOGI_CLOUD](docs/TEKNOLOGI_CLOUD.md) | Unit 2: teknologi yang dipakai dan alternatifnya |
| [KEBUTUHAN_PERANGKAT_KERAS](docs/KEBUTUHAN_PERANGKAT_KERAS.md) | Unit 3: analisis kebutuhan perangkat keras dari data terukur |
| [AKTIVITAS_RUTIN](docs/AKTIVITAS_RUTIN.md) | Unit 4: checklist IaaS, PaaS, SaaS dan log pelaksanaan |
| [SLA](docs/SLA.md) dan [PEMANTAUAN](docs/PEMANTAUAN.md) | Unit 5: definisi SLA, pemantauan, hasil laporan SLA |
| [SOP_DUKUNGAN_TEKNIS](docs/SOP_DUKUNGAN_TEKNIS.md) | Unit 6: alur tiket, troubleshooting, eskalasi |
| [LAPORAN_INSIDEN_001](docs/LAPORAN_INSIDEN_001.md) | Simulasi insiden INC-001 dan insiden nyata INC-002 |
| [ARSITEKTUR](docs/ARSITEKTUR.md) | Diagram topologi, CI/CD, dan alur data |
| [DEPLOYMENT](docs/DEPLOYMENT.md) | Langkah deployment yang dijalankan beserta alasannya |
| [SOP_OPERASIONAL](docs/SOP_OPERASIONAL.md) | Menyalakan dan mematikan layanan, deploy, rollback, backup, restore, rotasi secret, teardown |
| [PEMETAAN_UNIT_KOMPETENSI](docs/PEMETAAN_UNIT_KOMPETENSI.md) | Pemetaan setiap unit kompetensi ke bukti |
| [DAFTAR_SCREENSHOT](docs/DAFTAR_SCREENSHOT.md) | Screenshot yang perlu diambil per unit |
| [docs/bukti/](docs/bukti/) | Log eksekusi asli: provisioning, CI/CD, backup, uji beban, insiden, laporan SLA |

## Keamanan

Password disimpan dalam bentuk hash bcrypt, sesi memakai JWT, dan akses dibatasi per peran (ADMIN, DOCTOR, PATIENT). Endpoint login dan API diberi rate limit, dan Nginx menambahkan header keamanan. Semua container aplikasi berjalan sebagai user non-root. Secret hanya disimpan di `.env` berizin 600; file itu tidak masuk repositori maupun image karena dikecualikan oleh `.gitignore` dan `.dockerignore`.
