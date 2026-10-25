# Daftar Screenshot yang Perlu Diambil

Screenshot melengkapi log bukti di `docs/bukti/`. Simpan di `docs/screenshot/` dengan nama `U<unit>-<nomor>-<deskripsi>.png` (contoh `U4-03-github-actions-run.png`). Pastikan jam/tanggal terlihat (taskbar Windows atau kolom waktu di aplikasi).

Alamat yang dipakai:
- Proxmox: https://192.168.45.10:8006 (login `root`, realm Linux PAM)
- Grafana: http://192.168.45.30:3000 (user `admin`; password di `/opt/curalyta/ops/lab/monitor/.env` VM 102: `sudo grep GRAFANA /opt/curalyta/ops/lab/monitor/.env`)
- Prometheus: http://192.168.45.30:9090 · Alertmanager: http://192.168.45.30:9093
- Produksi: URL di `/opt/curalyta/.public-url` (VM 101) · Staging: https://curalyta-frontend.vercel.app
- GitHub: https://github.com/Muhammadabrarrayhan2/curalyta

## Unit 1 — Terminologi dan konsep (J.631120.001.01)

| No | Halaman | Cara membuka | Yang harus terlihat |
|---|---|---|---|
| U1-01 | Proxmox Datacenter → Summary | Klik **Datacenter** | Sumber daya pool: CPU, RAM, storage (resource pooling) |
| U1-02 | Proxmox → `pve` → VM 101 dan 102 di pohon kiri | Panel kiri | VM sebagai layanan IaaS (on-demand self-service) |
| U1-03 | Aplikasi Curalyta di ponsel lewat URL publik | Buka URL produksi di HP | Broad network access |
| U1-04 | Vercel → project curalyta-frontend → Deployments | vercel.com/dashboard | PaaS: platform yang build/deploy |
| U1-05 | Grafana dashboard "Curalyta — SLA & Infrastruktur" | Dashboards → Curalyta | Measured service, target SLA 99% |

## Unit 2 — Teknologi (J.631120.002.01)

| No | Halaman | Cara membuka | Yang harus terlihat |
|---|---|---|---|
| U2-01 | VMware Workstation dengan VM `curalyta-pve` berjalan | Aplikasi VMware | Virtualisasi tingkat 1 |
| U2-02 | Proxmox Shell: `ls -l /dev/kvm; lscpu \| grep Virtualization` | `pve` → Shell | Nested virtualization (KVM) aktif |
| U2-03 | Proxmox → `pve` → Firewall dan VM 101 → Firewall | Tab Firewall | Aturan default DROP + port yang diizinkan |
| U2-04 | Terminal VM 101: `docker compose ps` | SSH ke 192.168.45.20 | 4 container healthy, hanya nginx membuka port |
| U2-05 | GitHub → Packages (`curalyta/backend`, `curalyta/frontend`) | Profil GitHub → Packages | Container registry, tag per commit |
| U2-06 | Terminal VM 102: `docker compose exec garage /garage bucket info curalyta-db-backups` | SSH ke 192.168.45.30 | Object storage, izin key RW |
| U2-07 | Proxmox → `pve` → `local-lvm` → VM Disks dan `backup-disk` → Backups | Panel storage | Block storage dan arsip backup |

## Unit 3 — Perangkat keras (J.631120.003.01)

| No | Halaman | Cara membuka | Yang harus terlihat |
|---|---|---|---|
| U3-01 | Task Manager Windows → Performance (CPU, Memory, Disk) | Ctrl+Shift+Esc | Spesifikasi host fisik |
| U3-02 | Proxmox → `pve` → Summary | Klik `pve` | CPU, RAM, storage host hypervisor |
| U3-03 | Proxmox → VM 101 → Hardware | VM 101 → Hardware | vCPU, RAM, disk VM aplikasi |
| U3-04 | Grafana panel CPU, Memori, Disk, Jaringan (rentang 6 jam) | Dashboard Curalyta | Pemakaian nyata termasuk lonjakan uji beban |
| U3-05 | Terminal VM 101: `docker stats --no-stream` | SSH | Pemakaian per container |

