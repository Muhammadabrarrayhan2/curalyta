import { Bell, LogOut, Stethoscope, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandMark from './BrandMark'

const ROLE_META = {
  patient: { label: 'Pasien', icon: User },
  doctor: { label: 'Dokter', icon: Stethoscope },
  admin: { label: 'Admin', icon: ShieldCheck },
}

export default function TopBar() {
  const { user, logout, login, openLogin } = useAuth()

  if (!user) return null
  const meta = ROLE_META[user.role]
  const Icon = meta?.icon

  const switchRole = (role) => {
    if (role === user.role) return
    login(role)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-ivory-paper/85 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-3.5 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <BrandMark size={32} />
          <div className="hidden sm:block">
            <div className="font-serif-display text-[19px] leading-none text-teal-900">
              Curalyta
            </div>
            <div className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-ink-mute mt-0.5">
              Clinical Intelligence
            </div>
          </div>
        </div>

        {/* Role switcher (demo convenience) */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-ivory-deep border border-line-soft rounded-full">
          {['patient', 'doctor', 'admin'].map((r) => {
            const M = ROLE_META[r]
            const RIcon = M.icon
            const active = user.role === r
            return (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all ${
                  active
                    ? 'bg-ivory-paper text-teal-900 shadow-soft'
                    : 'text-ink-mute hover:text-ink'
                }`}
                title={`Beralih ke ${M.label}`}
              >
                <RIcon size={13} strokeWidth={2} />
                {M.label}
              </button>
            )
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <button
            className="relative w-9 h-9 rounded-full bg-ivory-deep hover:bg-teal-100 transition-colors flex items-center justify-center"
            aria-label="Notifikasi"
          >
            <Bell size={15} strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-coral border-2 border-ivory-paper" />
          </button>

          <div className="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-ivory-paper border border-line-soft rounded-full">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-900 text-ivory flex items-center justify-center text-[11px] font-semibold">
              {user.initials}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[12.5px] font-medium">{user.name}</div>
              <div className="text-[10px] text-ink-mute flex items-center gap-1">
                {Icon && <Icon size={9} strokeWidth={2} />}
                {meta?.label}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-9 h-9 rounded-full hover:bg-ivory-deep transition-colors flex items-center justify-center text-ink-mute hover:text-rose-medical"
            title="Keluar"
          >
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  )
}
