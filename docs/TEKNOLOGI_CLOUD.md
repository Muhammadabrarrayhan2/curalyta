# Teknologi Cloud Computing pada Curalyta

**Unit kompetensi:** J.631120.002.01 — Mengidentifikasi teknologi cloud computing

Dokumen ini mengidentifikasi teknologi yang dipakai, alasan pemilihannya, dan alternatifnya. Konfigurasi yang disebut ada di repositori; hasil eksekusinya ada di `docs/bukti/`.

## 1. Peta teknologi

| Lapisan | Teknologi | Peran di Curalyta | File konfigurasi |
|---|---|---|---|
| Virtualisasi tingkat 1 | VMware Workstation 17.6 (Windows 11) | Menjalankan host Proxmox sebagai VM dengan nested VT-x (`vhv.enable`) | `curalyta-pve.vmx` |
| Hypervisor cloud | Proxmox VE 9.2 (KVM + QEMU) | Menyediakan VM IaaS, firewall, snapshot, backup | `ops/lab/pve-setup.sh` |
| Sistem operasi tamu | Ubuntu Server 22.04 LTS (cloud image + cloud-init) | OS VM aplikasi dan monitoring | template VM 9000 |
| Container runtime | Docker Engine + Compose plugin | Menjalankan Nginx, frontend, backend, PostgreSQL | `docker-compose.yml` |
| Container registry | GitHub Container Registry (GHCR) | Menyimpan image `backend` dan `frontend` hasil CI | `.github/workflows/ci-cd.yml` |
| Reverse proxy | Nginx 1.27 | Satu pintu masuk: `/` → frontend, `/api` dan `/health` → backend; header keamanan; log JSON | `docker/nginx/` |
| Aplikasi | React + Vite (frontend), Node.js + Express + Prisma (backend) | Layanan Curalyta | `frontend/`, `backend/` |
| Database relasional | PostgreSQL 16 | Data pengguna, pasien, observasi, vital sign | volume `curalyta_postgres_data` |
| Block storage | LVM-thin Proxmox (`local-lvm`) | Disk virtual VM (thin provisioning) | `pvesm status` |
| Object storage | Garage v2.1 (API S3) + klien rclone | Bucket `curalyta-db-backups`, lifecycle 30 hari | `ops/lab/monitor/` |
| Jaringan virtual | VMware NAT `vmnet8` 192.168.45.0/24 + bridge Linux `vmbr0` | Jaringan privat lab (setara VPC) | Proxmox `/etc/network/interfaces` |
| Firewall | Proxmox Firewall (iptables/nftables) per VM | Aturan masuk per VM (setara security group) | `/etc/pve/firewall/101.fw`, `102.fw` |
| Akses publik | Cloudflare Tunnel | HTTPS publik dari lab tanpa membuka port masuk | `curalyta-tunnel.service` |
| CI/CD | GitHub Actions + runner self-hosted | Uji → build image → deploy ke VM | `.github/workflows/ci-cd.yml` |
| PaaS | Vercel | Staging frontend, build otomatis dari Git | `frontend/vercel.json` |
| Monitoring | Prometheus, Grafana, Blackbox Exporter, node_exporter, cAdvisor | Metrik, dashboard, uptime check | `ops/lab/monitor/` |
| Alerting | Alertmanager → ntfy.sh (push + email) | Notifikasi insiden | `alertmanager.yml.tmpl` |
| AI (SaaS) | Groq API, rotasi multi-key | AI ringkasan pasien dan Tanya AI | `backend/src/lib/groq.ts` |

## 2. Virtualisasi

**Konsep.** Hypervisor membagi satu mesin fisik menjadi beberapa mesin virtual yang masing-masing menjalankan sistem operasi sendiri. KVM adalah hypervisor tipe 1 di kernel Linux; VMware Workstation adalah hypervisor tipe 2 yang berjalan di atas Windows.

