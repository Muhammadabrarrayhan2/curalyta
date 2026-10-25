# Pemetaan Unit Kompetensi ke Bukti

Skema: Insinyur Cloud Computing (Cloud Computing Engineer), LSP Informatika
Acuan: SKKNI Kepmenaker No. 456 Tahun 2015
Portofolio: Curalyta, https://github.com/Muhammadabrarrayhan2/curalyta

Prinsip VATM:
- Valid: setiap bukti terkait langsung dengan unit.
- Asli: dikerjakan pada lab dan repositori milik peserta, dengan riwayat commit dan log berwaktu.
- Terkini: dilaksanakan 23–25 Oktober 2026.
- Memadai: setiap unit didukung dokumen, log eksekusi, dan screenshot.

Kendala dan kegagalan selama pelaksanaan dicatat apa adanya di log dan commit.

| Kode | Unit | Dokumen utama | Bukti eksekusi (`docs/bukti/`) | Screenshot (`DAFTAR_SCREENSHOT.md`) |
|---|---|---|---|---|
| J.631120.001.01 | Mendefinisikan terminologi dan konsep cloud computing | `KONSEP_CLOUD.md` (NIST, IaaS/PaaS/SaaS, deployment, shared responsibility, elastisitas, multi-tenancy, SLA; semua dengan contoh lab) | Contoh konsep merujuk resource nyata: `tahap3-provision-proxmox.log`, `tahap4-5-cicd-deploy-staging.log` | U1-01 s.d. U1-05 |
| J.631120.002.01 | Mengidentifikasi teknologi cloud computing | `TEKNOLOGI_CLOUD.md` (virtualisasi, container, registry, reverse proxy, object/block storage, VPC/firewall, IAM, CI/CD, monitoring, perbandingan VM vs PaaS vs Kubernetes), `ARSITEKTUR.md` | `tahap2-verifikasi-lokal.log`, `tahap3-provision-proxmox.log` (`/dev/kvm`, firewall), `tahap2-uji-beban.log` (pengujian performa/stres) | U2-01 s.d. U2-07 |
| J.631120.003.01 | Mengidentifikasi berbagai jenis perangkat keras yang dibutuhkan | `KEBUTUHAN_PERANGKAT_KERAS.md` (vCPU, RAM, storage, bandwidth dari data terukur; alasan ukuran VM; scale up/out; pembanding on-premise) | `tahap3-pengukuran-sumber-daya.log`, `tahap2-uji-beban.log` | U3-01 s.d. U3-05 |
| J.631120.013.01 | Menjalankan aktivitas rutin pada IaaS, PaaS, dan SaaS | `AKTIVITAS_RUTIN.md` (checklist harian/mingguan/bulanan + log pelaksanaan 25-10-2026), `SOP_OPERASIONAL.md`, `DEPLOYMENT.md` | `tahap4-patching-os.log`, `tahap7-backup-restore.log`, `tahap7-vzdump-restore-vm.log`, `tahap7-vzdump-snapshot.log`, `tahap4-5-cicd-deploy-staging.log` | U4-01 s.d. U4-08 |
| J.631120.014.01 | Memantau sarana dan prasarana agar bisa digunakan oleh user sesuai dengan SLA | `SLA.md`, `PEMANTAUAN.md` (target, alert & ambang, cara baca dashboard, hasil laporan SLA, analisis penyimpangan) | `laporan-sla-2026-10-25.md`, `tahap7-simulasi-insiden.log` (alert → notifikasi) | U5-01 s.d. U5-06 |
| J.631120.015.01 | Memberikan dukungan teknis atas masalah user dan report next layer | `SOP_DUKUNGAN_TEKNIS.md` (alur tiket, prioritas P1–P4, troubleshooting, matriks eskalasi L1–L3, template), `LAPORAN_INSIDEN_001.md` (simulasi INC-001 + insiden nyata INC-002) | `tahap7-simulasi-insiden.log`, `insiden-002-tunnel-kedaluwarsa.log` | U6-01 s.d. U6-05 |

## Rincian per unit dan elemen

