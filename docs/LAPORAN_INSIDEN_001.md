# Laporan Insiden INC-001: Backend API Berhenti (Simulasi)

| Atribut | Nilai |
|---|---|
| Jenis | Simulasi terkendali (Lab 4 materi pelatihan) |
| Prioritas | P1 (Critical) (layanan utama tidak dapat dipakai) |
| Layanan terdampak | API dan halaman yang membutuhkan data Curalyta produksi (VM 101 `curalyta-app`) |
| Mulai gangguan | 25-10-2026 11:50:25 WIB |
| Terdeteksi (alert firing) | 11:52:08 WIB |
| Notifikasi diterima | 11:52:01–11:52:10 WIB (ntfy.sh) |
| Layanan pulih | 11:52:27 WIB |
| Alert resolved | 11:53:12 WIB |
| Durasi dampak | 2 menit 2 detik |
| Penanggung jawab | L1 helpdesk (diagnosis + restart), tanpa eskalasi |
| Bukti | `docs/bukti/tahap7-simulasi-insiden.log` |

Semua waktu memakai jam VM yang tersinkron NTP.

## 1. Ringkasan

Untuk menguji alur pemantauan dan dukungan teknis, container `backend` di VM `curalyta-app` dihentikan dengan sengaja. Uptime check mendeteksi kegagalan, Alertmanager mengirim notifikasi P1 ke ntfy, petugas L1 mendiagnosis dengan `ops/healthcheck.sh`, lalu memulihkan layanan dengan menjalankan ulang container. Layanan pulih dalam 2 menit 2 detik. Ini jauh di bawah RTO 1 jam dan target pemulihan P1.

## 2. Dampak

- `GET /health` dan seluruh `/api/*` gagal (Nginx membalas 502/tanpa respons). Login, data pasien, dan fitur AI tidak dapat dipakai.
- Halaman statis frontend tetap dapat dibuka, tetapi tidak dapat memuat data.
- Staging Vercel ikut terdampak karena memanggil API produksi.
- Tidak ada kehilangan data: PostgreSQL tetap berjalan.

## 3. Timeline

| Waktu (WIB) | Sejak awal | Kejadian |
|---|---|---|
| 11:50:23 | - | Kondisi awal: tidak ada alert, `probe_success` internal = 1, publik = 1 |
| 11:50:25 | 0 s | Gangguan: `docker compose stop backend` |
| 11:50:26 | +1 s | Dampak ke pengguna: `GET /health` tidak mendapat respons |
| 11:51:09 | +44 s | Prometheus: alert `LayananTidakTersedia` *pending* (menunggu durasi 1 menit) |
| 11:52:01 | +96 s | ntfy menerima notifikasi `[firing] LayananTidakTersedia (P1)` (jalur publik) |
| 11:52:08 | +103 s | Deteksi: alert *firing* untuk jalur internal dan publik; Alertmanager menerima keduanya |
| 11:52:11 | +106 s | Diagnosis L1: `healthcheck.sh` → `[FAIL] /health HTTP 502`, `[FAIL] container backend exited`; container lain sehat; log Nginx `/health` status 502 |
| 11:52:19 | +114 s | Kesimpulan: container backend berhenti. Tindakan dalam kewenangan L1: jalankan ulang |
| 11:52:19 | +114 s | Pemulihan: `docker compose start backend` |
| 11:52:27 | +122 s | Backend *healthy*, `GET /health` HTTP 200 |
| 11:53:12 | +167 s | Prometheus: alert *resolved* |
| 11:54:01 | +216 s | ntfy menerima notifikasi `[resolved]` |
| 11:54:06 | - | Verifikasi akhir: `healthcheck.sh` OK, database `up`, latensi 4,5 ms |

## 4. Akar masalah

Container `backend` berhenti; pada simulasi ini dihentikan dengan sengaja. Nginx tidak memiliki upstream yang hidup untuk `/api` dan `/health`. Dalam operasi nyata, penyebab yang setara: proses crash, kehabisan memori, atau container dihentikan oleh deploy yang gagal.

## 5. Tindakan pemulihan

