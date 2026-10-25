# Aktivitas Rutin IaaS, PaaS, dan SaaS

Unit kompetensi: J.631120.013.01, Menjalankan aktivitas rutin pada IaaS, PaaS, dan SaaS

| Model | Layanan di Curalyta | Yang dikelola tim |
|---|---|---|
| IaaS | Proxmox VE: VM 101 `curalyta-app`, VM 102 `curalyta-monitor`, host `pve` | OS, patch, Docker, container, backup, snapshot, disk, log, firewall |
| PaaS | Vercel: staging frontend `curalyta-frontend.vercel.app` | Kode, konfigurasi rewrite, deployment, rollback deployment |
| SaaS | GitHub (repo, Actions, Secrets, GHCR), ntfy.sh, Groq API | Akses, secret/token, workflow, notifikasi, kuota API |

## 1. Checklist harian

| No | Model | Aktivitas | Perintah / lokasi | Kriteria lulus |
|---|---|---|---|---|
| H1 | IaaS | Cek kesehatan layanan | `/opt/curalyta/ops/healthcheck.sh` (VM 101) | Semua `[OK]` |
| H2 | IaaS | Cek dashboard dan alert aktif | Grafana "Curalyta, SLA & Infrastruktur"; `http://192.168.45.30:9093` | Status UP, tidak ada alert firing |
| H3 | IaaS | Cek backup database semalam | `tail -5 /var/log/curalyta/backup-cron.log`; panel "Umur backup DB" | Backup < 24 jam, `Backup selesai` |
| H4 | IaaS | Cek backup VM semalam | Proxmox → Datacenter → Backup / `pvesm list backup-disk` | Arsip vzdump VM 101 terbaru ada |
| H5 | IaaS | Cek ruang disk | `df -h /` (VM), `lvs pve/data` (host), `df -h /mnt/backup-disk` | < 80% |
| H6 | SaaS | Cek riwayat workflow CI/CD | `gh run list --limit 5` | Run terakhir `success` |
| H7 | PaaS | Cek staging | `curl -s https://curalyta-frontend.vercel.app/api/health` | HTTP 200 |

## 2. Checklist mingguan

| No | Model | Aktivitas | Perintah |
|---|---|---|---|
| M1 | IaaS | Patch OS VM (snapshot dulu) | `qm snapshot 101 sebelum-patch-$(date +%Y%m%d)`; di VM `sudo apt-get update && sudo apt-get -y upgrade`; `[ -f /var/run/reboot-required ] && sudo reboot`; lalu `healthcheck.sh` |
| M2 | IaaS | Patch host Proxmox | `apt-get update && apt-get -y dist-upgrade` (reboot bila kernel baru) |
| M3 | IaaS | Bersihkan image Docker lama | `docker image prune -af --filter until=168h` |
| M4 | IaaS | Rotasi & periksa log | `logrotate` otomatis (mingguan, 8 arsip) untuk `/var/log/curalyta`; log container dirotasi Docker (10 MB × 5); `journalctl --vacuum-time=14d` |
| M5 | IaaS | Uji restore database ke DB uji | `sudo /opt/curalyta/ops/restore-db.sh latest` |
| M6 | IaaS | Cek snapshot tertinggal | `qm listsnapshot 101; qm listsnapshot 102`, hapus yang sudah tidak diperlukan |
| M7 | PaaS | Cek revisi/deployment staging | Vercel dashboard → Deployments; `gh api repos/Muhammadabrarrayhan2/curalyta/deployments` |
| M8 | SaaS | Laporan SLA mingguan | `ops/laporan-sla.sh 7d > docs/bukti/laporan-sla-$(date +%F).md` |

## 3. Checklist bulanan

| No | Model | Aktivitas | Perintah / lokasi |
|---|---|---|---|
| B1 | IaaS | Uji restore VM dari vzdump ke VM ID baru (jika kapasitas cukup) | `docs/SOP_OPERASIONAL.md` bagian 7 |
| B2 | IaaS | Tinjau kapasitas (CPU, RAM, disk) | Grafana rentang 30 hari; `docs/KEBUTUHAN_PERANGKAT_KERAS.md` |
| B3 | IaaS | Tinjau aturan firewall | `cat /etc/pve/firewall/101.fw 102.fw` |
| B4 | PaaS | Rollback/promote deployment staging bila perlu | Vercel → Deployments → pilih deployment lama → *Promote to Production*; atau revert commit `frontend/vercel.json` |
| B5 | PaaS | Atur scaling/kuota | Vercel → Settings → Functions/Usage (staging statis, tanpa function) |
| B6 | SaaS | Kelola akses repo & runner | GitHub → Settings → Collaborators; `gh api repos/Muhammadabrarrayhan2/curalyta/actions/runners` |
| B7 | SaaS | Rotasi secret | Key Groq (`GROQ_API_KEYS`), JWT secret, key backup Garage (`docs/SOP_OPERASIONAL.md` bagian 8); token GitHub/Vercel |
| B8 | SaaS | Kelola notification channel & alert | Uji kirim alert (`amtool` / simulasi); tinjau `ops/lab/monitor/prometheus/rules/curalyta.yml` |
| B9 | SaaS | Laporan SLA bulanan | `ops/laporan-sla.sh 30d` |

