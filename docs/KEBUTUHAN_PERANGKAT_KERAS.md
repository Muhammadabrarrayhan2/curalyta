# Analisis Kebutuhan Perangkat Keras

Unit kompetensi: J.631120.003.01, Mengidentifikasi berbagai jenis perangkat keras yang dibutuhkan

Analisis ini berbasis pengukuran nyata dari lab (Prometheus node_exporter, cAdvisor, `docker stats`, uji beban k6). Data mentah ada di `docs/bukti/tahap3-pengukuran-sumber-daya.log` dan `docs/bukti/tahap2-uji-beban.log`.

## 1. Perangkat keras yang dipakai

### 1.1 Host fisik (laptop)

| Komponen | Spesifikasi | Catatan |
|---|---|---|
| CPU | Intel Core i7-12700H, 14 core / 20 thread, VT-x + EPT | Mendukung virtualisasi bersarang setelah Hyper-V Windows dimatikan |
| RAM | 16 GB (15,7 GB terbaca) | Sumber daya paling terbatas (lihat 3.4) |
| Storage | SSD NVMe WD SN810 512 GB, dibagi C: 202 GB, D: 111 GB, E: 162 GB | Ruang kosong total hanya ±20 GB saat lab dibangun |
| Jaringan | Wi-Fi laptop; VMware NAT `vmnet8` 192.168.45.0/24 | Akses publik keluar lewat Cloudflare Tunnel |
| Daya | Baterai + adaptor | Laptop tidur menghentikan seluruh lab (insiden INC-002) |

### 1.2 Sumber daya virtual

| Mesin | vCPU | RAM | Disk | Peran |
|---|---|---|---|---|
| `curalyta-pve` (VM VMware) | 6 | 4,5 GB | 80 GB NVMe thin (terisi ±16 GB) + disk backup 30 GB thin di E: | Hypervisor Proxmox VE 9.2 |
| VM 101 `curalyta-app` | 2 | 2 GB | 25 GB (LVM-thin, linked clone) | Nginx, frontend, backend, PostgreSQL, runner CI, tunnel |
| VM 102 `curalyta-monitor` | 2 | 1,25 GB | 20 GB (LVM-thin, linked clone) | Prometheus, Grafana, Alertmanager, Blackbox, Garage |
| Template 9000 | - | - | 2,2 GB (base image) | Sumber linked clone |

Ukuran RAM sempat diturunkan dua kali (8 → 6 → 4,5 GB untuk host Proxmox; 2,5 → 2 GB dan 1,5 → 1,25 GB untuk VM). Alasannya: commit memori Windows mencapai 32,3/33,4 GB dan pagefile membengkak hingga memenuhi drive C:.

## 2. Hasil pengukuran

Rentang 3 jam, termasuk uji beban 10–200 virtual user.

| Metrik | `curalyta-app` | `curalyta-monitor` | `pve` (host) |
|---|---|---|---|
| CPU rata-rata | 17,9% | 11,2% | 19,3% |
| CPU puncak (rata-rata 2 menit) | 73,2% (uji beban) | 77,7% (generator beban k6) | 81,4% |
| Memori rata-rata / puncak | 31,3% / 37,7% (±0,7 GB) | 49,1% / 55,4% (±0,65 GB) | 81,1% / 96,4%, swap 1,7 GB |
| Disk root terpakai | 4,44 GB (18%) | 3,99 GB (21%) | 6,89 GB (23%) |
| Jaringan puncak rx/tx | 15,2 / 16,6 Mbit/s | 16,7 / 2,0 Mbit/s | <0,1 Mbit/s |

Pemakaian per container di VM aplikasi (`docker stats`): backend 28–61 MiB, PostgreSQL 52–59 MiB, Nginx 6–7 MiB, frontend 3–4 MiB, cAdvisor 18 MiB. Image Docker di VM 1,13 GB. Database saat ini kecil (dump 41,6 KB). Arsip vzdump VM 101: 2,08 GB (25 GiB disk, terisi ±5,3 GB).

### Kapasitas aplikasi (uji beban, 2 vCPU)