1. `ssh curalyta@192.168.45.20`
2. `/opt/curalyta/ops/healthcheck.sh` untuk mengidentifikasi komponen yang gagal.
3. `cd /opt/curalyta && docker compose start backend`
4. Verifikasi: `healthcheck.sh` OK, dashboard hijau, alert *resolved*.

## 6. Pengaruh terhadap SLA

Downtime tidak terencana yang setara: 2 menit 2 detik. Anggaran downtime bulanan untuk target 99% adalah 7 jam 18 menit, sehingga insiden ini memakai ±0,5% anggaran. Karena terencana (simulasi), insiden ini dapat dikecualikan sesuai `SLA.md` bagian 3. Perhitungan tanpa pengecualian ada di `PEMANTAUAN.md` bagian 5.

| Indikator | Target | Hasil |
|---|---|---|
| Respons awal P1 | ≤ 15 menit | 3 detik setelah alert (diagnosis otomatis dimulai 11:52:11) |
| Waktu deteksi | - | 103 detik (durasi `for: 1m` + interval probe 30 s) |
| Waktu pulih | ≤ 1 jam (RTO) | 2 menit 2 detik |

## 7. Pelajaran dan tindakan pencegahan

| No | Temuan selama pelaksanaan | Tindakan | Status |
|---|---|---|---|
| 1 | ntfy.sh menolak email anonim; notifikasi pertama gagal (error 40053) | Alert dikirim sebagai push; email aktif setelah token akun ntfy dipasang (`ops/lab/set-ntfy-token.sh`, email uji diterima 25-10-2026 14:17 WIB) | Selesai (`0423955`, `d2d9109`) |
| 2 | Deploy CI/CD otomatis bisa menyalakan ulang layanan di tengah penanganan insiden | Bekukan deploy (hentikan runner) selama insiden; dicatat di SOP | Selesai (dijalankan pada simulasi ini) |
| 3 | Laptop host tidur di tengah percobaan pertama sehingga timeline tidak valid | Matikan sleep saat terhubung daya; chrony `makestep 1 -1` | Selesai (`ed8af70`) |
| 4 | Deteksi butuh 103 s | Dapat dipercepat menjadi ±45 s dengan probe 15 s dan `for: 30s`, dengan risiko alert palsu lebih tinggi | Dipertimbangkan |
| 5 | Pemulihan masih manual | Docker `restart: unless-stopped` sudah menangani crash; untuk container yang dihentikan, healthcheck eksternal + restart otomatis dapat ditambahkan | Dipertimbangkan |

## 8. Bukti

- Log lengkap: `docs/bukti/tahap7-simulasi-insiden.log`
- Screenshot yang perlu diambil: U5-04, U5-05, U6-01, U6-02, U6-03 (`docs/DAFTAR_SCREENSHOT.md`)

---

# Lampiran: Insiden Nyata INC-002: Jalur Publik HTTPS Mati Setelah Host Tidur

| Atribut | Nilai |
|---|---|
| Jenis | Insiden nyata (tidak direncanakan) |
| Prioritas | P2 (akses publik dan staging terganggu; jalur internal dan data aman) |
| Terdeteksi | Alert `LayananTidakTersedia` jalur publik, firing sejak 11:34:29 WIB |
| Pulih | 11:37:33 WIB (URL baru), staging tersinkron ±11:39 WIB |
| Bukti | `docs/bukti/insiden-002-tunnel-kedaluwarsa.log` |

Ringkasan. Laptop host tidur ±1 jam (10:36–11:32 WIB). Quick tunnel Cloudflare terputus dan dihapus di sisi Cloudflare. Setelah laptop bangun, `cloudflared` terus mencoba tunnel lama ("Unauthorized: Tunnel not found") tanpa keluar, sehingga `Restart=always` tidak memicu. Jalur internal tetap sehat.

Diagnosis. `systemctl is-active curalyta-tunnel` = active, tetapi log berisi "Tunnel not found"; publik HTTP 000; internal HTTP 200.

Pemulihan. `sudo systemctl restart curalyta-tunnel` menghasilkan URL baru `https://produces-solving-teddy-itself.trycloudflare.com`. Lalu `ops/lab/update-public-url.sh` memperbarui CORS, target Prometheus, dan rewrite Vercel (commit `d9d8766`). Verifikasi: publik dan staging HTTP 200.

