import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  Activity,
  FileText,
  ShieldCheck,
  Stethoscope,
  User,
  Brain,
  ClipboardList,
  Bell,
  Users,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'

const AI_MODULES = [
  { n: '01', title: 'Smart Intake', desc: 'Ubah keluhan awam menjadi data klinis terstruktur.', icon: ClipboardList },
  { n: '02', title: 'Patient Summary', desc: 'Ringkasan pasien otomatis sebelum konsultasi dimulai.', icon: FileText },
  { n: '03', title: 'Red Flag Detector', desc: 'Deteksi dini tanda bahaya — prioritaskan kasus urgent.', icon: Bell },
  { n: '04', title: 'Differential Dx Assistant', desc: 'Daftar kemungkinan kondisi beserta alasan dan data yang kurang.', icon: Brain },
  { n: '05', title: 'Clinical Score Engine', desc: 'Hitung skor klinis otomatis dari data yang tersedia.', icon: Activity },
  { n: '06', title: 'Note Generator', desc: 'Draft SOAP dari chat dan intake — dokter tinggal review.', icon: FileText },
]

const ROLES = [
  {
    id: 'patient',
    label: 'Untuk Pasien',
    icon: User,
    points: [
      'Cari dan filter dokter dengan cepat',
      'Booking jadwal dengan slot real-time',
      'Chat langsung + konsultasi video',
      'Riwayat dan resep tersimpan aman',
    ],
  },
  {
    id: 'doctor',
    label: 'Untuk Dokter',
    icon: Stethoscope,
    points: [
      'Dashboard klinis terpadu',
      'AI clinical support: ringkasan, DDx, red flag',
      'Draft catatan SOAP otomatis',
      'To-do list & follow-up otomatis',
    ],
  },
  {
    id: 'admin',
    label: 'Untuk Admin',
    icon: ShieldCheck,
    points: [
      'Verifikasi STR/SIP terstruktur',
      'Monitoring konsultasi real-time',
      'Laporan & analitik operasional',
      'Audit trail dan moderasi konten',
    ],
  },
]

