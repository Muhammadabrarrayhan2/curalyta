# Deployment Curalyta: Langkah yang Dijalankan

Dokumen ini mencatat urutan deployment yang benar-benar dijalankan pada 23–25 Oktober 2026, termasuk kendala yang muncul dan keputusan yang diambil. Bukti eksekusi ada di `docs/bukti/`, dan riwayat perubahan di git.

## 0. Keputusan platform

Rencana awal memakai Google Cloud Platform (Compute Engine, Cloud Run, Artifact Registry, Cloud Monitoring). Billing GCP tidak dapat diaktifkan karena verifikasi kartu ditolak (`OR_MIVEM_02`). Diputuskan memakai jalur gratis yang sesuai materi pelatihan:

| Kebutuhan | Rencana GCP | Implementasi gratis yang dipakai | Alasan |
|---|---|---|---|
| IaaS | Compute Engine | Proxmox VE 9.2 di VMware Workstation (lab) | Sesuai materi (Windows → VMware → Proxmox) |
| Container registry | Artifact Registry | GitHub Container Registry | Gratis, terintegrasi Actions |
| PaaS | Cloud Run | Vercel (staging frontend) | Gratis tanpa kartu; akun sudah ada |
| Object storage | Cloud Storage | Garage (S3-compatible) di VM monitoring | MinIO berhenti menerbitkan image komunitas |
| Monitoring | Cloud Monitoring | Prometheus + Grafana + Blackbox + Alertmanager | Sesuai materi pelatihan |
| HTTPS publik | Static IP + Let's Encrypt | Cloudflare Tunnel (quick tunnel) | Lab berada di balik NAT, tanpa IP publik |

## 1. Persiapan aplikasi (Tahap 1–2)

| No | Langkah | Perintah / berkas | Fungsi dan alasan |
|---|---|---|---|
| 1.1 | Analisis repo | `docs/ANALISIS_AWAL.md` | Memetakan secret hardcode, ketergantungan Vercel/Render/Neon, kebutuhan `DIRECT_URL` |
| 1.2 | Endpoint `/health` | `backend/src/lib/health.ts` | `SELECT 1` ke database + waktu respons; 503 bila DB mati. Target uptime check SLA |
| 1.3 | Dockerfile production | `docker/backend.Dockerfile`, `docker/frontend.Dockerfile` | Multi-stage, non-root, healthcheck; image kecil dan aman |
| 1.4 | Compose + Nginx | `docker-compose.yml`, `docker/nginx/` | Hanya Nginx membuka port; log JSON dengan waktu respons |
| 1.5 | Skrip operasional | `ops/backup-db.sh`, `restore-db.sh`, `deploy.sh`, `healthcheck.sh` | Aktivitas rutin yang dapat diulang |
| 1.6 | Verifikasi lokal | `docker compose up -d --wait` (Docker Desktop) | 4 container healthy, login 200/401 (`tahap2-verifikasi-lokal.log`) |

## 2. Host laptop

```powershell
# 2.1 Unduh ISO Proxmox VE 9.2 dan verifikasi SHA-256 resmi
curl -o D:\ISO\proxmox-ve_9.2-1.iso https://enterprise.proxmox.com/iso/proxmox-ve_9.2-1.iso
# 2.2 Buat disk VM thin 80 GB dan file .vmx (6 vCPU, nested VT-x: vhv.enable = "TRUE")
vmware-vdiskmanager -c -s 80GB -a nvme -t 0 curalyta-pve.vmdk
# 2.3 Matikan hypervisor Windows agar VMware memakai VT-x langsung (dilakukan pemilik laptop):
#     Windows Security → Core isolation → Memory integrity Off; bcdedit /set hypervisorlaunchtype off; restart
```

Alasan: selama Hyper-V/VBS aktif, VMware tidak dapat meneruskan VT-x, sehingga Proxmox tidak memiliki `/dev/kvm`.

Kendala yang ditangani:
- Kartu jaringan vmxnet3 butuh PCIe root port (`pciBridge4..7`).
- File `.vmem` 6 GB memenuhi drive C:, diatasi dengan `mainMem.useNamedFile = "FALSE"`.
- RAM VM diturunkan menjadi 4,5 GB karena commit memori Windows hampir habis.

## 3. Proxmox VE (Tahap 3: IaaS)

| No | Langkah | Perintah | Fungsi dan alasan |
|---|---|---|---|
| 3.1 | Instalasi Proxmox (oleh pemilik) | Installer grafis: `pve.curalyta.lab`, 192.168.45.10/24, gw .2 | Hypervisor tipe 1 (KVM) |
| 3.2 | Akses admin tanpa password | Kunci publik `curalyta_lab` di `/root/.ssh/authorized_keys` | Otomasi lewat SSH tanpa mengetahui password root |
| 3.3 | Provisioning | `bash ops/lab/pve-setup.sh` (systemd unit) | Repo no-subscription, `dist-upgrade`, verifikasi `/dev/kvm`, template Ubuntu 22.04 (cloud-init), VM 101/102 linked clone, firewall, disk backup, jadwal vzdump |
| 3.4 | node_exporter host | `apt install prometheus-node-exporter` | Metrik hypervisor |
| 3.5 | Sinkron jam | `/etc/chrony/conf.d/curalyta.conf`: `makestep 1 -1` | Laptop bisa tidur, sehingga jam harus dapat dilompatkan kapan pun |