**Penerapan.** Lab memakai virtualisasi bersarang (nested):

```
Laptop (Windows 11, i7-12700H, 16 GB)
└── VMware Workstation  — hypervisor tipe 2, VT-x diteruskan ke tamu
    └── Proxmox VE 9.2  — hypervisor tipe 1 (KVM), /dev/kvm tersedia
        ├── VM 101 curalyta-app      (Ubuntu 22.04, 2 vCPU, 2,5 GB, 25 GB)
        └── VM 102 curalyta-monitor  (Ubuntu 22.04, 2 vCPU, 1,5 GB, 20 GB)
```

Syarat yang diverifikasi: Hyper-V Windows dimatikan agar VMware memakai VT-x langsung (log VMware: `Monitor Mode: CPL0`), dan `/dev/kvm` tersedia di Proxmox (`docs/bukti/tahap3-provision-proxmox.log`).

**Alasan:** Proxmox gratis, open source, dan menyediakan fitur IaaS lengkap (template, cloud-init, firewall, snapshot, vzdump) lewat CLI dan web UI, sesuai materi pelatihan (Windows → VMware → Proxmox).

## 3. Container dan registry

**Konsep.** Container mengemas aplikasi beserta dependensinya menjadi image yang tidak berubah. Berbeda dari VM, container berbagi kernel host sehingga lebih ringan dan cepat dijalankan.

**Penerapan.**
- Image production dibangun multi-stage, berjalan sebagai user non-root (`curalyta` uid 1001 untuk backend, `nginx` uid 101 untuk frontend), dan memiliki `HEALTHCHECK`.
- Ukuran image hasil build: frontend 74,6 MB, backend 349 MB (`docs/bukti/tahap2-verifikasi-lokal.log`).
- Setiap push ke `main` membangun image bertag commit (mis. `backend:4c22f21`) dan `latest`, lalu menyimpannya di GHCR. Tag commit memungkinkan rollback ke versi mana pun.

## 4. Reverse proxy

