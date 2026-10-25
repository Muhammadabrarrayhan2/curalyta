# Terminologi dan Konsep Cloud Computing

Unit kompetensi: J.631120.001.01, Mendefinisikan terminologi dan konsep cloud computing
Studi kasus: Curalyta, platform layanan kesehatan (booking dokter, rekam medis, asisten AI)

Dokumen ini menjelaskan setiap konsep dengan contoh dari implementasi Curalyta yang benar-benar dijalankan. Nama resource, alamat IP, dan perintah merujuk ke lingkungan yang dibangun; bukti eksekusinya ada di `docs/bukti/`.

## 1. Definisi cloud computing

Cloud computing adalah model penyediaan sumber daya komputasi (server, penyimpanan, jaringan, aplikasi, layanan) melalui jaringan. Sumber daya itu dapat disediakan dan dilepas dengan cepat, dengan upaya pengelolaan atau interaksi penyedia yang minimal (NIST SP 800-145).

Pada Curalyta, sumber daya disediakan dalam tiga lapisan:

| Lapisan | Wujud di Curalyta |
|---|---|
| Sumber daya fisik | Laptop Intel Core i7-12700H, 16 GB RAM, SSD NVMe |
| Virtualisasi | VMware Workstation 17.6 → Proxmox VE 9.2 (hypervisor KVM) |
| Layanan | VM `curalyta-app` dan `curalyta-monitor` (IaaS), Vercel (PaaS), GitHub, Groq API, ntfy.sh (SaaS) |

> Catatan: Proxmox VE yang berjalan di atas VMware Workstation adalah laboratorium virtualisasi, bukan private cloud produksi. Seluruh mekanisme cloud (provisioning, isolasi, firewall, backup, monitoring) tetap dijalankan secara nyata.

## 2. Lima karakteristik esensial (NIST)

| Karakteristik | Pengertian | Contoh di Curalyta |
|---|---|---|
| On-demand self-service | Pengguna menyediakan sumber daya sendiri tanpa bantuan penyedia | VM dibuat dengan perintah `qm clone 9000 101` di `ops/lab/pve-setup.sh` dalam hitungan detik; staging di Vercel terbentuk otomatis setiap ada push |
| Broad network access | Layanan diakses lewat jaringan standar dari berbagai perangkat | Curalyta diakses lewat HTTPS dari browser laptop maupun ponsel melalui URL publik Cloudflare Tunnel |
| Resource pooling | Sumber daya fisik dipakai bersama oleh banyak konsumen | 6 vCPU dan 6 GB RAM host Proxmox dibagi ke VM aplikasi (2 vCPU/2,5 GB) dan VM monitoring (2 vCPU/1,5 GB); storage `local-lvm` thin-provisioned dipakai bersama |
| Rapid elasticity | Kapasitas ditambah atau dikurangi dengan cepat | RAM/vCPU VM dapat dinaikkan dengan `qm set 101 --memory 4096`; Vercel menambah kapasitas staging otomatis sesuai trafik |
| Measured service | Pemakaian sumber daya diukur dan dilaporkan | Prometheus mengukur CPU, memori, disk, jaringan, dan latensi; `ops/laporan-sla.sh` menghitung ketersediaan aktual terhadap target |

## 3. Model layanan

| Model | Yang dikelola penyedia | Yang dikelola pengguna | Implementasi di Curalyta |
|---|---|---|---|
| IaaS | Hardware, hypervisor, jaringan fisik | OS, runtime, aplikasi, data, keamanan OS | Proxmox VE menyediakan VM `curalyta-app` (101) dan `curalyta-monitor` (102). Tim Curalyta memasang Ubuntu 22.04, menambal OS (`unattended-upgrades`), memasang Docker, dan mengelola PostgreSQL |
| PaaS | Hardware sampai runtime dan proses build | Kode aplikasi dan konfigurasi | Vercel membangun dan menyajikan frontend staging langsung dari repositori GitHub; tidak ada OS atau server yang dikelola |
| SaaS | Seluruh aplikasi | Akun, akses, data, konfigurasi | GitHub (repositori, Actions, Secrets, GHCR), Groq API (model AI), ntfy.sh (notifikasi alert) |