| VU | req/s | p95 | maks | gagal |
|---|---|---|---|---|
| 10 | 1.473 | 16,6 ms | 39 ms | 0% |
| 25 | 1.607 | 37,9 ms | 184 ms | 0% |
| 50 | 1.618 | 74,3 ms | 644 ms | 0% |
| 100 | 1.608 | 135,4 ms | 2.481 ms | 0% |
| 200 | 1.630 | 139,9 ms | 8.260 ms | 0% |

Throughput jenuh di ±1.600 req/s mulai 25 VU, ketika CPU 2 vCPU menjadi pembatas. Di atas itu latensi bertambah karena antrean, tetapi tidak ada error dan sistem pulih seketika.

## 3. Analisis per sumber daya

### 3.1 vCPU
- Beban normal (pemantauan + akses ringan) memakai ±18% dari 2 vCPU. Saat jenuh, 2 vCPU melayani ±1.600 req/s endpoint ringan.
- Perkiraan beban nyata: 1 klinik dengan 20 dokter dan 200 pasien aktif harian menghasilkan puncak di bawah 20 req/s. Itu hanya ~1% dari kapasitas terukur.
- Kesimpulan: 2 vCPU cukup, dengan ruang besar untuk pertumbuhan. 1 vCPU masih mungkin, tetapi 2 vCPU memberi ruang untuk build/migrasi saat deploy dan proses backup.

### 3.2 RAM
- VM aplikasi memakai ±0,7 GB dari 2 GB (puncak 37,7%). Sisa dipakai page cache Linux untuk PostgreSQL.
- Kesimpulan: 2 GB cukup. Minimum yang aman 1,5 GB; di bawah itu PostgreSQL + Node.js + Docker mulai berebut memori.
- VM monitoring 1,25 GB memakai 55% saat puncak. Prometheus akan bertambah seiring retensi 45 hari, jadi 1,5–2 GB lebih aman untuk jangka panjang.

### 3.3 Storage
- Jenis: SSD wajib untuk database (latensi acak rendah). Seluruh lab memakai SSD NVMe; disk VM dibuat thin-provisioned (LVM-thin) agar ruang fisik terpakai sesuai isi.
- Kapasitas VM aplikasi: OS + Docker + image ±4,4 GB. Pertumbuhan utama berasal dari dokumen pasien (`curalyta_uploads`, batas 10 MB/file) dan data database. Dengan 25 GB, sisa ±20 GB cukup untuk ribuan dokumen.
- Backup: dump database disimpan di object storage dengan lifecycle 30 hari. Arsip vzdump (2,08 GB per VM 101) disimpan di disk terpisah. Karena ruang E: hanya ±6 GB, jadwal vzdump dibatasi 1 arsip VM 101; VM monitoring dibangun ulang dari skrip.
- Overcommit: total ukuran virtual disk thin (67 GiB) melebihi kapasitas thin pool (31 GiB). Ini aman selama pemakaian nyata 28% dan dipantau, tetapi butuh alert dan prosedur perluasan (`DiskHampirPenuh` > 80%).

### 3.4 RAM host (temuan utama)
Host Proxmox memakai rata-rata 81% dan puncak 96% RAM, ditambah 1,7 GB swap. Penyebabnya: dua VM (3,25 GB) + Proxmox (±0,8 GB) di dalam 4,5 GB. Di sisi Windows, VM 4,5 GB + aplikasi lain (VS Code ±7 GB) mendorong pagefile hingga 16–18 GB dan menghabiskan drive C:. Inilah batas skala lab ini: menambah VM ketiga tidak mungkin tanpa menambah RAM fisik.

### 3.5 Jaringan / bandwidth
- Uji beban 1.600 req/s menghasilkan ±16 Mbit/s di jaringan internal.
- Satu sesi pengguna (memuat SPA ±0,5 MB pertama kali, lalu API JSON beberapa KB) kira-kira 0,5–1 MB per kunjungan. 100 pengguna serentak ≈ < 10 Mbit/s.
- Kesimpulan: uplink internet 10–20 Mbps cukup untuk skala klinik. Latensi publik `/health` lewat Cloudflare Tunnel 0,5–0,9 detik, terutama dari perjalanan jaringan ke edge, bukan dari server (internal 2–5 ms).

## 4. Alasan pemilihan ukuran VM aplikasi (2 vCPU / 2 GB)