Nginx adalah satu-satunya container yang membuka port (80/443). Fungsinya:
- **Routing:** `/` → `frontend:8080`, `/api/*` dan `/health` → `backend:4000`.
- **Keamanan:** header `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (mode HTTPS); header duplikat dari backend disembunyikan.
- **Observabilitas:** log akses JSON berisi `request_time` dan `upstream_response_time`.
- **Penemuan layanan:** resolver DNS Docker (`127.0.0.11`) agar alamat container diperbarui setelah restart.

## 5. Penyimpanan

| Jenis | Karakteristik | Pemakaian di Curalyta |
|---|---|---|
| Block storage | Volume disk mentah untuk satu VM, latensi rendah | Disk VM di `local-lvm` (LVM-thin); volume Docker `curalyta_postgres_data` berada di atasnya |
| File storage | Folder dan file bersama | Volume `curalyta_uploads` untuk dokumen medis yang diunggah; storage `local` Proxmox untuk ISO, template, dan arsip vzdump |
| Object storage | Objek + metadata lewat API HTTP (S3), skalabel, mendukung aturan lifecycle | Garage bucket `curalyta-db-backups`: file `pg_dump` + checksum SHA-256, hapus otomatis setelah 30 hari (lifecycle S3) |
| Relational database | Tabel, SQL, transaksi ACID | PostgreSQL 16, 14 model Prisma, migrasi otomatis `prisma migrate deploy` |
| Non-relational | Model fleksibel (key-value, dokumen, time-series) | Prometheus TSDB menyimpan metrik time-series selama 45 hari |

## 6. Jaringan dan firewall (setara VPC)

- **Subnet privat:** 192.168.45.0/24 (VMware NAT). Gateway dan DNS 192.168.45.2. Lalu lintas keluar ke internet melalui NAT.
- **Firewall per VM (default deny):**
  - `curalyta-app`: masuk hanya 80/443 (publik), 22 dari laptop admin dan host Proxmox, 9100/8080 (metrik) hanya dari VM monitoring.
  - `curalyta-monitor`: Grafana 3000, Prometheus 9090, dan Alertmanager 9093 hanya dari laptop admin; API S3 Garage 3900 hanya dari VM aplikasi dan laptop admin.
- **Jaringan container:** jaringan Docker `curalyta_internal`; PostgreSQL dan backend tidak terekspos ke luar VM.
- **Akses publik:** Cloudflare Tunnel membuat koneksi keluar dari VM ke edge Cloudflare, sehingga layanan dapat diakses publik lewat HTTPS tanpa port forwarding atau IP publik.

## 7. Identitas dan akses (IAM)

| Subjek | Mekanisme | Prinsip |
|---|---|---|
| Admin lab ke Proxmox dan VM | SSH key ed25519 khusus lab (`curalyta_lab`); password root hanya diketahui pemilik | Tanpa password lewat jaringan |
| Pengguna VM | User `curalyta` (sudo) dibuat cloud-init, hanya login dengan key | Least privilege; root tidak dipakai di VM |
| Backup ke object storage | Key Garage `curalyta-backup` dengan izin hanya baca + tulis pada bucket `curalyta-db-backups` (tanpa hak owner, tidak bisa membuat bucket) | Least privilege; tidak bisa mengakses bucket lain atau mengubah pengaturan bucket |
| CI/CD | `GITHUB_TOKEN` sementara per job dengan izin `packages: write` (build) atau `packages: read` (deploy) | Token berumur pendek, tidak ada kunci statis |
| Runner self-hosted | Terdaftar dengan token registrasi sekali pakai, berjalan sebagai user `curalyta` | Hanya job berlabel `curalyta-lab` |
| Pengguna aplikasi | JWT + bcrypt, peran ADMIN/DOCTOR/PATIENT, rate limit login | RBAC di tingkat aplikasi |

## 8. CI/CD

Pipeline `.github/workflows/ci-cd.yml`:

```
push ke main
  └─ test (GitHub-hosted): npm ci → prisma generate → typecheck → unit test (33 test) → build frontend
      └─ build (GitHub-hosted): build image backend & frontend → push GHCR :<commit> & :latest
          └─ deploy-lab (self-hosted di VM curalyta-app): ops/deploy.sh <commit>
                git pull konfigurasi → pull image → docker compose up -d → tunggu healthy → healthcheck
