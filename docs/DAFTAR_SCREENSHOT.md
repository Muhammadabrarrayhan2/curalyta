# Daftar Screenshot Bukti

Screenshot melengkapi log bukti di `docs/bukti/` dan disimpan di `docs/screenshot/` dengan nama `U<unit>-<nomor>-<deskripsi>.png`.

## Cara pengambilan

Sebanyak 38 screenshot diambil pada 25 Oktober 2026 pukul 12:33–13:13 WIB dengan browser Microsoft Edge headless (Playwright) dari laptop admin:

- Halaman web dibuka langsung dari server lab, GitHub, dan URL publik. Bilah alamat dan jam di bagian atas gambar adalah bingkai yang ditambahkan saat pengambilan. Jamnya diambil dari jam VM lab yang tersinkron NTP, bukan dari jam laptop.
- Gambar terminal berisi keluaran asli dari perintah yang dijalankan lewat SSH pada saat itu, lalu ditampilkan dalam bingkai terminal.
- Proxmox dibuka dengan user audit sementara `shot-audit@pve`. Hak user ini hanya baca: role PVEAuditor ditambah role sementara untuk melihat isi storage. User dan role tersebut dihapus segera setelah pengambilan selesai. Password root tidak dipakai.
- Nilai rahasia tidak ditampilkan. Topik ntfy disamarkan menjadi `curalyta-alerts-xxxxxxxxxxxx` dan ID access key Garage menjadi `GK******`. Password Grafana dan admin hanya dibaca oleh skrip dan tidak pernah dicetak.

Alamat yang dipakai:
- Proxmox: https://192.168.45.10:8006
- Grafana: http://192.168.45.30:3000 · Prometheus: http://192.168.45.30:9090 · Alertmanager: http://192.168.45.30:9093
- Produksi: URL di `/opt/curalyta/.public-url` (VM 101) · Staging: https://curalyta-frontend.vercel.app
- GitHub: https://github.com/Muhammadabrarrayhan2/curalyta

Status: "Ada" berarti berkas sudah ada di `docs/screenshot/`. "Manual" berarti halaman tersebut butuh login akun pribadi atau berada di desktop, jadi pemilik akun yang mengambilnya.

## Unit 1: Terminologi dan konsep (J.631120.001.01)

| No | Berkas | Isi | Status |
|---|---|---|---|
| U1-01 | `U1-01-proxmox-datacenter-summary.png` | Datacenter Summary: 1 node online, 2 VM berjalan, 1 template (resource pooling) | Ada |
| U1-02 | `U1-02-proxmox-daftar-vm.png` | Daftar resource: VM 101/102, template 9000, tiga storage, pemakaian CPU/RAM/disk | Ada |
| U1-03 | `U1-03-akses-ponsel-url-publik.png` | Aplikasi di layar ponsel (390 px) lewat URL publik HTTPS (broad network access) | Ada |
| U1-04 | `U1-04-vercel-deployments.png` | Vercel → project curalyta-frontend → Deployments: setiap commit dibangun otomatis oleh platform (PaaS), status Ready | Ada (pemilik akun) |
| U1-05 | `U1-05-grafana-dashboard-sla.png` | Dashboard Grafana "Curalyta, SLA & Infrastruktur" (measured service, target 99%) | Ada |

## Unit 2: Teknologi (J.631120.002.01)

