# SOP Operasional Curalyta

Prosedur standar untuk mengoperasikan lab produksi Curalyta. Semua perintah sudah dipakai di lingkungan ini.

| Komponen | Alamat | Akses |
|---|---|---|
| Host Proxmox `pve` | 192.168.45.10 (web UI `https://192.168.45.10:8006`) | `ssh -i ~/.ssh/curalyta_lab root@192.168.45.10` |
| VM 101 `curalyta-app` | 192.168.45.20 | `ssh -i ~/.ssh/curalyta_lab curalyta@192.168.45.20` |
| VM 102 `curalyta-monitor` | 192.168.45.30 | `ssh -i ~/.ssh/curalyta_lab curalyta@192.168.45.30` |
| Aplikasi | `/opt/curalyta` di VM 101 | `docker compose ...` |
| Monitoring | `/opt/curalyta/ops/lab/monitor` di VM 102 | Grafana :3000, Prometheus :9090, Alertmanager :9093 |

## 1. Menyalakan dan mematikan layanan

Menyalakan seluruh lab (dari keadaan mati):
1. Buka VMware Workstation, lalu nyalakan VM `curalyta-pve`. Bisa juga lewat CLI:
   `vmrun -T ws start "C:\Users\ACER\Documents\Virtual Machines\curalyta-pve\curalyta-pve.vmx" nogui`
2. VM 101 dan 102 menyala otomatis (`onboot=1`). Container memakai `restart: unless-stopped`, dan tunnel serta runner adalah service systemd yang aktif saat boot.
3. Periksa: `/opt/curalyta/ops/healthcheck.sh` di VM 101 dan dashboard Grafana.
4. Jika service tunnel mendapat URL baru, jalankan `ops/lab/update-public-url.sh` dari laptop (lihat bagian 9).

Mematikan dengan aman:
```bash
ssh root@192.168.45.10 'qm shutdown 101 --timeout 120; qm shutdown 102 --timeout 120; shutdown -h now'
```
Hanya aplikasi: `cd /opt/curalyta && docker compose stop` (nyalakan lagi dengan `docker compose up -d --wait`).

## 2. Deploy versi baru

Normal (otomatis): push ke branch `main`. GitHub Actions menjalankan test → build image ke GHCR → job `deploy-lab` di runner self-hosted menjalankan `ops/deploy.sh <commit>`.

Manual dari VM 101 (butuh token GHCR berizin `read:packages`):
```bash
cd /opt/curalyta
REGISTRY_TOKEN=<token> REGISTRY_USER=<user-github> ops/deploy.sh <tag-commit>
```
Dari GitHub: Actions → CI/CD → Run workflow, isi `tag` bila ingin tag tertentu.

## 3. Rollback

| Lapisan | Langkah |
|---|---|
| Aplikasi (cepat) | Actions → CI/CD → Run workflow, isi `tag` = commit terakhir yang sehat. Atau di VM: `ops/deploy.sh <tag-lama>` |
| Database | Restore backup (bagian 6) |
| VM penuh | Rollback snapshot (`qm rollback 101 <nama>`) atau restore arsip vzdump (bagian 7) |

Riwayat tag yang pernah di-deploy ada di `/var/log/curalyta/curalyta-deploy.log` dan di riwayat run Actions.

## 4. Membaca log

| Sumber | Perintah |
|---|---|
| Container aplikasi | `docker compose logs --since 30m backend` (ganti `nginx`, `frontend`, `postgres`) |
| Akses HTTP + waktu respons | `docker compose logs --since 30m nginx` (JSON: `status`, `request_time`, `upstream_response_time`) |
| Deploy | `tail -50 /var/log/curalyta/curalyta-deploy.log` |
| Backup | `tail -50 /var/log/curalyta/curalyta-backup.log` dan `/var/log/curalyta/backup-cron.log` |
| Tunnel publik | `journalctl -u curalyta-tunnel --since "1 hour ago"` |
| Runner CI/CD | `journalctl -u 'actions.runner.*' --since today` |
| OS | `journalctl -p warning --since today` |
| Monitoring | `cd /opt/curalyta/ops/lab/monitor && docker compose logs --since 1h prometheus alertmanager` |
| Proxmox | Web UI → Datacenter → Tasks, atau `journalctl -u pvedaemon` |

## 5. Backup database

Otomatis setiap hari pukul 02:00 WIB (`/etc/cron.d/curalyta-backup`). Manual:
```bash
sudo /opt/curalyta/ops/backup-db.sh
```
Hasil: `/var/backups/curalyta/curalyta-<UTC>.dump` beserta `.sha256`, disalin ke bucket `curalyta-db-backups` (Garage di VM 102). Bucket menghapus objek otomatis setelah 30 hari, dan disk lokal menyimpan 7 file terakhir. Umur backup terakhir dipantau oleh alert `BackupDatabaseTerlambat` (> 26 jam).

## 6. Restore database

1. Selalu uji dulu ke database terpisah:
   ```bash
   sudo /opt/curalyta/ops/restore-db.sh latest            # → database curalyta_restore_test
   ```
   Periksa jumlah baris yang dicetak skrip.
