# Analisis Awal Repositori Curalyta

| Atribut | Nilai |
|---|---|
| Repositori | https://github.com/Muhammadabrarrayhan2/curalyta |
| Commit yang dianalisis | `d2ec418` (Update README.md) |
| Tanggal analisis | 24 Oktober 2026 |
| Tujuan | Menyiapkan Curalyta untuk deployment cloud sebagai bukti portofolio skema Insinyur Cloud Computing. Target awal adalah Google Cloud Platform; karena billing tidak dapat diaktifkan, deployment akhir memakai lab IaaS Proxmox, PaaS Vercel, dan SaaS GitHub Actions (lihat `DEPLOYMENT.md` bagian 0). |

Dokumen ini mencatat kondisi repositori sebelum perubahan deployment. Setiap temuan diberi kode (T-xx) dan dirujuk oleh rencana tindak lanjut di bagian akhir.

## 1. Struktur folder

```
curalyta/
├── backend/                 API Express + Prisma (TypeScript) - aplikasi utama
│   ├── prisma/              schema.prisma (14 model), migrations/20260422000000_init, seed.ts
│   ├── src/
│   │   ├── config/          pemuatan environment variable (index.ts, env-path.ts)
│   │   ├── lib/             prisma client, logger, errors, groq client
│   │   ├── middleware/      auth (JWT), rate limit, validasi, error handler
│   │   ├── modules/         15 modul: admin, ai, appointments, auth, doctors, documents,
│   │   │                    ml, news, notifications, observations, patients, public,
│   │   │                    tasks, users, vitals
│   │   ├── routes/          router /api
│   │   └── server.ts        bootstrap Express
│   ├── test/                node:test (*.test.cjs)
│   └── docker-entrypoint.sh migrasi Prisma lalu start server
├── frontend/                SPA React + Vite + Tailwind (TypeScript) - aplikasi utama
│   ├── src/                 pages (admin, auth, doctor, patient), components, store, lib
│   ├── vercel.json          rewrite /api ke Render (terikat Vercel)
│   └── vite.config.ts/.js   proxy dev /api -> localhost:4000 (ada duplikat .js)
├── docker/                  backend.Dockerfile, frontend.Dockerfile, nginx.conf
├── docker-compose.yml       postgres + backend + frontend
├── src/, index.html,        PROTOTIPE LAMA (React JSX + vitest) di root; tidak dipakai
│   vite.config.js           oleh backend/frontend dan tidak ikut di-deploy
├── scripts/fix-imports.cjs  skrip utilitas prototipe
└── docs/superpowers/        catatan desain/rencana lama (Neon, R2, Render, Vercel)
```

Root `package.json` adalah npm workspace (`backend`, `frontend`) dengan `engines.node >= 18`.

## 2. Stack teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18.3, TypeScript 5.6, Vite 5.4, Tailwind CSS 3.4, TanStack Query 5, Zustand, React Router 6, Axios, Chart.js |
| Backend | Node.js (Docker: `node:20-alpine`), Express 4.21, TypeScript, Prisma ORM 5.22, Zod, Helmet, CORS, express-rate-limit, Morgan, Multer, bcryptjs, jsonwebtoken |
| Database | PostgreSQL 16 (compose lokal); produksi lama memakai Neon (serverless PostgreSQL) |
| AI | Groq API dengan rotasi multi-key (`GROQ_API_KEYS`), model `openai/gpt-oss-120b` (teks) dan `qwen/qwen3.8-27b` (visi) |
| Hosting lama | Frontend di Vercel, backend di Render, database di Neon |

## 3. Konfigurasi database

- `backend/prisma/schema.prisma` memakai `url = env("DATABASE_URL")` dan `directUrl = env("DIRECT_URL")`.
- T-01: `DIRECT_URL` wajib ada saat Prisma CLI dijalankan (`migrate deploy`). `docker-compose.yml` lama tidak mengisi `DIRECT_URL`, sehingga migrasi di container berisiko gagal. `DIRECT_URL` diperlukan karena konfigurasi lama memakai pooler Neon; untuk PostgreSQL di VM nilainya sama dengan `DATABASE_URL`.
- Migrasi: satu migrasi awal `20260422000000_init`. Seed hanya membuat akun admin default.
- T-02: `.env` lokal mengarah ke Neon (`*.neon.tech`). Endpoint Neon tersebut sudah tidak dapat dijangkau (diuji 23 Oktober 2026), sehingga produksi lama praktis tidak berjalan.

## 4. Docker dan Compose yang sudah ada

| Berkas | Kondisi | Temuan |
|---|---|---|
| `docker/backend.Dockerfile` | Multi-stage, user non-root `curalyta`, `node:20-alpine` | T-03: `node_modules` produksi menyalin seluruh devDependencies (ukuran image besar); tidak ada `HEALTHCHECK`. |
| `docker/frontend.Dockerfile` | Multi-stage, runtime `nginx:1.27-alpine` | T-04: nginx berjalan sebagai root; konfigurasi proxy `/api` tertanam di image frontend. |
| `docker/nginx.conf` | SPA + proxy `/api` ke `backend:4000` | T-05: tidak ada log berformat waktu respons; header keamanan belum lengkap (HSTS, Permissions-Policy). |
| `docker-compose.yml` | postgres, backend, frontend | T-06: PostgreSQL membuka port 5432 dan backend membuka port 4000 ke host, sehingga terekspos jika dijalankan di VM publik. Tidak ada reverse proxy terpisah dan tidak ada healthcheck untuk backend/frontend. |
| `.dockerignore` | Tidak ada di repo | T-07: `.gitignore` justru mengabaikan `.dockerignore`, sehingga build context mengirim `node_modules` dan `.env`. Ini risiko kebocoran secret ke image. |