| No | Berkas | Isi | Status |
|---|---|---|---|
| U2-01 | `U2-01-vmware-curalyta-pve.png` | VMware Workstation dengan VM `curalyta-pve` berjalan | Manual |
| U2-02 | `U2-02-proxmox-nested-kvm.png` | `pveversion`, `/dev/kvm`, `lscpu` (VT-x), `qm list` | Ada |
| U2-03a | `U2-03a-proxmox-firewall-vm101-options.png` | Firewall VM 101 aktif, Input Policy DROP | Ada |
| U2-03b | `U2-03b-proxmox-firewall-vm101.png` | Aturan yang diizinkan: 80, 443, SSH dari laptop, 9100/8080 dari VM monitoring, ICMP | Ada |
| U2-04 | `U2-04-docker-compose-ps.png` | 4 container healthy dengan image GHCR; hanya nginx membuka port 80/443 | Ada |
| U2-05 | `U2-05-github-packages-ghcr.png` | Paket container `curalyta/backend` dan `curalyta/frontend` di GHCR | Ada |
| U2-06 | `U2-06-garage-object-storage.png` | Bucket `curalyta-db-backups`, key `curalyta-backup` hak RW, lifecycle 30 hari | Ada |
| U2-07a | `U2-07a-proxmox-local-lvm-vm-disks.png` | Block storage `local-lvm`: disk VM dan cloud-init | Ada |
| U2-07b | `U2-07b-proxmox-backup-disk-backups.png` | Arsip vzdump VM 101 di storage `backup-disk` | Ada |

## Unit 3: Perangkat keras (J.631120.003.01)

| No | Berkas | Isi | Status |
|---|---|---|---|
| U3-01 | `U3-01-task-manager.png` | Task Manager Windows → Performance (CPU, Memory, Disk host fisik) | Manual |
| U3-02 | `U3-02-proxmox-node-summary.png` | Node `pve`: 6 vCPU i7-12700H, RAM 4,31 GiB, disk, kernel 7.0.14-25-pve | Ada |
| U3-03 | `U3-03-proxmox-vm101-hardware.png` | Hardware VM 101: 2 GiB RAM, 2 core (host), disk 25 GB | Ada |
| U3-04 | `U3-04-grafana-sumber-daya-6-jam.png` | CPU, memori, disk, jaringan VM dan per container selama 6 jam | Ada |
| U3-05 | `U3-05-docker-stats.png` | `docker stats`, `free -h`, `df -h` di VM 101 | Ada |

## Unit 4: Aktivitas rutin IaaS/PaaS/SaaS (J.631120.013.01)

| No | Berkas | Isi | Status |
|---|---|---|---|
| U4-01 | `U4-01-proxmox-jadwal-backup.png` | Job backup 01:30, storage `backup-disk`, keep-last=1, VM 101 | Ada |
| U4-02 | `U4-02-proxmox-riwayat-task.png` | Riwayat task: backup, restore VM 9102, snapshot, rollback | Ada |
| U4-03 | `U4-03-github-actions-cicd.png` | Daftar run workflow CI/CD | Ada |
| U4-03b | `U4-03b-github-actions-run-detail.png` | Satu run sukses: Test → Build & push → Deploy ke lab | Ada |
| U4-04 | `U4-04-github-runner.png` | GitHub → Settings → Actions → Runners: runner `curalyta-app` online | Manual |
| U4-05 | `U4-05-github-secrets.png` | GitHub → Settings → Secrets and variables → Actions (nilai tersembunyi) | Manual |
| U4-06 | `U4-06-vercel-deployment-detail.png` | Detail satu deployment Production: status Ready (Stale, sudah digantikan deployment lebih baru), durasi build 32 s. Deployment lama tetap tersimpan dan bisa di-promote kembali sebagai rollback | Ada (pemilik akun) |
| U4-07 | `U4-07-patching-os.png` | `apt list --upgradable` kosong, unattended-upgrades aktif, riwayat apt | Ada |
| U4-08 | `U4-08-log-backup-harian.png` | Cron 02:00, log backup ke `s3://curalyta-db-backups`, file dump + sha256 | Ada |

## Unit 5: Pemantauan sesuai SLA (J.631120.014.01)