Kendala yang ditangani:
- Koneksi putus di tengah skrip, diatasi dengan menjalankan skrip sebagai unit systemd.
- Tanda tangan apt ditolak karena jam VM mundur 7 jam, diatasi dengan sinkron jam sebelum apt.
- Template terkunci akibat proses terputus, diatasi dengan pembersihan otomatis.
- Nama perangkat disk tertukar, sehingga disk backup kini dikenali dari label atau kondisi kosong.
- Disk C: penuh, diatasi dengan linked clone dan disk backup di E:.

## 4. VM monitoring (VM 102)

```bash
sudo git clone https://github.com/Muhammadabrarrayhan2/curalyta.git /opt/curalyta
sudo ALERT_EMAIL=abrarrayhan8@gmail.com bash /opt/curalyta/ops/lab/monitor-vm-setup.sh
```
Fungsi: Docker; rahasia acak di `.env` (600); konfigurasi Alertmanager → ntfy; Prometheus, Alertmanager, Grafana (dashboard SLA ter-provision), Blackbox; Garage (layout, key `curalyta-backup` hak baca/tulis satu bucket, bucket `curalyta-db-backups`, lifecycle 30 hari via `ops/lab/s3-lifecycle.py`).

Kendala yang ditangani: git *dubious ownership* (`safe.directory`); image MinIO tidak tersedia (diganti Garage); `curl --aws-sigv4` tidak menandatangani header yang diwajibkan Garage (diganti helper Python); ntfy.sh menolak email anonim (alert dikirim sebagai push).

## 5. VM aplikasi (VM 101)

```bash
# rahasia dikirim lewat stdin SSH ke file 600, dipakai, lalu dihapus
sudo bash -c 'set -a; . /root/.curalyta-setup.env; set +a; bash /opt/curalyta/ops/lab/app-vm-setup.sh'
# runner self-hosted: token registrasi sekali pakai dari gh CLI
gh api -X POST repos/Muhammadabrarrayhan2/curalyta/actions/runners/registration-token --jq .token \
  | ssh curalyta@192.168.45.20 'T=$(cat); sudo env RUNNER_TOKEN="$T" bash /opt/curalyta/ops/lab/github-runner-setup.sh'
```
Fungsi: Docker + rotasi log; `.env` produksi (password DB, JWT secret, password admin acak; key Groq dan key backup dari luar); cAdvisor; cron backup 02:00; logrotate; unattended-upgrades; Cloudflare Tunnel + watchdog; runner label `curalyta-lab`.

## 6. CI/CD dan deploy pertama (Tahap 5: SaaS)

Push ke `main` menjalankan `.github/workflows/ci-cd.yml`: test → build (push GHCR `:<commit>`, `:latest`) → deploy-lab (runner di VM 101 menjalankan `ops/deploy.sh <commit>`).

Kendala yang ditemukan oleh run nyata dan sudah diperbaiki:

| Run | Masalah | Perbaikan (commit) |
|---|---|---|
| 90cf3c7 | Test lama memakai path Windows `D:` | Test netral platform (`69eb1be`) |
| 69f92cb | Runner tidak bisa menulis log; `deploy.sh` memakai tag lama karena nilai `.env` sudah ter-export | Izin `/var/log/curalyta`; export ulang tag (`486aca5`) |
| 486aca5 | `deploy.sh` menjalankan versi lama dirinya setelah `git reset` | Re-exec setelah update (`eb4986b`) |

Hasil: run `eb4986b`, `f87b2d3`, dan seterusnya sukses; container berjalan dengan image bertag commit yang di-deploy.

## 7. Akses publik dan staging (Tahap 4: PaaS)

```bash
ops/lab/update-public-url.sh   # dari laptop, di root repo
```
Memperbarui `CORS_ORIGIN` backend, target uptime check publik Prometheus, dan `frontend/vercel.json` (rewrite `/api/*` → URL tunnel), lalu commit dan push. Vercel otomatis membangun staging dari commit tersebut.

Hasil: produksi `https://<tunnel>.trycloudflare.com/health` HTTP 200; staging `https://curalyta-frontend.vercel.app/api/health` HTTP 200 (`tahap4-5-cicd-deploy-staging.log`).

## 8. Verifikasi operasional (Tahap 6–7)

| Uji | Hasil | Bukti |
|---|---|---|
| Semua target monitoring | 11/11 up | `PEMANTAUAN.md` |
| Backup + restore DB ke DB uji | 37 s / 2 s, data identik | `tahap7-backup-restore.log` |
| vzdump VM 102 + restore penuh ke VM ID baru 9102 | Pulih 327 s, isi terverifikasi | `tahap7-vzdump-restore-vm.log` |
| vzdump VM 101 + uji integritas | 2,08 GB, 63 s, lolos | `tahap7-vzdump-snapshot.log` |
| Snapshot + rollback VM 102 | Pulih 36 s | `tahap7-vzdump-snapshot.log` |
| Patching OS | 0 paket tertunda, healthcheck OK | `tahap4-patching-os.log` |
| Uji beban 10–200 VU | ±1.600 req/s, p95 ≤ 140 ms, 0% gagal | `tahap2-uji-beban.log` |
| Simulasi insiden INC-001 | Lihat laporan | `tahap7-simulasi-insiden.log`, `LAPORAN_INSIDEN_001.md` |
| Insiden nyata INC-002 (tunnel kedaluwarsa) | Dideteksi dan dipulihkan | `insiden-002-tunnel-kedaluwarsa.log` |