Vercel: build & deploy staging frontend otomatis dari commit yang sama
```

Runner self-hosted dipilih agar deploy berjalan dari dalam lab. GitHub tidak perlu SSH masuk ke jaringan privat, sehingga tidak ada port atau kunci SSH produksi yang disimpan di GitHub.

## 9. Monitoring dan alerting

Arsitektur mengikuti materi pelatihan (Node Exporter → Prometheus → Grafana, Blackbox Exporter untuk pemeriksaan HTTP):

```
node_exporter (pve, app, monitor) ┐
cAdvisor (container di app)       ├─> Prometheus (scrape 15 s) ─> Grafana (dashboard SLA)
Blackbox Exporter (HTTP /health)  ┘          └─> Alertmanager ─> ntfy.sh (push + email)
```

Detail ambang batas dan cara membaca dashboard ada di `docs/PEMANTAUAN.md`.

## 10. Mekanisme ketersediaan (Bab 2 materi)

| Mekanisme | Pengertian | Penerapan |
|---|---|---|
| Failover | Pindah otomatis ke komponen sehat | Rotasi API key Groq: bila satu key kena limit atau error, request otomatis pindah ke key berikutnya (`groq.ts`). Docker `restart: unless-stopped` menjalankan ulang container yang mati |
| Resiliency | Bertahan dan pulih dari gangguan | Healthcheck container + `depends_on: service_healthy`; migrasi database dicoba ulang 5×; VM `onboot=1` menyala otomatis saat host boot |
| Replication | Salinan data/sumber daya | Backup database disalin ke VM lain (Garage di `curalyta-monitor`); arsip vzdump VM di storage Proxmox; image tersimpan di GHCR |
| Access (broker) | Akses dari berbagai perangkat lewat perantara | Nginx sebagai broker permintaan; Cloudflare Tunnel sebagai broker akses publik HTTPS |

## 11. Ancaman keamanan dan mitigasi

| Ancaman | Mitigasi di Curalyta |
|---|---|
| DoS/DDoS | Rate limit global (200 req/15 menit per IP) dan login (10 percobaan/15 menit); edge Cloudflare di depan jalur publik; firewall default deny |
| Serangan autentikasi | Password di-hash bcrypt (12 ronde); JWT secret acak 64 byte; rate limit login; SSH hanya dengan key |
| Otorisasi | RBAC peran ADMIN/DOCTOR/PATIENT; dokter hanya mengakses pasiennya; izin key Garage least privilege |
| Kebocoran secret | `.env` izin 600 dan di-gitignore; `.dockerignore` mencegah `.env` masuk image; riwayat git dipindai tidak mengandung secret |
| Kerentanan OS | `unattended-upgrades` di VM; patching Proxmox (`apt dist-upgrade`) |

## 12. Arsitektur REST API

```
Browser → HTTPS (Cloudflare) → Nginx → Express REST API (/api/*) → Prisma → PostgreSQL
                                                     └→ JSON response ke browser
```

Contoh endpoint: `GET /health` (status + latensi database), `POST /api/auth/login`, `GET /api/patients`, `POST /api/vitals`, `POST /api/ai/summarize`. Uji integrasi API dan data PostgreSQL ada di `docs/bukti/`.

## 13. Pengujian sistem cloud

| Jenis | Tujuan | Pelaksanaan |
|---|---|---|
| Integration | Komunikasi antar komponen benar | Unit/integration test di CI; uji `/health`, login, dan alur data setelah deploy |
| Performance | p95, throughput, error rate pada beban tertentu | Uji beban bertingkat dari VM monitoring ke VM aplikasi (hasil terukur di `docs/bukti/`) |
| Stress | Perilaku saat kelebihan beban dan pemulihannya | Beban dinaikkan sampai latensi melewati target, lalu diamati pemulihannya |

## 14. Perbandingan alternatif

| Kriteria | VM + Docker Compose (dipakai) | PaaS container (Vercel/Cloud Run/Render) | Kubernetes |
|---|---|---|---|
| Kontrol OS dan jaringan | Penuh | Tidak ada | Sebagian (node) |
| Beban operasional | Sedang: patch OS, Docker, backup sendiri | Rendah | Tinggi: control plane, manifest, upgrade |
| Skalabilitas | Manual (scale up/out) | Otomatis | Otomatis (HPA) |
| Biaya untuk skala kecil | Gratis di lab; murah di VPS | Gratis tier untuk frontend; backend terbatas | Butuh beberapa node; berlebihan untuk 1 aplikasi |
| Database stateful | Mudah (volume lokal + backup) | Butuh DBaaS terpisah | Butuh StatefulSet/operator |
| Kesesuaian untuk Curalyta | **Paling sesuai**: 1 aplikasi, data sensitif, perlu kontrol penuh | Dipakai untuk staging frontend | Dipertimbangkan bila layanan > 5 dan tim bertambah |

| Kriteria | Proxmox (dipakai) | VMware ESXi | Public cloud IaaS (GCP/AWS) |
|---|---|---|---|
| Lisensi | Gratis, open source | Berbayar | Bayar per pemakaian, butuh kartu kredit |
| Fitur | KVM, LXC, firewall, backup, cluster | Lengkap, enterprise | Lengkap + layanan terkelola |
| Alasan | Gratis dan sesuai materi pelatihan | — | Tidak dipakai: aktivasi billing gagal |