## Unit 4 — Aktivitas rutin IaaS/PaaS/SaaS (J.631120.013.01)

| No | Halaman | Cara membuka | Yang harus terlihat |
|---|---|---|---|
| U4-01 | Proxmox → Datacenter → Backup | Datacenter → Backup | Jadwal `curalyta-daily` 01:30, VM 101, keep-last 1 |
| U4-02 | Proxmox → Datacenter → Tasks (riwayat vzdump, snapshot, rollback) | Panel bawah *Tasks* | Aktivitas backup/restore nyata |
| U4-03 | GitHub → Actions → run CI/CD sukses (3 job hijau) | Tab Actions | Pipeline test → build → deploy |
| U4-04 | GitHub → Settings → Actions → Runners | Settings → Actions → Runners | Runner `curalyta-app` online |
| U4-05 | GitHub → Settings → Secrets and variables → Actions | Settings | Pengelolaan secret (nilai tersembunyi) |
| U4-06 | Vercel → Deployments (riwayat + tombol Promote/Rollback) | Dashboard Vercel | Aktivitas rutin PaaS |
| U4-07 | Terminal VM: `sudo apt-get update && apt list --upgradable` | SSH | Patching OS |
| U4-08 | Terminal VM 101: `tail /var/log/curalyta/curalyta-backup.log` | SSH | Log backup harian |

## Unit 5 — Pemantauan sesuai SLA (J.631120.014.01)

| No | Halaman | Cara membuka | Yang harus terlihat |
|---|---|---|---|
| U5-01 | Grafana dashboard penuh (rentang 24 jam) | Dashboard Curalyta | Status UP, ketersediaan vs target 99%, latensi |
| U5-02 | Prometheus → Status → Targets | :9090 → Status → Targets | 11 target UP |
| U5-03 | Prometheus → Alerts | :9090 → Alerts | 8 aturan alert dan ambangnya |
| U5-04 | Alertmanager saat insiden (alert firing) | :9093 | Alert P1 aktif |
| U5-05 | Notifikasi ntfy di ponsel/browser | Aplikasi ntfy, langganan topik di `.env` VM 102 | Push alert firing/resolved |
| U5-06 | Output `ops/laporan-sla.sh 24h` | Terminal | Ketersediaan, downtime, p95 vs target |

## Unit 6 — Dukungan teknis (J.631120.015.01)

| No | Halaman | Cara membuka | Yang harus terlihat |
|---|---|---|---|
| U6-01 | Browser saat insiden: aplikasi error (502) | URL produksi saat simulasi | Dampak ke pengguna |
| U6-02 | Terminal: `ops/healthcheck.sh` saat insiden (FAIL) dan setelah pulih (OK) | SSH VM 101 | Diagnosis L1 dan verifikasi |
| U6-03 | Grafana panel "Status uptime check" pada rentang insiden | Dashboard Curalyta | Garis turun ke 0 lalu kembali 1 |
| U6-04 | `docs/LAPORAN_INSIDEN_001.md` di GitHub | Repo → docs | Laporan insiden lengkap |
| U6-05 | `docs/SOP_DUKUNGAN_TEKNIS.md` (matriks eskalasi) | Repo → docs | Alur L1/L2/L3 |

## Aplikasi (bukti layanan berjalan)

| No | Halaman | Yang harus terlihat |
|---|---|---|
| A-01 | Landing page produksi (URL publik HTTPS, ikon gembok) | Aplikasi diakses publik lewat HTTPS |
| A-02 | Login admin → Dashboard admin → panel sistem (AI: Groq, rotasi key) | Fitur berjalan |
| A-03 | Login dokter (akun demo) → detail pasien → AI Summary | Integrasi database + AI |
| A-04 | `https://<url-produksi>/health` di browser | JSON status ok + latensi database |
| A-05 | Staging Vercel `https://curalyta-frontend.vercel.app` | PaaS staging berjalan |