### Unit 1: Terminologi dan konsep
| Elemen | Bukti |
|---|---|
| Mendefinisikan cloud dan karakteristiknya | `KONSEP_CLOUD.md` bagian 1–2 (5 karakteristik NIST dengan contoh) |
| Menjelaskan model layanan | Bagian 3: IaaS = Proxmox VM, PaaS = Vercel, SaaS = GitHub/Groq/ntfy |
| Menjelaskan model deployment | Bagian 4: hybrid (private lab + public cloud) beserta alasannya |
| Menjelaskan SLA dan istilah terkait | Bagian 8 + `SLA.md` |

### Unit 2: Teknologi
| Elemen | Bukti |
|---|---|
| Mengidentifikasi virtualisasi | VMware → Proxmox KVM nested; log `/dev/kvm` |
| Mengidentifikasi teknologi jaringan dan keamanan | Subnet lab, firewall per VM (default DROP), Cloudflare Tunnel, IAM/least privilege |
| Mengidentifikasi teknologi storage | Block (LVM-thin), file (volume uploads, vzdump), object (Garage S3), relational (PostgreSQL) |
| Mengidentifikasi teknologi otomasi | CI/CD GitHub Actions + runner self-hosted; skrip `ops/` |
| Pengujian sistem cloud | Uji integrasi (CI, healthcheck), performa dan stres (k6 10–200 VU) |

### Unit 3: Perangkat keras
| Elemen | Bukti |
|---|---|
| Mengidentifikasi kebutuhan compute | Pengukuran CPU/RAM per VM dan host; kapasitas ±1.600 req/s pada 2 vCPU |
| Mengidentifikasi kebutuhan storage | Pemakaian disk, ukuran backup, keputusan retensi vzdump karena kapasitas |
| Mengidentifikasi kebutuhan jaringan | Bandwidth terukur saat uji beban; estimasi per pengguna |
| Mengidentifikasi perangkat pendukung | UPS, pendinginan, router/firewall pada pembanding on-premise |

### Unit 4: Aktivitas rutin IaaS, PaaS, SaaS
| Elemen | Bukti |
|---|---|
| Backup dan restore | Backup DB → object storage, restore ke DB uji (2 s); vzdump VM + restore penuh ke VM ID baru (327 s) + uji integritas; snapshot + rollback |
| Patching / update | Patch host Proxmox (kernel 7.0.14), patch VM + unattended-upgrades, uji pasca-pemeliharaan |
| Deploy dan rollback | Pipeline CI/CD (test → build → deploy), rollback dengan tag; deploy freeze saat insiden |
| Aktivitas PaaS | Deployment staging Vercel, rewrite `/api`, rollback deployment |
| Aktivitas SaaS | Pengelolaan runner, token sekali pakai, secret, notification channel |

### Unit 5: Pemantauan sesuai SLA
| Elemen | Bukti |
|---|---|
| Menetapkan parameter SLA | `SLA.md`: 99%, < 1 s, RPO 24 jam, RTO 1 jam, jam layanan, tingkat keparahan |
| Memantau sarana | Prometheus 11 target, dashboard Grafana, uptime check internal dan publik |
| Alert dan notifikasi | 8 aturan alert, Alertmanager → ntfy; terbukti pada INC-001 |
| Laporan dan analisis penyimpangan | `laporan-sla-2026-10-25.md` + analisis di `PEMANTAUAN.md` bagian 5 |

### Unit 6: Dukungan teknis
| Elemen | Bukti |
|---|---|
| Menerima dan mengklasifikasi masalah | Template tiket, matriks prioritas P1–P4 |
| Mendiagnosis dan menyelesaikan | Panduan troubleshooting 6 masalah umum; diagnosis INC-001 dan INC-002 |
| Eskalasi (report next layer) | Matriks eskalasi L1 → L2 → L3/vendor beserta batas waktunya |
| Melaporkan insiden | `LAPORAN_INSIDEN_001.md` dengan timeline, RCA, dampak SLA, tindakan pencegahan |

## Riwayat kerja (keaslian)

`git log --oneline` menunjukkan seluruh tahapan, termasuk perbaikan atas temuan saat eksekusi nyata. Contohnya:
- `c3bfa30` deploy memakai tag lama
- `2d065e1` re-exec deploy
- `c031cde` MinIO diganti Garage
- `0423955` ntfy menolak email anonim
- `ed8af70` jam host setelah laptop tidur
- `352af86` watchdog tunnel