## 5. Secret, URL, dan port yang di-hardcode

| Kode | Lokasi | Nilai | Risiko |
|---|---|---|---|
| T-08 | `backend/src/config/index.ts`, `prisma/seed.ts`, `docker-compose.yml`, README | Password admin default `Curalyta#2025` sebagai fallback | Jika `ADMIN_PASSWORD` tidak diisi, akun admin produksi memakai password publik. |
| T-09 | `docker-compose.yml`, `.env.docker.example`, README | Password database default `curalyta_dev_pw` | Database produksi bisa memakai password yang tertulis di repo publik. |
| T-10 | `frontend/vercel.json` | `https://curalyta-backend.onrender.com` | URL backend di-hardcode untuk Vercel. |
| T-11 | `backend/src/config/index.ts` | `CORS_ORIGIN` default `http://localhost:5173` | Aman untuk dev; produksi wajib diisi eksplisit. |
| T-12 | `vite.config.ts` | Proxy dev `http://localhost:4000` | Hanya untuk dev; frontend memanggil API secara relatif (`baseURL: '/api'`), sehingga tidak perlu URL absolut di build. |
| T-13 | Port | Backend 4000 (default kode), `.env` lokal 10000 (sisa Render), frontend dev 5173, compose 8080/4000/5432 | Perlu disatukan lewat environment variable. |

Hasil pemindaian riwayat git (`git log --all -p`): tidak ditemukan secret asli yang pernah di-commit. Yang ada hanya placeholder (`USER:PASSWORD@...`, `sk-ant-api03-...`). File `.env` sudah tercantum di `.gitignore`.

## 6. Cara JWT secret dimuat

- `config.auth.jwtSecret = required('JWT_SECRET')`: aplikasi berhenti saat start bila `JWT_SECRET` kosong. Ini perilaku yang baik (fail fast).
- `dotenv` memuat `backend/.env`, lalu `.env` di root sebagai cadangan (`config/env-path.ts`). Variabel yang sudah ada di environment proses tidak ditimpa, sehingga nilai dari Docker/Compose selalu menang.
- JWT ditandatangani dan diverifikasi di `middleware/auth.ts` dengan masa berlaku `JWT_EXPIRES_IN` (default `7d`).
- T-14: tidak ada panjang minimum yang dipaksakan; template berisi nilai contoh. Untuk produksi, secret dibangkitkan acak (64 byte hex) langsung di VM.

## 7. Bagian yang terikat ke Vercel/Render/Neon

1. `frontend/vercel.json`: rewrite `/api/*` ke Render.
2. README baris 10: tautan `curalyta-frontend-hxd7.vercel.app`.
3. Deployment GitHub "Production – curalyta-frontend" (integrasi Vercel di GitHub).
4. `DIRECT_URL` di Prisma: kebutuhan pooler Neon.
5. `.env` lokal: `PORT=10000` (konvensi Render) dan `DATABASE_URL` Neon.
6. `docs/superpowers/plans|specs/*`: rencana deployment Neon, R2, Render, dan Vercel.

## 8. Endpoint kesehatan

- `GET /` dan `GET /api/health` hanya mengembalikan JSON statis. T-15: tidak ada pengecekan koneksi database dan tidak ada waktu respons, sehingga belum layak dijadikan target uptime check SLA.

## 9. Rencana tindak lanjut (Tahap 2)

| Temuan | Tindakan |
|---|---|
| T-01 | Compose mengisi `DIRECT_URL` = `DATABASE_URL`. |
| T-03, T-04 | Dockerfile production baru: multi-stage, `npm ci`, hanya dependency produksi + Prisma CLI, user non-root, `HEALTHCHECK`. Frontend memakai `nginxinc/nginx-unprivileged` (non-root). |
| T-05, T-06 | Service `nginx` terpisah sebagai reverse proxy, satu-satunya yang membuka port 80/443. Backend, PostgreSQL, dan frontend hanya di jaringan internal Docker. Log akses berformat JSON dengan `request_time` dan `upstream_response_time`. |
| T-07 | Tambah `.dockerignore`, lalu hapus `.dockerignore` dari `.gitignore`. |
| T-08, T-09, T-14 | Compose mewajibkan `POSTGRES_PASSWORD`, `JWT_SECRET`, dan `ADMIN_PASSWORD` (`${VAR:?}`). Nilai produksi dibangkitkan acak di VM. Logika bisnis tidak diubah. |
| T-10 | `vercel.json` lama (rewrite ke Render) dihapus; rewrite baru dibuat ke API produksi lab untuk staging Vercel. |
| T-13 | Semua port dan origin melalui environment variable; `.env.example` lengkap di root. |
| T-15 | `GET /health` dan `GET /api/health` mengecek `SELECT 1` ke database dan mengembalikan `status`, `database`, `responseTimeMs`, `timestamp`; HTTP 503 bila database gagal. |
| Folder `ops/` | `backup-db.sh`, `restore-db.sh`, `deploy.sh`, `healthcheck.sh`, `laporan-sla.sh`, dan `ops/lab/` untuk provisioning lab Proxmox. |