Pencegahan.
1. `ops/lab/tunnel-watchdog.sh` (timer 2 menit) me-restart tunnel otomatis bila muncul "Tunnel not found" (`352af86`).
2. Matikan sleep laptop saat terhubung daya.
3. Jangka panjang: named tunnel Cloudflare dengan domain sendiri agar URL tetap.
4. Tambahkan uptime check eksternal (lihat `PEMANTAUAN.md` 5.2).

## Lampiran B: INC-003 Laptop host tidur, Proxmox crash saat resume, URL publik berubah (nyata, 25 Oktober 2026)

| Atribut | Nilai |
|---|---|
| Prioritas | P1 (seluruh layanan tidak tersedia, lalu jalur publik tidak dapat diakses) |
| Mulai | 15:01:49 WIB, laptop host masuk mode tidur (sleep). VMware mem-pause VM `curalyta-pve` |
| Terdeteksi | 16:11 WIB alert `LayananTidakTersedia` (P1) dan 16:14 WIB `HalamanWebGagal` (P2), diterima di aplikasi ntfy ponsel |
| Pulih | 16:23 WIB alert resolved; semua probe (produksi dan staging) UP 16:24 WIB |
| Durasi dampak | ±82 menit (15:02–16:24 WIB). Selama laptop tidur monitoring ikut berhenti, sehingga alert baru muncul setelah lab hidup kembali |

Kronologi (dari `vmware.log` di host dan log VM):

| Waktu (WIB) | Kejadian |
|---|---|
| 15:01:49 | `PowerNotify: System suspend detected`, VM di-pause |
| 16:10:50 | `System resume detected`. Sesaat setelahnya guest Proxmox menghentikan CPU (`The CPU has been disabled by the guest operating system`) lalu meminta hard reset (`The guest has requested that the virtual machine be hard reset`) |
| 16:08–16:09 (jam guest) | Proxmox, VM 101, dan VM 102 boot ulang otomatis (`onboot=1`). Jam guest masih tertinggal beberapa menit sebelum chrony menyesuaikan |
| 16:10 | `cloudflared` meminta quick tunnel baru: `https://flashing-followed-montgomery-ccd.trycloudflare.com` |
| 16:11 / 16:14 | Alert P1 dan P2 untuk URL lama dikirim ke ntfy (push dan email) |
| 16:21 | Diagnosis: internal `/health` HTTP 200, URL lama HTTP 000, URL baru HTTP 200 |
| 16:22 | `ops/lab/update-public-url.sh` memperbarui CORS, target Prometheus, dan rewrite Vercel (commit `6e7487a`) |
| 16:23–16:24 | Alert resolved, semua probe UP |

Akar masalah. Laptop host masuk mode tidur saat lab berjalan. Setelah resume, hypervisor bersarang (Proxmox/KVM di dalam VMware) tidak dapat melanjutkan eksekusi dan di-reset. Reboot memicu masalah kedua: quick tunnel Cloudflare selalu memberi URL baru, sementara pemantauan dan staging masih mengarah ke URL lama. Tekanan memori host ikut memperburuk kondisi (RAM terpakai 95%, committed 32,4/33,4 GB, pagefile 17,7 GB, C: hampir penuh; lihat `docs/screenshot/U3-01-task-manager.png`).

Pemulihan. Layanan aplikasi pulih otomatis setelah reboot. Jalur publik dipulihkan dengan `ops/lab/update-public-url.sh`.

Pencegahan.
1. Matikan sleep saat laptop terhubung daya (Settings → System → Power → Screen and sleep → "Never" saat plugged in). Ini juga tindak lanjut INC-002 yang belum dijalankan.
2. Named tunnel Cloudflare dengan domain tetap, agar reboot tidak mengubah alamat publik.
3. Uptime check eksternal, agar matinya seluruh host tetap terdeteksi saat monitoring internal ikut mati.
4. Kurangi beban memori host (tutup aplikasi lain saat lab berjalan) dan kosongkan ruang C:.
