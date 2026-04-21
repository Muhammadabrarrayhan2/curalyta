import { useEffect } from 'react'
import { User, Stethoscope, ShieldCheck, X, ArrowRight, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandMark from './BrandMark'

const ROLES = [
  {
    id: 'patient',
    label: 'Pasien',
    description: 'Cari dokter, atur jadwal konsultasi, dan akses riwayat medis Anda.',
    icon: User,
    accent: 'from-teal-100 to-ivory-deep',
    sample: 'Raka Wijaya',
  },
  {
    id: 'doctor',
    label: 'Dokter',
    description: 'Kelola jadwal, pasien, catatan medis, dan dibantu AI clinical support.',
    icon: Stethoscope,
    accent: 'from-sage/40 to-ivory-deep',
    sample: 'dr. Ayu Pradipta, Sp.PD',
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Verifikasi dokter, moderasi platform, dan monitoring operasional.',
    icon: ShieldCheck,
    accent: 'from-sand/60 to-ivory-deep',
    sample: 'Satya Nugraha',
  },
]

export default function LoginModal() {
  const { loginOpen, closeLogin, login } = useAuth()

  // ESC closes
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && loginOpen && closeLogin()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [loginOpen, closeLogin])

  if (!loginOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={closeLogin}
      />

      {/* Modal body */}
      <div className="relative w-full max-w-2xl bg-ivory-paper border border-line-soft rounded-[18px] shadow-large animate-scale-in overflow-hidden">
        {/* Header strip with decorative gradient */}
        <div className="relative px-8 pt-8 pb-6 border-b border-line-soft">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 10% 0%, rgba(43,134,128,0.12) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(225,95,63,0.08) 0%, transparent 55%)',
            }}
          />
          <button
            onClick={closeLogin}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ivory-deep hover:bg-line-soft transition-colors flex items-center justify-center"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>

          <div className="relative flex items-center gap-3 mb-4">
            <BrandMark size={36} />
            <div>
              <div className="font-serif-display text-[22px] text-teal-900 leading-none">
                Curalyta
              </div>
              <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-teal-700 mt-1">
                Clinical Intelligence Platform
              </div>
            </div>
          </div>

          <h2
            id="login-title"
            className="font-serif-display text-[28px] leading-tight tracking-tight text-ink"
          >
            Masuk sebagai <em className="italic text-coral">siapa</em> hari ini?
          </h2>
          <p className="text-sm text-ink-mute mt-2 max-w-md">
            Pilih peran Anda untuk memulai. Setiap peran memiliki dashboard dan kapabilitas yang berbeda.
          </p>
        </div>

        {/* Role cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map((role, idx) => {
            const Icon = role.icon
            return (
              <button
                key={role.id}
                onClick={() => login(role.id)}
                className="group relative text-left p-5 rounded-[14px] border border-line-soft bg-ivory-paper hover:border-teal-500 hover:shadow-medium transition-all duration-200 stagger-item"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.accent} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon size={20} className="text-teal-900" strokeWidth={1.75} />
                </div>
                <div className="font-serif-display text-xl text-ink mb-1">
                  {role.label}
                </div>
                <div className="text-[12.5px] text-ink-mute leading-relaxed min-h-[54px]">
                  {role.description}
                </div>
                <div className="dashed-divider mt-4 pt-3 flex items-center justify-between">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-ink-mute">
                    Demo · {role.sample}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-teal-700 group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer — privacy note */}
        <div className="px-8 py-4 bg-ivory border-t border-line-soft flex items-center gap-3">
          <Lock size={14} className="text-ink-mute shrink-0" />
          <p className="text-[11.5px] text-ink-mute leading-relaxed">
            Prototipe menggunakan pemilihan peran. Autentikasi email &amp; 2FA
            akan aktif pada peluncuran resmi, sesuai <strong>UU PDP No. 27/2022</strong> dan
            <strong> Permenkes No. 20/2019</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