## 4. Perintah PaaS dan SaaS yang sering dipakai

```bash
# PaaS (Vercel) - status deployment staging lewat GitHub Deployments API
gh api "repos/Muhammadabrarrayhan2/curalyta/deployments?per_page=5" \
  --jq '.[] | "\(.created_at) \(.environment) \(.sha[0:7])"'
# Rollback staging ke konfigurasi sebelumnya
git revert <commit-yang-mengubah-frontend/vercel.json> && git push

# SaaS (GitHub Actions)
gh run list --limit 10                       # riwayat workflow
gh run view <id> --log-failed                # diagnosis kegagalan
gh workflow run "CI/CD" -f tag=<commit>      # deploy/rollback tag tertentu
gh api repos/Muhammadabrarrayhan2/curalyta/actions/runners   # status runner
gh secret list                               # daftar secret (nilai tidak pernah ditampilkan)

# SaaS (alert)
curl -s http://192.168.45.30:9093/api/v2/alerts | python -m json.tool   # alert aktif
```

## 5. Log pelaksanaan nyata: 25 Oktober 2026

Waktu mengikuti jam VM/host yang tersinkron NTP (WIB). Bukti lengkap di `docs/bukti/`.

| Waktu | Model | Aktivitas | Hasil | Bukti |
|---|---|---|---|---|
| 07:24–08:10 | IaaS | Patching host Proxmox (`apt dist-upgrade`, kernel 7.0.14-25-pve), reboot pasca-patch | Berhasil; 0 paket tertunda | `tahap3-provision-proxmox.log`, `tahap4-patching-os.log` |
| 08:10–08:15 | IaaS | Provisioning VM 101/102 dari template, firewall per VM, disk backup, jadwal vzdump | Berhasil | `tahap3-provision-proxmox.log` |
| 09:31–09:40 | IaaS | Setup stack monitoring + object storage; setup VM aplikasi | Berhasil (setelah perbaikan safe.directory, penggantian MinIO → Garage) | commit `15596c8`, `a3c8af4`, `4953946` |
| 09:43 | SaaS | Registrasi runner self-hosted GitHub Actions | Online, label `curalyta-lab` | `tahap4-5-cicd-deploy-staging.log` |
| 09:46–10:07 | SaaS + IaaS | Deploy lewat CI/CD (5 run); 2 bug deploy ditemukan dan diperbaiki | Run `eb4986b`, `f87b2d3`: test, build, deploy sukses | `tahap4-5-cicd-deploy-staging.log` |
| 09:59 | PaaS | Deploy staging Vercel dengan rewrite `/api` ke produksi | `/api/health` HTTP 200 | `tahap4-5-cicd-deploy-staging.log` |
| 10:06 | IaaS | Backup database manual + restore ke DB uji | Backup 37 s; restore 2 s; data identik | `tahap7-backup-restore.log` |
| 10:09–10:15 | IaaS | vzdump VM 102 (20 GiB → 1,78 GB, 44 s), restore penuh ke VM ID baru 9102 dengan jaringan diputus, verifikasi isi, lalu hapus | Pulih dalam 327 s (target RTO 3.600 s) | `tahap7-vzdump-restore-vm.log` |
| 10:16 | IaaS | vzdump VM 101 (25 GiB → 2,08 GB, 63 s) + uji integritas | Lolos `zstd -t`, konfigurasi terbaca | `tahap7-vzdump-snapshot.log` |
| 10:17–10:19 | IaaS | Snapshot + rollback VM 102 | Kembali ke titik snapshot dalam 36 s | `tahap7-vzdump-snapshot.log` |
| 10:19–10:22 | IaaS | Cek & terapkan patch OS kedua VM; cek unattended-upgrades | 0 paket tertunda; patch otomatis aktif | `tahap4-patching-os.log` |
| 10:20 | IaaS | Uji pasca-pemeliharaan (`healthcheck.sh`) | Semua OK | `tahap4-patching-os.log` |
| 10:27–10:30 | IaaS | Uji beban bertingkat 10–200 VU | ±1.600 req/s, p95 ≤ 140 ms, 0% gagal | `tahap2-uji-beban.log` |
| 10:30 | IaaS + SaaS | Simulasi insiden INC-001 (alert → ntfy/email) | Lihat laporan insiden | `tahap7-simulasi-insiden.log`, `LAPORAN_INSIDEN_001.md` |
