# Curalyta — Clinical Intelligence Platform

Platform kesehatan digital yang menghubungkan **pasien, dokter, dan admin** dalam satu sistem terpadu. Dilengkapi dengan AI clinical support sebagai *decision support* (bukan pengganti dokter).

## Teknologi

- **React 18** + **Vite 5**
- **React Router 6**
- **Tailwind CSS 3** dengan design tokens kustom
- **Lucide React** untuk ikon
- **Typography:** Fraunces (display) + Geist (body) + Geist Mono (mono)

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

## Build Production

```bash
npm run build
npm run preview
```

## Struktur Project

```
src/
  components/        # UI primitives (Card, Chip, TopBar, Sidebar, LoginModal, ...)
  context/           # AuthContext — popup-based role selector (siap di-upgrade ke email auth)
  data/              # Mock data untuk demo
  lib/               # Helper utilities
  pages/
    patient/         # 8 halaman pasien
    doctor/          # 9 halaman dokter
    admin/           # 11 halaman admin
    Landing.jsx      # Landing page publik
  styles/
    global.css       # Tailwind + custom global styles
  App.jsx            # Routing root
  main.jsx           # Entry point
```

## Tentang Autentikasi

Saat ini menggunakan **popup role-selector** (tanpa email/password) — sesuai permintaan
untuk tahap prototipe. Struktur `AuthContext.jsx` sudah dirancang agar nanti mudah
di-upgrade ke email/password atau OAuth, cukup mengubah fungsi `login()` tanpa perlu
mengubah komponen lain.

Tiga peran yang bisa dipilih:
- **Pasien** — Raka Wijaya (29L)
- **Dokter** — dr. Ayu Pradipta, Sp.PD
- **Admin** — Satya Nugraha (Clinical Ops Lead)

## Fitur yang Sudah Diimplementasikan

### Pasien
- Beranda dengan greeting kontekstual, quick actions, upcoming booking, AI patient education
- Cari dokter dengan filter (spesialis, mode, sort) + booking flow 4-step
- Jadwal konsultasi (upcoming vs past)
- Chat E2E encrypted
- Riwayat konsultasi, resep digital, file medis
- Profil pasien + info medis
- Notifikasi

### Dokter
- Beranda dengan urgent red-flag banner, AI Clinical Briefing
- **Ruang Konsultasi** (halaman paling canggih):
  - 3-pane: antrian pasien, chat, AI Clinical Support
  - Patient Summary Engine
  - Red Flag Detector
  - Differential Dx Assistant (dengan probabilitas + reasoning)
  - Clinical Score Engine (HEART, Wells, qSOFA)
  - Missing Data Checklist
  - Suggested Questions
  - AI Note Generator (draft SOAP siap review)
- To-Do List kanban (AI-generated tasks)
- Booking masuk, jadwal praktik, daftar pasien, catatan, profil profesional

### Admin
- Dashboard dengan stats + chart + pending verifications
- Verifikasi dokter dengan modal review (STR/SIP, KKI compliance)
- Data dokter & pasien (table)
- Manajemen user (suspend, reset, force logout)
- Spesialisasi & layanan
- Booking monitoring
- Live consultations monitoring
- Laporan & analitik dengan chart
- Audit log + PHI access log + laporan moderasi
- Pengaturan sistem (AI features, notifications, 2FA, integrations)

## Compliance

Design sudah memperhitungkan:
- **UU PDP No. 27/2022** — pemrosesan data pribadi dengan consent
- **Permenkes No. 20/2019** — regulasi telemedicine Indonesia
- **STR via KKI** — verifikasi dokter
- **SATUSEHAT-ready** — opsi integrasi Kemenkes
- **Audit trail** pada akses rekam medis
- **E2E encryption** pada chat medis

## Roadmap Selanjutnya

1. Ganti popup-auth ke email/password + 2FA
2. Backend API + database (Postgres recommended)
3. E-resep dengan tanda tangan digital
4. Video consultation (Jitsi / WebRTC)
5. Payment gateway integration (Midtrans/Xendit)
6. Mobile app (React Native)
7. Integrasi SATUSEHAT Kemenkes