2. Restore ke produksi (backend dihentikan selama restore, wajib konfirmasi ketik `RESTORE`):
   ```bash
   sudo /opt/curalyta/ops/restore-db.sh latest --production
   ```
3. Verifikasi: `curl -s http://localhost/health`, lalu login dan cek data.

## 7. Snapshot dan restore VM (Proxmox)

```bash
# sebelum perubahan berisiko (patch besar, upgrade)
qm snapshot 101 sebelum-patch-$(date +%Y%m%d) --description "alasan"
qm listsnapshot 101
qm rollback 101 sebelum-patch-YYYYMMDD     # kembali ke snapshot
qm delsnapshot 101 sebelum-patch-YYYYMMDD  # hapus setelah perubahan terverifikasi

# backup penuh VM (juga terjadwal harian 01:30 untuk VM 101)
vzdump 101 --storage backup-disk --mode snapshot --compress zstd
pvesm list backup-disk

# restore ke VM ID baru (uji) - putuskan jaringan agar tidak bentrok IP
qmrestore /mnt/backup-disk/dump/vzdump-qemu-101-<waktu>.vma.zst 9101 --storage local-lvm --unique 1
qm set 9101 --net0 virtio=<mac>,bridge=vmbr0,firewall=1,link_down=1
# restore menimpa VM asli (darurat): matikan VM 101 lalu
qmrestore <arsip> 101 --force 1
```
Kebutuhan ruang restore ke VM baru sama dengan data terpakai VM (±5 GB untuk VM 101).

## 8. Rotasi JWT secret

Rotasi membuat semua sesi login lama tidak berlaku (pengguna perlu login ulang). Lakukan di jendela pemeliharaan.
```bash
cd /opt/curalyta
sudo sed -i "s#^JWT_SECRET=.*#JWT_SECRET=$(openssl rand -hex 64)#" .env
docker compose up -d --wait backend
curl -s http://localhost/health
```
Lakukan juga bila ada dugaan secret bocor. Untuk secret lain: password database (ubah dengan `ALTER USER` lalu `.env`), key Groq (`GROQ_API_KEYS`, lalu `docker compose up -d backend`), dan key backup Garage (`garage key ...` di VM 102, lalu `.env` di VM 101).

## 9. Perpanjangan sertifikat dan URL publik

- Jalur publik (Cloudflare Tunnel): TLS diterminasi dan diperpanjang otomatis oleh Cloudflare. Tidak ada sertifikat di VM.
- URL quick tunnel berubah setiap service `curalyta-tunnel` restart. Dari laptop di root repo jalankan:
  ```bash
  ops/lab/update-public-url.sh
  ```
  Skrip memperbarui `CORS_ORIGIN`, target uptime check Prometheus, dan rewrite staging Vercel (`frontend/vercel.json`, lalu commit dan push).
- Jika memakai domain sendiri + Let's Encrypt: isi `SERVER_NAME`, terbitkan sertifikat dengan `certbot certonly --webroot -w /var/www/certbot -d <domain>`, set `NGINX_SITE=https`, lalu `docker compose up -d nginx`. Perpanjangan otomatis oleh timer `certbot.timer`; tambahkan deploy hook `docker compose -f /opt/curalyta/docker-compose.yml exec nginx nginx -s reload`.

## 10. Patching OS

```bash
# VM (Ubuntu): patch keamanan otomatis harian oleh unattended-upgrades; patch penuh manual:
qm snapshot 101 sebelum-patch-$(date +%Y%m%d)        # di host Proxmox
sudo apt-get update && sudo apt-get -y upgrade        # di VM
[ -f /var/run/reboot-required ] && sudo reboot
/opt/curalyta/ops/healthcheck.sh                      # uji pasca-pemeliharaan
# Host Proxmox:
apt-get update && apt-get -y dist-upgrade && reboot   # VM ikut mati-nyala (onboot=1)
```
Catat setiap patch di log aktivitas (`docs/AKTIVITAS_RUTIN.md`).

## 11. Teardown seluruh lab

Menghapus semua resource lab (tidak bisa dibatalkan, ambil backup yang ingin disimpan terlebih dahulu):
```bash
# 1. Runner GitHub: lepaskan dari repo (di VM 101)
cd /opt/actions-runner && sudo ./svc.sh stop && sudo ./svc.sh uninstall
sudo -u curalyta ./config.sh remove --token $(gh api -X POST repos/Muhammadabrarrayhan2/curalyta/actions/runners/remove-token --jq .token)
# 2. Host Proxmox: hapus VM dan template
qm stop 101; qm stop 102; qm destroy 101 --purge; qm destroy 102 --purge; qm destroy 9000 --purge
# 3. Laptop: matikan dan hapus VM VMware
vmrun -T ws stop "<path>\curalyta-pve.vmx" hard
#    lalu VMware → klik kanan curalyta-pve → Manage → Delete from Disk
#    dan hapus folder E:\curalyta-lab (disk backup)
# 4. Kembalikan Windows: bcdedit /set hypervisorlaunchtype auto, nyalakan Memory integrity, restart
# 5. Opsional: hapus image GHCR (GitHub → Packages) dan nonaktifkan proyek Vercel staging
```