Perbedaan IaaS dan PaaS paling terlihat saat menambal keamanan. Di VM `curalyta-app`, tim harus menjalankan patch OS dan me-restart container sendiri (`docs/AKTIVITAS_RUTIN.md`). Di Vercel, platform yang memperbarui sistem operasi dan runtime; tim hanya mengirim kode baru.

## 4. Model deployment

| Model | Pengertian | Penerapan di Curalyta |
|---|---|---|
| Public cloud | Infrastruktur milik penyedia, dipakai banyak pelanggan | Vercel, GitHub Actions, GHCR, Groq, Cloudflare |
| Private cloud | Infrastruktur khusus satu organisasi | Lab Proxmox VE: hanya untuk Curalyta, berada di jaringan NAT `192.168.45.0/24` |
| Hybrid cloud | Gabungan private dan public yang saling terhubung | Model yang dipakai Curalyta. Data pasien dan database tetap di private cloud (Proxmox), sedangkan staging frontend, CI/CD, dan registry image ada di public cloud. Keduanya dihubungkan oleh Cloudflare Tunnel (HTTPS keluar dari lab) dan runner GitHub self-hosted |
| Community cloud | Dipakai bersama oleh komunitas dengan kebutuhan serupa | Tidak dipakai; contoh relevannya adalah cloud bersama antar rumah sakit untuk rujukan pasien |

Alasan memilih hybrid: data kesehatan bersifat sensitif sehingga database disimpan di infrastruktur yang dikendalikan sendiri, sementara layanan yang tidak menyimpan data pasien (build, staging UI) memanfaatkan public cloud gratis.

## 5. Shared responsibility model

Tanggung jawab keamanan dibagi antara penyedia dan pengguna sesuai model layanan:

| Lapisan | Lab Proxmox (IaaS) | Vercel (PaaS) | GitHub/Groq (SaaS) |
|---|---|---|---|
| Fisik, listrik, pendinginan | Pemilik laptop | Penyedia | Penyedia |
| Hypervisor | Admin lab (patch Proxmox) | Penyedia | Penyedia |
| Jaringan dan firewall | Admin lab (firewall Proxmox per VM) | Penyedia | Penyedia |
| Sistem operasi | Tim Curalyta (patch Ubuntu) | Penyedia | Penyedia |
| Runtime dan container | Tim Curalyta (Docker, image) | Penyedia | Penyedia |
| Aplikasi dan konfigurasi | Tim Curalyta | Tim Curalyta | Tim Curalyta (pengaturan repo, workflow) |
| Data dan akses | Tim Curalyta | Tim Curalyta | Tim Curalyta (secret, token, hak akses) |

Contoh nyata tanggung jawab pengguna: secret produksi (password database, JWT secret, API key Groq) disimpan di `.env` VM dengan izin `600` dan tidak pernah di-commit; GitHub Actions memakai `GITHUB_TOKEN` berumur pendek untuk push image.

## 6. Elastisitas dan skalabilitas

| Istilah | Pengertian | Contoh di Curalyta |
|---|---|---|
| Vertical scaling (scale up/down) | Menambah atau mengurangi CPU/RAM pada satu server | `qm set 101 --cores 4 --memory 4096` lalu reboot VM aplikasi bila CPU > 80% terus-menerus |
| Horizontal scaling (scale out/in) | Menambah atau mengurangi jumlah instance | Clone VM aplikasi dari template 9000 dan menambah upstream di Nginx; pada PaaS, Vercel menambah instance edge otomatis |
| Elastisitas | Kapasitas mengikuti beban secara otomatis dan bisa turun kembali | Ada di staging Vercel. Di lab IaaS scaling dilakukan manual dengan pemicu alert `CPUTinggi`/`MemoriTinggi` |