Setara kelas *small* di public cloud (mis. GCP e2-small, AWS t3.small: 2 vCPU, 2 GB):
1. Terukur cukup dengan margin >50× untuk beban klinik (bagian 3.1).
2. RAM 2 GB menampung keempat container dengan sisa >60% (3.2).
3. Ukuran lebih besar membuang sumber daya host yang justru paling terbatas (RAM, 3.4).
4. Ukuran lebih kecil (1 GB) berisiko OOM saat deploy (pull image + start container baru) dan backup.

## 5. Kapan perlu scale up atau scale out

| Pemicu (dari dashboard/alert) | Tindakan | Jenis |
|---|---|---|
| CPU VM aplikasi > 70% selama 15 menit pada jam kerja, atau p95 `/health` > 500 ms berulang | `qm set 101 --cores 4` (reboot terjadwal) | Scale up |
| Memori > 80% terus-menerus atau swap aktif | `qm set 101 --memory 4096` | Scale up |
| Disk > 80% | `qm resize 101 scsi0 +10G` lalu `growpart` + `resize2fs` | Scale up storage |
| Permintaan berkelanjutan > 1.200 req/s (75% kapasitas terukur) atau kebutuhan ketersediaan > 99,9% | Pisahkan PostgreSQL ke VM sendiri, tambah VM aplikasi kedua (clone template), Nginx/load balancer di depan | Scale out |
| Host RAM > 85% terus-menerus | Tambah RAM fisik atau pindahkan VM ke host kedua (cluster Proxmox) | Scale out host |

## 6. Perbandingan dengan server fisik on-premise setara

Kebutuhan setara lab ini untuk produksi kecil (1 klinik), dengan ruang untuk tumbuh 4×:

| Komponen | Spesifikasi on-premise yang disarankan | Fungsi | Setara di lab/cloud |
|---|---|---|---|
| Server | 1× server tower/rack entry (mis. Intel Xeon E-2300 4–6 core, 32 GB ECC) | Host hypervisor Proxmox | VM `curalyta-pve` |
| Storage | 2× SSD NVMe/SATA 960 GB dalam RAID 1 + 1× HDD 2–4 TB untuk backup | Disk VM dengan redundansi; backup lokal | `local-lvm` + `backup-disk` |
| Backup luar lokasi | NAS kecil atau object storage cloud | Salinan backup terpisah lokasi | Garage (beda VM) |
| Jaringan | Router/firewall (mis. pfSense/MikroTik), switch gigabit managed, internet 20–50 Mbps (IP publik opsional) | Segmentasi dan keamanan | VMware NAT + firewall Proxmox + Cloudflare Tunnel |
| Daya | UPS 1–1,5 kVA (runtime ±15–30 menit) | Mencegah mati mendadak |, (laptop: baterai, tetapi sleep mematikan lab) |
| Pendinginan & ruang | Ruang server/rak dengan AC, suhu 18–27 °C | Keandalan perangkat keras | - |
| Monitoring fisik | IPMI/iDRAC, sensor suhu | Pemantauan hardware | node_exporter (OS saja) |

Perbedaan utama terhadap cloud/lab:

| Aspek | On-premise | Public cloud IaaS | Lab laptop ini |
|---|---|---|---|
| Biaya awal | Tinggi (beli server, UPS, jaringan) | Nol | Nol (perangkat sudah ada) |
| Biaya rutin | Listrik, internet, perawatan, penggantian disk | Bayar per jam/bulan | Nol |
| Skalabilitas | Lambat (beli hardware baru) | Cepat (ubah tipe VM dalam menit) | Dibatasi RAM/disk laptop |
| Ketersediaan | Tergantung UPS, RAID, redundansi | SLA penyedia (mis. 99,9%+) | Rendah (laptop sleep/mati = downtime) |
| Kontrol data | Penuh, data di lokasi sendiri | Data di pusat data penyedia | Penuh |

Untuk data kesehatan yang sensitif, kombinasi yang disarankan adalah server on-premise atau private cloud untuk database, ditambah public cloud untuk komponen tanpa data pasien (CI/CD, staging, CDN). Pola hybrid ini sudah diterapkan di Curalyta (`docs/KONSEP_CLOUD.md` bagian 4).