| No | Berkas | Isi | Status |
|---|---|---|---|
| U5-01 | `U5-01-grafana-dashboard-24-jam.png` | Dashboard penuh rentang 24 jam | Ada |
| U5-02 | `U5-02-prometheus-targets.png` | Semua target scrape UP | Ada |
| U5-03 | `U5-03-prometheus-alert-rules.png` | 8 aturan alert dalam grup backup, ketersediaan, sumber daya | Ada |
| U5-04a | `U5-04a-prometheus-alert-firing-insiden.png` | Grafik `ALERTS{alertstate="firing"}` pada rentang INC-001: LayananTidakTersedia (P1) dan HalamanWebGagal | Ada |
| U5-04b | `U5-04b-alertmanager-status.png` | Status dan konfigurasi Alertmanager (route ke ntfy) | Ada |
| U5-05 | `U5-05-ntfy-topik-notifikasi.png` | Notifikasi firing/resolved di ntfy.sh (web) | Ada |
| U5-05b | `U5-05b-ntfy-email-alert.png` | Email alert dari ntfy.sh ke abrarrayhan8@gmail.com (uji 25-10-2026 14:17:58 WIB), setelah token akun ntfy dipasang dengan `ops/lab/set-ntfy-token.sh`. Akhiran topik dan IP pengirim ditutup | Ada (pemilik akun) |
| U5-05c | `U5-05c-ntfy-ponsel.png` | Aplikasi ntfy di ponsel pukul 16:19: alert nyata INC-003 (LayananTidakTersedia P1 16:11, HalamanWebGagal P2 16:14), pesan uji auth (14:18), dan UjiEmailAlert (14:17). Akhiran topik ditutup | Ada (pemilik akun) |
| U5-06 | `U5-06-laporan-sla-24h.png` | Keluaran `ops/laporan-sla.sh 24h` | Ada |

Catatan U5-04: Alertmanager hanya menampilkan alert yang sedang aktif, dan saat pengambilan tidak ada alert aktif. Karena itu bukti alert firing diambil dari riwayat Prometheus pada rentang insiden (U5-04a) dan dari notifikasi ntfy (U5-05).

## Unit 6: Dukungan teknis (J.631120.015.01)

| No | Berkas | Isi | Status |
|---|---|---|---|
| U6-01 | `U6-01-aplikasi-error-insiden.png` | Browser saat insiden (502/gagal). Perlu simulasi ulang di jendela pemeliharaan; dampaknya sudah tercatat di `docs/bukti/tahap7-simulasi-insiden.log` | Manual |
| U6-02 | `U6-02-healthcheck-pulih.png` | `ops/healthcheck.sh` setelah pulih: semua OK. Keluaran FAIL saat insiden ada di log bukti | Ada |
| U6-03 | `U6-03-grafana-rentang-insiden.png` | Dashboard rentang 11:40–12:05 WIB (INC-001) | Ada |
| U6-04 | `U6-04-laporan-insiden-github.png` | `docs/LAPORAN_INSIDEN_001.md` di GitHub | Ada |
| U6-05 | `U6-05-sop-dukungan-teknis-github.png` | `docs/SOP_DUKUNGAN_TEKNIS.md` (peran L1/L2/L3) | Ada |

## Aplikasi (bukti layanan berjalan)

| No | Berkas | Isi | Status |
|---|---|---|---|
| A-01 | `A-01-produksi-landing-https.png` | Landing page produksi lewat URL publik HTTPS | Ada |
| A-02 | `A-02-admin-dashboard.png` | Dashboard admin, panel System Info (AI Groq, 2 key aktif berotasi) | Ada |
| A-03 | `A-03-dokter-ai-summary.png` | Akun dokter demo → detail pasien → Ringkasan Klinis AI | Ada |
| A-04 | `A-04-produksi-health-json.png` | `/health`: status ok, database up, latensi | Ada |
| A-05 | `A-05-staging-vercel.png` | Staging Vercel berjalan | Ada |

## Yang perlu diambil manual

Simpan dengan nama berkas pada tabel di atas. Pastikan jam taskbar terlihat.

U1-04 dan U4-06 diambil oleh pemilik akun dari dashboard Vercel. Jam pada bingkainya adalah waktu berkas disimpan, dikonversi ke jam lab.

1. U2-01: jendela VMware Workstation saat `curalyta-pve` berjalan.
2. U3-01: Task Manager (Ctrl+Shift+Esc) → Performance.
3. U4-04: github.com/Muhammadabrarrayhan2/curalyta → Settings → Actions → Runners.
4. U4-05: Settings → Secrets and variables → Actions.
5. U6-01 (opsional): hanya bila simulasi insiden diulang di jendela pemeliharaan.
