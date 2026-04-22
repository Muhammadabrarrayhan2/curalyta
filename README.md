# Curalyta — Clinical Intelligence Platform

> Platform kesehatan modern yang membantu dokter bekerja lebih efektif, lebih terstruktur, dan didukung AI + Machine Learning untuk mendukung keputusan klinis.

![Status](https://img.shields.io/badge/status-production--ready-success)
![Stack](https://img.shields.io/badge/stack-Node%20%2B%20React%20%2B%20Prisma-blue)

> **✨ Pembaruan v1.1**: Auto-seed admin saat startup, landing page pasien gaya Alodokter, RSS feed berita kesehatan otomatis (Detik/Kompas/CNN), dan 5-mode auth terpisah (Pasien/Dokter/Admin).

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Arsitektur](#-arsitektur)
- [Stack Teknis](#-stack-teknis)
- [Prasyarat](#-prasyarat)
- [Setup Lokal (Development)](#-setup-lokal-development)
- [Setup Docker (Production-like)](#-setup-docker-production-like)
- [Login Default](#-login-default)
- [Struktur Proyek](#-struktur-proyek)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Fitur AI (Opsional)](#-fitur-ai-opsional)
- [Keamanan](#-keamanan)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Fitur

### Untuk Dokter
- **Dashboard harian** dengan ringkasan pasien prioritas, tugas, dan appointment hari ini
- **Manajemen pasien lengkap** — rekam medis terstruktur dengan SOAP notes
- **Vital signs tracking** dengan perhitungan **NEWS2 otomatis** (National Early Warning Score 2)
- **ML-powered insights**: anomaly detection (z-score), trend analysis (linear regression), symptom clustering
- **AI Clinical Assistant** (Claude) — ringkasan pasien, chat kontekstual, rekomendasi non-diagnostik
- **Daily to-do list** dengan priority scoring dan keterkaitan langsung ke pasien
- **Appointment management** dengan auto-notifikasi ke pasien
- **Upload dokumen** (hasil lab, rontgen, dsb) dengan kontrol akses ketat

### Untuk Pasien
- **Dashboard pribadi** — melihat dokter terhubung, vital signs terakhir, appointment mendatang
- **Riwayat medis** — melihat SOAP notes dan vital signs dari dokter
- **Profile management** — update data diri, alergi, kondisi kronis
- Pengalaman ringan dan ramah

### Untuk Admin
- **System-wide dashboard** dengan statistik pengguna
- **Verifikasi dokter** — review dan approve/reject registrasi dokter (cek STR/SIP)
- **User management** — aktifkan/nonaktifkan akun
- **Audit log** — melihat seluruh aktivitas sistem
- **System info** — status AI, konfigurasi, dsb.

---

## 🏗 Arsitektur

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENT                            │
│  React + Vite + TypeScript + Tailwind + React Query      │
│  Role-based routing: /doctor, /patient, /admin           │
└─────────────────────────┬────────────────────────────────┘
                          │ REST + JWT (Bearer)
                          │
┌─────────────────────────┴────────────────────────────────┐
│                    API GATEWAY                           │
│              Express + Helmet + Rate Limit               │
└──┬──────────┬──────────┬──────────┬──────────┬───────────┘
   │          │          │          │          │
┌──▼──┐  ┌───▼──┐  ┌────▼───┐  ┌───▼───┐  ┌──▼──┐
│Auth │  │Clinic│  │Admin   │  │AI Svc │  │ML   │
│JWT  │  │CRUD  │  │Mgmt    │  │Claude │  │NEWS2│
└──┬──┘  └───┬──┘  └────┬───┘  └───┬───┘  └──┬──┘
   │         │          │          │          │
   └─────────┴──────────┼──────────┴──────────┘
                        │
            ┌───────────▼────────────┐
            │   Prisma ORM           │
            │   PostgreSQL 16        │
            │   (14 tables)          │
            └────────────────────────┘
```

---

## 🛠 Stack Teknis

**Backend**
- Node.js 20 + TypeScript
- Express 4 (HTTP framework)
- Prisma 5 (ORM) + PostgreSQL 16
- JWT (jsonwebtoken) + bcrypt (password hashing)
- Zod (validation)
- Helmet + CORS + express-rate-limit (security)
- Multer (file uploads)
- Anthropic SDK (AI integration, optional)

**Frontend**
- React 18 + TypeScript
- Vite 5 (build tool)
- TailwindCSS 3 (styling)
- React Router 6 (SPA routing)
- TanStack Query (data fetching & caching)
- Zustand (auth store)
- Axios (HTTP client)
- Chart.js + react-chartjs-2 (vital signs charts)

**Infrastructure**
- Docker + docker-compose
- nginx (frontend serving + API proxy)
- PostgreSQL 16 (data)

---

## 📦 Prasyarat

### Untuk Setup Lokal
- **Node.js 18+** ([download](https://nodejs.org))
- **PostgreSQL 14+** (lokal atau remote) — atau gunakan Docker untuk postgres saja
- **npm 9+** (biasanya bundled dengan Node)
- (Opsional) **Anthropic API key** untuk fitur AI — dapatkan di [console.anthropic.com](https://console.anthropic.com)

### Untuk Setup Docker
- **Docker Desktop** atau **Docker Engine + Compose**

---

## 🚀 Setup Lokal (Development)

### 1. Clone & install

```bash
git clone <your-repo> curalyta
cd curalyta
npm run install:all
```

### 2. Siapkan PostgreSQL

**Opsi A — Pakai Postgres lokal yang sudah terinstall:**

```sql
CREATE USER curalyta WITH PASSWORD 'curalyta_dev_pw';
CREATE DATABASE curalyta OWNER curalyta;
```

**Opsi B — Jalankan hanya Postgres via Docker:**

```bash
docker run -d \
  --name curalyta-postgres \
  -e POSTGRES_USER=curalyta \
  -e POSTGRES_PASSWORD=curalyta_dev_pw \
  -e POSTGRES_DB=curalyta \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Konfigurasi environment backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`, minimal ubah:

```env
DATABASE_URL="postgresql://curalyta:curalyta_dev_pw@localhost:5432/curalyta?schema=public"
JWT_SECRET="ganti-jadi-secret-random-minimal-32-karakter-untuk-production"

# Opsional — biarkan kosong jika tidak pakai AI
ANTHROPIC_API_KEY=
```

> 💡 **Generate JWT secret kuat:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Migrasi database + seed admin

Dari root proyek:

```bash
npm run db:migrate     # buat semua tabel
npm run db:seed        # buat akun admin default
```

### 5. Jalankan dev server

```bash
npm run dev
```

Ini menjalankan backend & frontend secara paralel:

- **Backend API** → http://localhost:4000
- **Frontend** → http://localhost:5173
- **Admin default** → `admin@curalyta.app` / `Curalyta#2025`

---

## 🐳 Setup Docker (Production-like)

```bash
# 1. Buat .env di root
cp .env.docker.example .env

# 2. EDIT .env — minimal ganti JWT_SECRET!
nano .env     # atau editor favorit

# 3. Build & run
docker-compose up --build
```

Akses:
- **Frontend** → http://localhost:8080
- **Backend API** → http://localhost:4000
- **Database** → localhost:5432

> **✨ Admin otomatis dibuat** saat backend start pertama kali. Anda tidak perlu menjalankan seed manual. Lihat log container `curalyta-backend` untuk memastikan:
> ```
> ✓ Database connected
> ✓ Default admin created: admin@curalyta.app / Curalyta#2025
> ```

**Stop & hapus container (data tetap di volume):**
```bash
docker-compose down
```

**Reset total termasuk data:**
```bash
docker-compose down -v
```

---

## 🔑 Login Default

Setelah seed berhasil, login sebagai administrator:

| Field | Value |
|---|---|
| Email | `admin@curalyta.app` |
| Password | `Curalyta#2025` |
| Role | Administrator |

> ⚠️ **Ganti password segera setelah login pertama** via menu **Profil → Ubah password**.

**Untuk testing lengkap:**
1. Login sebagai admin
2. Logout, lalu **Daftar sebagai Dokter** (via modal registrasi) — gunakan nomor STR dummy
3. Login kembali sebagai admin → **Verifikasi** → approve dokter yang baru didaftarkan
4. Logout lagi, login sebagai dokter → mulai menambahkan pasien dan catatan klinis

---

## 📁 Struktur Proyek

```
curalyta/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 14 models (User, Doctor, Patient, VitalSign, ...)
│   │   └── seed.ts                # creates default admin
│   ├── src/
│   │   ├── config/                # env loader + validation
│   │   ├── lib/                   # prisma client, logger, errors, asyncHandler
│   │   ├── middleware/            # auth, role guards, validate, errorHandler, rateLimit
│   │   ├── modules/
│   │   │   ├── auth/              # login, register (doctor & patient), me, password
│   │   │   ├── patients/          # CRUD + priority sorting + patient self-profile
│   │   │   ├── observations/      # SOAP notes CRUD
│   │   │   ├── vitals/            # vitals CRUD + auto NEWS2 + auto-task creation
│   │   │   ├── tasks/             # doctor to-do with priority + scope filters
│   │   │   ├── appointments/      # scheduling + patient notifications
│   │   │   ├── notifications/     # inbox, mark read, delete
│   │   │   ├── doctors/           # own profile, list verified doctors
│   │   │   ├── admin/             # stats, verifications, user mgmt, audit log
│   │   │   ├── documents/         # file upload with multer
│   │   │   ├── ai/                # Anthropic integration + chat + summary
│   │   │   ├── ml/                # NEWS2, priority, anomaly (z-score), trend, symptoms
│   │   │   └── users/             # dashboard aggregator
│   │   ├── routes/index.ts        # mounts all sub-routers
│   │   └── server.ts              # Express app entry point
│   ├── uploads/                   # runtime file storage (mounted as volume in Docker)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Icon (59 SVGs), Button, Modal, Toast, Badge, ...
│   │   │   └── Shell.tsx          # sidebar + notifications + mobile drawer
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── auth/AuthModal.tsx
│   │   │   ├── doctor/            # Home, Patients, PatientDetail, Tasks, Appointments, AI, Profile
│   │   │   ├── patient/           # Home, History, Appointments, Profile
│   │   │   └── admin/             # Home, Verifications, Users, Audit, Profile
│   │   ├── store/auth.ts          # Zustand auth store
│   │   ├── lib/                   # api.ts (axios), format.ts
│   │   ├── types/index.ts         # mirrors backend types
│   │   ├── App.tsx                # role-gated router
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── package.json
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.docker.example
├── .gitignore
├── package.json                   # monorepo root with workspaces
└── README.md                      # (this file)
```

---

## 🔧 Environment Variables

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | **Required.** PostgreSQL connection string |
| `PORT` | `4000` | Backend port |
| `NODE_ENV` | `development` | `development` or `production` |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin(s), comma-separated |
| `JWT_SECRET` | — | **Required.** Min 32 chars, secret random string |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |
| `ADMIN_EMAIL` | `admin@curalyta.app` | Default admin email (used by seed) |
| `ADMIN_PASSWORD` | `Curalyta#2025` | Default admin password |
| `ANTHROPIC_API_KEY` | (empty) | Optional. If set, AI features activate |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Claude model name |
| `UPLOAD_DIR` | `./uploads` | Where documents are stored |
| `MAX_FILE_SIZE_MB` | `10` | Max upload size |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate-limit window (15 min) |
| `RATE_LIMIT_MAX` | `200` | Max requests per window |
| `AUTH_RATE_LIMIT_MAX` | `10` | Max auth attempts per window |

---

## 🔌 API Endpoints

Semua endpoint berawalan `/api` dan menggunakan **JWT Bearer token** kecuali disebutkan sebaliknya.

### Public (no auth)
- `GET /api/health` — health check
- `POST /api/auth/login`
- `POST /api/auth/register/patient`
- `POST /api/auth/register/doctor`

### Authenticated (all roles)
- `GET /api/auth/me`
- `POST /api/auth/password` — change password
- `POST /api/auth/logout`
- `GET /api/notifications` — inbox
- `POST /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `GET /api/ai/status`

### Doctor (verified only, except `/doctors/me`)
- `GET /api/dashboard/doctor`
- `GET|POST|PATCH|DELETE /api/patients[...]`
- `POST /api/patients/link`
- `GET|POST|PATCH|DELETE /api/observations[...]`
- `GET|POST|DELETE /api/vitals[...]`
- `GET /api/vitals/patient/:id/analysis`
- `GET|POST|PATCH|DELETE /api/tasks[...]`
- `GET /api/tasks/stats`
- `GET|POST|PATCH|DELETE /api/appointments[...]`
- `GET|POST|DELETE /api/documents[...]`
- `GET /api/documents/:id/download`
- `POST /api/ai/summarize`
- `POST /api/ai/chat`
- `GET|DELETE /api/ai/conversations[...]`
- `GET|PATCH /api/doctors/me`

### Patient (self-service)
- `GET /api/dashboard/patient`
- `GET|PATCH /api/me/patient/profile`
- `GET /api/me/observations`
- `GET /api/me/vitals`
- `GET /api/me/appointments`
- `GET /api/me/documents`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/system`
- `GET /api/admin/verifications?status=PENDING|APPROVED|REJECTED|ALL`
- `POST /api/admin/verifications/:doctorId` — body `{ approve: bool, reason?: string }`
- `GET /api/admin/users` — filters: `role`, `active`, `search`, `page`, `pageSize`
- `POST /api/admin/users/:id/active` — body `{ active: bool }`
- `GET /api/admin/audit?limit=100`

---

## 🤖 Fitur AI (Opsional)

Platform berjalan **sepenuhnya tanpa AI** jika `ANTHROPIC_API_KEY` kosong — endpoint AI akan mengembalikan 503 dengan pesan yang jelas, dan frontend akan menyembunyikan tombol AI.

**Aktifkan:**
1. Dapatkan API key di [console.anthropic.com](https://console.anthropic.com)
2. Set di `backend/.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
3. Restart backend

Fitur yang tersedia saat AI aktif:
- **AI Summary** — merangkum kondisi pasien berdasarkan observasi + vitals
- **Contextual Chat** — chat per pasien dengan konteks otomatis di-inject
- **Conversation history** — riwayat chat tersimpan per dokter

---

## 🔒 Keamanan

- **Password**: bcrypt dengan 12 rounds
- **JWT**: HS256, secret wajib ≥32 karakter di production
- **Rate limiting**: 10 percobaan auth/15 menit/IP, 200 request/15 menit/IP global
- **Helmet**: CSP, X-Frame-Options, dsb
- **CORS**: whitelist-based origin
- **Role isolation**: setiap endpoint memverifikasi role + ownership
- **Doctor verification**: dokter baru tidak bisa akses fitur klinis sebelum di-approve admin
- **Audit log**: setiap login, register, verifikasi, password change tercatat
- **File upload**: MIME whitelist + size limit + authorization cek per file
- **Prisma**: parameterized queries otomatis (anti SQL injection)

> ⚠️ Untuk production: selalu gunakan HTTPS, set `NODE_ENV=production`, ganti semua default password, aktifkan backup database reguler.

---

## 🔥 Troubleshooting

### "Can't reach database server"
- Pastikan PostgreSQL berjalan: `pg_isready -h localhost`
- Cek `DATABASE_URL` di `backend/.env` — user, password, host, port, nama DB
- Pastikan DB sudah dibuat (`CREATE DATABASE curalyta`)

### "Missing required environment variable: JWT_SECRET"
- Isi `JWT_SECRET` di `backend/.env`
- Minimal 32 karakter, random — jangan pakai string lemah

### Prisma migration gagal
```bash
cd backend
npx prisma migrate reset    # ⚠️ menghapus data, lalu migrate + seed ulang
```

### Frontend error "Network Error" / 500
- Pastikan backend jalan di port 4000: `curl http://localhost:4000/api/health`
- Cek console browser → Network tab untuk detail request

### Dokter tidak bisa akses pasien setelah register
- Dokter **harus diverifikasi admin** dulu. Login sebagai admin → **Verifikasi** → approve.

### Docker: backend container restart terus
```bash
docker-compose logs backend      # lihat error detail
```
Biasanya `JWT_SECRET` belum diisi di `.env`.

### Reset semua data (development)
```bash
# Local
cd backend && npx prisma migrate reset

# Docker
docker-compose down -v
docker-compose up --build
docker-compose exec backend npx tsx prisma/seed.ts
```

---

## 📝 License

Proprietary. © 2025 Curalyta. All rights reserved.

---

## 🙏 Catatan dari developer

Platform ini didesain dengan mindset **helpfulness over flashiness**: setiap fitur harus benar-benar membantu dokter di lapangan. AI digunakan sebagai *clinical support assistant*, bukan pengganti penilaian medis. Keputusan diagnostik dan terapeutik tetap menjadi wewenang dokter.

Untuk pertanyaan, bug report, atau saran fitur — buka issue di repositori atau hubungi tim pengembang.

**Selamat menggunakan Curalyta. 🩺**