export default function Landing() {
  const { user, openLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true })
  }, [user, navigate])

  return (
    <div className="relative z-10 min-h-screen">
      {/* Top nav */}
      <header className="max-w-[1440px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div>
            <div className="font-serif-display text-[22px] leading-none text-teal-900">
              Curalyta
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-mute mt-1">
              Clinical Intelligence
            </div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-soft">
          <a href="#ai" className="hover:text-teal-700">AI Modules</a>
          <a href="#roles" className="hover:text-teal-700">Untuk Siapa</a>
          <a href="#trust" className="hover:text-teal-700">Trust &amp; Safety</a>
        </nav>
        <button onClick={openLogin} className="btn-primary">
          Masuk <ArrowRight size={14} />
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-10 pt-10 pb-20 md:pt-16 md:pb-28">
        <div className="grid md:grid-cols-12 gap-8 md:gap-14 items-end">
          <div className="md:col-span-7 animate-slide-up">
            <div className="eyebrow mb-5">Platform Kesehatan Digital · Indonesia</div>
            <h1 className="font-serif-display text-[52px] md:text-[72px] leading-[1.02] tracking-[-0.03em] text-ink">
              Menghubungkan <em className="italic text-coral">dokter</em>, pasien, dan keputusan klinis
              — dalam satu sistem yang
              <em className="italic text-teal-700"> tenang</em> dan presisi.
            </h1>
            <p className="mt-7 text-[16px] md:text-[17px] text-ink-soft leading-relaxed max-w-2xl">
              Curalyta bukan pengganti dokter. Curalyta adalah lapisan intelijen klinis
              yang membantu dokter memahami pasien lebih cepat, mendeteksi red flags lebih awal,
              dan mendokumentasikan konsultasi dengan lebih rapi — agar keputusan medis tetap
              berada di tangan klinisi, dengan lebih sedikit beban administratif.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <button onClick={openLogin} className="btn-primary text-base px-6 py-3">
                Coba Demo Interaktif
                <ArrowRight size={16} />
              </button>
              <a href="#ai" className="btn-ghost text-base px-6 py-3">
                Pelajari AI Modules
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="relative">
              {/* Decorative quote card */}
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-coral-soft rounded-full opacity-60 blur-2xl pointer-events-none" />
              <div className="relative bg-ivory-paper border border-line-soft rounded-[18px] p-7 shadow-medium">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles size={14} className="text-teal-700" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700">
                    AI Red Flag · Demo
                  </span>
                </div>
                <div className="p-4 bg-rose-soft/60 border border-rose-medical/20 rounded-xl mb-4">
                  <div className="text-[13px] font-medium text-rose-medical mb-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-medical animate-pulse-soft" />
                    Tanda bahaya terdeteksi
                  </div>
                  <div className="text-[12.5px] text-[#6E2929] leading-relaxed">
                    Pasien wanita 58 tahun: <strong>sesak napas + nyeri dada</strong> sejak
                    tadi malam. Pertimbangkan evaluasi kardiovaskular segera —
                    <em className="not-italic font-serif-display italic"> pasien mungkin membutuhkan IGD</em>.
                  </div>
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-mute mb-2">
                  Data yang kurang
                </div>
                <ul className="space-y-1.5 text-[12.5px] text-ink-soft">
                  <li className="flex gap-2"><span className="text-coral">◦</span> EKG / vital signs awal</li>
                  <li className="flex gap-2"><span className="text-coral">◦</span> Riwayat faktor risiko kardiovaskular</li>
                  <li className="flex gap-2"><span className="text-coral">◦</span> Lokasi dan karakter nyeri dada</li>
                </ul>
                <div className="mt-5 pt-4 border-t border-dashed border-line text-[10.5px] text-ink-mute leading-relaxed">
                  Hasil AI bersifat <strong>saran</strong>. Keputusan medis final tetap di tangan dokter.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Modules */}
      <section id="ai" className="bg-ivory-paper/70 border-y border-line-soft py-20 md:py-28">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="max-w-3xl mb-14">
            <div className="eyebrow mb-4">AI Clinical Support</div>
            <h2 className="font-serif-display text-[38px] md:text-[48px] leading-tight tracking-tight">
              Dua belas modul AI.
              <br />
              Satu tujuan: <em className="italic text-teal-700">dokter yang fokus</em>.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_MODULES.map((m, i) => {
              const Icon = m.icon
              return (
                <div
                  key={m.n}
                  className="group bg-ivory-paper border border-line-soft rounded-[14px] p-6 hover:border-teal-500 hover:shadow-medium transition-all stagger-item"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                      {m.n}
                    </div>
                    <Icon size={18} strokeWidth={1.6} className="text-teal-700 group-hover:text-coral transition-colors" />
                  </div>
                  <h3 className="font-serif-display text-[22px] leading-tight mb-2">{m.title}</h3>
                  <p className="text-[13px] text-ink-mute leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-[12.5px] text-ink-mute font-mono">
            Dan 6 modul lanjutan lainnya — Medical Reasoning, Follow-Up Assistant, Doctor To-Do Generator, Patient Education, Chat Support Layer, ML Prediction Engine.
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 md:py-28">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="mb-14 max-w-2xl">
            <div className="eyebrow mb-4">Satu Platform · Tiga Peran</div>
            <h2 className="font-serif-display text-[38px] md:text-[48px] leading-tight tracking-tight">
              Dibangun untuk <em className="italic text-coral">semua sisi</em> layanan kesehatan.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {ROLES.map((role, i) => {
              const Icon = role.icon
              return (
                <div
                  key={role.id}
                  className={`p-7 rounded-[18px] ${i === 1 ? 'bg-teal-900 text-ivory' : 'bg-ivory-paper border border-line-soft'}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-6 ${
                      i === 1 ? 'bg-ivory/10' : 'bg-ivory-deep'
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.75}
                      className={i === 1 ? 'text-ivory' : 'text-teal-900'}
                    />
                  </div>
                  <h3 className="font-serif-display text-[26px] leading-tight mb-4">{role.label}</h3>
                  <ul className="space-y-2.5">
                    {role.points.map((p) => (
                      <li key={p} className="flex gap-2.5 text-[13.5px]">
                        <span className={i === 1 ? 'text-coral-soft' : 'text-teal-700'}>—</span>
                        <span className={i === 1 ? 'text-ivory/90' : 'text-ink-soft'}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section id="trust" className="bg-ink text-ivory py-20 md:py-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-coral mb-4">
                Trust &amp; Safety
              </div>
              <h2 className="font-serif-display text-[38px] md:text-[44px] leading-tight tracking-tight">
                Keamanan dan kepatuhan bukan fitur tambahan — <em className="italic">itu fondasi</em>.
              </h2>
            </div>
            <div className="md:col-span-7 grid sm:grid-cols-2 gap-5">
              {[
                { title: 'UU PDP 27/2022', desc: 'Pemrosesan data pribadi dengan consent eksplisit dan hak subjek data.' },
                { title: 'Permenkes 20/2019', desc: 'Kepatuhan regulasi telemedicine Indonesia.' },
                { title: 'STR · KKI', desc: 'Verifikasi nomor STR melalui konsil kedokteran.' },
                { title: 'SATUSEHAT Ready', desc: 'Interoperabilitas dengan platform Kemenkes — opsional saat peluncuran.' },
                { title: 'Audit Trail', desc: 'Setiap akses rekam medis tercatat dan dapat diaudit.' },
                { title: 'E2E Encryption', desc: 'Enkripsi ujung-ke-ujung untuk chat medis sensitif.' },
              ].map((t) => (
                <div key={t.title} className="border-t border-ivory/15 pt-5">
                  <div className="font-serif-display text-[18px] mb-1.5">{t.title}</div>
                  <div className="text-[13px] text-ivory/70 leading-relaxed">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h3 className="font-serif-display text-[36px] md:text-[44px] leading-tight tracking-tight mb-4">
            Siap melihat <em className="italic text-coral">Curalyta</em> bekerja?
          </h3>
          <p className="text-ink-mute mb-8">
            Pilih peran — Pasien, Dokter, atau Admin — dan jelajahi semua alur secara langsung.
          </p>
          <button onClick={openLogin} className="btn-primary text-base px-7 py-3.5">
            Masuk sebagai peran apapun
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="border-t border-line-soft py-8 text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-ink-mute">
          Curalyta © 2026 · Clinical Intelligence Platform
        </div>
      </footer>
    </div>
  )
}