Kriteria kapan perlu scale up atau scale out dibahas di `docs/KEBUTUHAN_PERANGKAT_KERAS.md`.

## 7. Multi-tenancy

Multi-tenancy berarti beberapa penyewa (tenant) memakai infrastruktur yang sama dengan isolasi satu sama lain.

- Tingkat hypervisor: VM `curalyta-app` dan `curalyta-monitor` berbagi CPU, RAM, dan disk host yang sama, tetapi terisolasi oleh KVM. Masing-masing punya kernel sendiri dan firewall sendiri (`/etc/pve/firewall/101.fw`, `102.fw`).
- Tingkat container: di dalam VM aplikasi, container `nginx`, `frontend`, `backend`, dan `postgres` berbagi kernel tetapi terisolasi oleh namespace dan cgroup; hanya `nginx` yang membuka port ke luar.
- Tingkat aplikasi: satu instance Curalyta melayani banyak dokter dan pasien. Isolasi data dilakukan oleh aplikasi: dokter hanya bisa membuka pasiennya sendiri (pemeriksaan `patient.doctorId` di backend).
- Public cloud: Vercel dan GitHub Actions melayani jutaan pengguna di infrastruktur bersama; runner GitHub-hosted adalah VM sekali pakai yang dihapus setelah job selesai.

## 8. Service Level Agreement (SLA)

SLA adalah kesepakatan tingkat layanan yang terukur antara penyedia dan pengguna. Istilah terkait:

| Istilah | Pengertian | Nilai Curalyta |
|---|---|---|
| SLI (indikator) | Metrik yang diukur | `probe_success` dan `probe_duration_seconds` dari uptime check `/health` |
| SLO (target) | Nilai target internal | Ketersediaan ≥ 99% per bulan, waktu respons `/health` < 1 detik |
| SLA (kesepakatan) | Komitmen beserta konsekuensinya | Didefinisikan di `docs/SLA.md` |
| RPO | Batas kehilangan data yang dapat diterima | 24 jam (backup database harian) |
| RTO | Batas waktu pemulihan layanan | 1 jam |

Target 99% berarti downtime maksimal sekitar 7 jam 18 menit per bulan (30,4 hari). Pengukuran dilakukan otomatis oleh Prometheus + Blackbox Exporter setiap 30 detik, dan pelaporannya oleh `ops/laporan-sla.sh`.

## 9. Glosarium singkat

| Istilah | Arti dalam konteks Curalyta |
|---|---|
| Hypervisor | Perangkat lunak yang menjalankan VM; di sini KVM pada Proxmox VE |
| VM (virtual machine) | Komputer virtual lengkap dengan OS sendiri (`curalyta-app`, `curalyta-monitor`) |
| Container | Proses terisolasi yang berbagi kernel host (`backend`, `postgres`, dll.) |
| Image | Template container yang tidak berubah, disimpan di registry (GHCR) |
| Template VM | VM dasar Ubuntu 22.04 (ID 9000) untuk membuat VM baru dengan cepat |
| Cloud-init | Mekanisme konfigurasi awal VM (user, SSH key, IP, paket) |
| Object storage | Penyimpanan berbasis objek lewat API S3 (Garage, bucket `curalyta-db-backups`) |
| Block storage | Disk virtual untuk VM (`local-lvm`, LVM-thin) |
| Reverse proxy | Gerbang tunggal yang meneruskan permintaan ke layanan internal (Nginx) |
| Snapshot | Salinan keadaan VM pada satu titik waktu (`qm snapshot`) |
| Backup vzdump | Arsip lengkap VM yang dapat dipulihkan ke VM baru |
| CI/CD | Otomasi uji, build, dan deploy (GitHub Actions) |
| Tunnel | Koneksi keluar terenkripsi yang membuat layanan lab dapat diakses publik (Cloudflare Tunnel) |
