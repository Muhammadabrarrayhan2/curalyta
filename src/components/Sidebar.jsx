import { NavLink } from 'react-router-dom'
import {
  Home,
  Search,
  CalendarDays,
  MessageSquare,
  History,
  FileText,
  User,
  Bell,
  Users,
  ClipboardList,
  ListChecks,
  Settings2,
  ShieldCheck,
  LayoutDashboard,
  BadgeCheck,
  UserCog,
  Stethoscope,
  Activity,
  BarChart3,
  Lock,
  Sliders,
} from 'lucide-react'
import { classNames } from '../lib/utils'

const MENUS = {
  patient: [
    { section: 'Utama' },
    { to: '/patient', label: 'Beranda', icon: Home, end: true },
    { to: '/patient/doctors', label: 'Cari Dokter', icon: Search },
    { to: '/patient/bookings', label: 'Jadwal Konsultasi', icon: CalendarDays, badge: 1 },
    { to: '/patient/chats', label: 'Chat Saya', icon: MessageSquare, badge: 2 },
    { section: 'Catatan' },
    { to: '/patient/history', label: 'Riwayat Konsultasi', icon: History },
    { to: '/patient/records', label: 'Resep & Catatan', icon: FileText },
    { section: 'Akun' },
    { to: '/patient/profile', label: 'Profil', icon: User },
    { to: '/patient/notifications', label: 'Notifikasi', icon: Bell },
  ],
  doctor: [
    { section: 'Utama' },
    { to: '/doctor', label: 'Beranda', icon: LayoutDashboard, end: true },
    { to: '/doctor/todo', label: 'To-Do List', icon: ListChecks, badge: 5 },
    { to: '/doctor/bookings', label: 'Booking Masuk', icon: CalendarDays, badge: 3 },
    { to: '/doctor/chats', label: 'Chat Pasien', icon: MessageSquare, badge: 2 },
    { section: 'Klinis' },
    { to: '/doctor/patients', label: 'Daftar Pasien', icon: Users },
    { to: '/doctor/consult', label: 'Konsultasi', icon: Stethoscope },
    { to: '/doctor/notes', label: 'Catatan Konsultasi', icon: ClipboardList },
    { section: 'Jadwal' },
    { to: '/doctor/schedule', label: 'Jadwal Praktik', icon: CalendarDays },
    { section: 'Akun' },
    { to: '/doctor/profile', label: 'Profil Dokter', icon: BadgeCheck },
  ],
  admin: [
    { section: 'Overview' },
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { section: 'Verifikasi & User' },
    { to: '/admin/verifications', label: 'Verifikasi Dokter', icon: BadgeCheck, badge: 24 },
    { to: '/admin/doctors', label: 'Data Dokter', icon: Stethoscope },
    { to: '/admin/patients', label: 'Data Pasien', icon: Users },
    { to: '/admin/users', label: 'Manajemen User', icon: UserCog },
    { section: 'Operasional' },
    { to: '/admin/services', label: 'Spesialis & Layanan', icon: Sliders },
    { to: '/admin/bookings', label: 'Booking & Jadwal', icon: CalendarDays },
    { to: '/admin/consultations', label: 'Monitoring Konsultasi', icon: Activity },
    { section: 'Governance' },
    { to: '/admin/reports', label: 'Laporan & Analitik', icon: BarChart3 },
    { to: '/admin/security', label: 'Moderasi & Keamanan', icon: Lock },
    { to: '/admin/settings', label: 'Pengaturan Sistem', icon: Settings2 },
  ],
}

export default function Sidebar({ role }) {
  const items = MENUS[role] || []

  return (
    <aside className="hidden md:flex flex-col sticky top-[61px] h-[calc(100vh-61px)] w-[240px] border-r border-line-soft px-3 py-6 overflow-y-auto shrink-0">
      {items.map((item, idx) => {
        if (item.section) {
          return (
            <div
              key={`sec-${idx}`}
              className={classNames(
                'px-3 pb-2 text-[10px] font-medium font-mono uppercase tracking-[0.14em] text-ink-mute',
                idx > 0 && 'pt-5'
              )}
            >
              {item.section}
            </div>
          )
        }

        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] mb-0.5 transition-all group',
                isActive
                  ? 'bg-teal-900 text-ivory font-medium shadow-soft'
                  : 'text-ink-soft hover:bg-ivory-deep'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={15}
                  strokeWidth={1.75}
                  className={isActive ? 'text-ivory' : 'text-ink-mute group-hover:text-ink'}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-coral text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        )
      })}

      {/* Footer */}
      <div className="mt-auto pt-6 px-2">
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-900 to-teal-700 text-ivory">
          <div className="text-[10px] font-mono uppercase tracking-wider opacity-70 mb-1">
            Safety Note
          </div>
          <div className="text-[11.5px] leading-relaxed opacity-90">
            AI di Curalyta adalah <em className="font-serif-display italic">decision support</em> —
            bukan pengganti dokter. Keputusan medis final tetap di tangan klinisi.
          </div>
        </div>
      </div>
    </aside>
  )
}
