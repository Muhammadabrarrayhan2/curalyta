import { Link } from 'react-router-dom'
import {
  Search,
  CalendarDays,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  Video,
  MapPin,
  Bell,
  Heart,
  Activity,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, Chip, DashedDivider } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import { UPCOMING_BOOKINGS, CONSULTATION_HISTORY, DOCTORS } from '../../data/mockData'
import { formatDate, formatRupiah } from '../../lib/utils'

const QUICK_ACTIONS = [
  { to: '/patient/doctors', icon: Search, label: 'Cari Dokter', desc: 'Telusuri spesialis' },
  { to: '/patient/bookings', icon: CalendarDays, label: 'Booking', desc: 'Jadwal konsultasi' },
  { to: '/patient/chats', icon: MessageSquare, label: 'Chat', desc: 'Pesan dokter' },
  { to: '/patient/records', icon: FileText, label: 'Resep', desc: 'Catatan medis' },
]

export default function PatientHome() {
  const { user } = useAuth()
  const upcoming = UPCOMING_BOOKINGS[0]
  const recent = CONSULTATION_HISTORY.slice(0, 2)
  const recommended = DOCTORS.slice(0, 3)

  const hour = new Date().getHours()
  const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'

  return (
    <>
      <PageHeader
        eyebrow={`${greet}, ${user.name.split(' ')[0]}`}
        title="Bagaimana perasaan Anda"
        titleAccent="hari ini?"
        subtitle="Semua yang Anda butuhkan untuk konsultasi, riwayat medis, dan pengingat kesehatan — dalam satu tempat."
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {QUICK_ACTIONS.map((a, i) => {
          const Icon = a.icon
          return (
            <Link
              key={a.to}
              to={a.to}
              className="stagger-item group bg-ivory-paper border border-line-soft rounded-[14px] p-5 hover:border-teal-500 hover:shadow-medium transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-ivory-deep group-hover:bg-teal-100 flex items-center justify-center mb-3 transition-colors">
                <Icon size={17} strokeWidth={1.75} className="text-teal-900" />
              </div>
              <div className="font-serif-display text-[17px] mb-0.5">{a.label}</div>
              <div className="text-[12px] text-ink-mute">{a.desc}</div>
            </Link>
          )
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Upcoming */}
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Konsultasi mendatang"
              meta="Jadwal terdekat"
              action={
                <Link to="/patient/bookings" className="text-[12px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1">
                  Semua jadwal <ArrowRight size={12} />
                </Link>
              }
            />
            {upcoming ? (
              <div className="flex items-start gap-4 p-4 bg-ivory rounded-xl border border-line-soft">
                <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[22px] text-teal-900 font-medium">
                  {DOCTORS.find((d) => d.id === upcoming.doctorId)?.initials || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <div className="font-serif-display text-[18px] leading-tight">{upcoming.doctorName}</div>
                      <div className="text-[12.5px] text-teal-700">{upcoming.specialty}</div>
                    </div>
                    <Chip variant="new" icon={upcoming.mode === 'online' ? Video : MapPin}>
                      {upcoming.mode}
                    </Chip>
                  </div>
                  <DashedDivider className="my-3" />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-1">Tanggal</div>
                      <div className="text-[13px] font-medium">{formatDate(upcoming.date)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-1">Waktu</div>
                      <div className="text-[13px] font-medium flex items-center gap-1"><Clock size={12} /> {upcoming.time}</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-mute mb-1">Keluhan</div>
                  <div className="text-[13px] text-ink-soft italic">"{upcoming.chief}"</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-ink-mute text-sm">Tidak ada jadwal mendatang.</div>
            )}
          </Card>

          {/* AI Health Tip */}
          <Card className="bg-gradient-to-br from-teal-900 to-teal-700 text-ivory border-teal-900">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-ivory/10 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-coral-soft" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-coral-soft mb-1.5">
                  AI Patient Education
                </div>
                <div className="font-serif-display text-[20px] leading-snug mb-2">
                  Berdasarkan konsultasi terakhir Anda
                </div>
                <p className="text-[13.5px] text-ivory/80 leading-relaxed">
                  Kontrol hipertensi rutin Anda berjalan baik. Ingat: hindari garam berlebih,
                  rutin cek tekanan darah 2x/minggu, dan lanjutkan amlodipine 5mg. Kontrol
                  berikutnya dijadwalkan <strong className="text-ivory">18 Mei 2026</strong>.
                </p>
                <div className="mt-4 pt-4 border-t border-ivory/15 text-[10.5px] text-ivory/60 leading-relaxed">
                  Edukasi ini dibuat otomatis oleh AI berdasarkan catatan dokter. Bila ada keluhan baru, konsultasikan langsung.
                </div>
              </div>
            </div>
          </Card>

          {/* Recent history */}
          <Card>
            <CardHeader
              title="Riwayat konsultasi"
              meta="2 terakhir"
              action={
                <Link to="/patient/history" className="text-[12px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1">
                  Semua riwayat <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="divide-y divide-line-soft">
              {recent.map((c) => (
                <div key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <div className="font-medium text-[14px]">{c.doctorName}</div>
                      <div className="text-[11.5px] text-ink-mute">{formatDate(c.date)} · {c.chief}</div>
                    </div>
                    <Chip variant="done">{c.status}</Chip>
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-1.5">
                    <span className="text-ink-mute">Diagnosis:</span> {c.diagnosis}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Health profile */}
          <Card>
            <CardHeader title="Profil kesehatan" meta="Ringkasan" />
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-ink-mute">Usia</span>
                <span className="font-medium">{user.age} tahun</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Gol. Darah</span>
                <span className="font-medium">{user.bloodType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Alergi</span>
                <span className="font-medium text-rose-medical">{user.allergies?.join(', ') || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Kondisi kronis</span>
                <span className="font-medium">{user.chronicConditions?.length ? user.chronicConditions.join(', ') : '—'}</span>
              </div>
            </div>
            <DashedDivider />
            <Link to="/patient/profile" className="text-[12px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1">
              Edit profil <ArrowRight size={12} />
            </Link>
          </Card>

          {/* Recommended */}
          <Card>
            <CardHeader title="Dokter direkomendasikan" meta="Untuk Anda" />
            <div className="space-y-3">
              {recommended.map((d) => (
                <Link
                  key={d.id}
                  to="/patient/doctors"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ivory-deep transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[15px] text-teal-900 font-medium shrink-0">
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{d.name}</div>
                    <div className="text-[11px] text-ink-mute">{d.specialty} · {formatRupiah(d.fee)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Reminder */}
          <div className="bg-coral-soft/50 border border-coral/20 rounded-[14px] p-4">
            <div className="flex items-start gap-3">
              <Bell size={16} className="text-coral shrink-0 mt-0.5" />
              <div className="text-[12.5px] text-[#6E2929] leading-relaxed">
                <strong>Pengingat:</strong> kontrol rutin ke dr. Ayu Pradipta pada 18 Mei 2026. Sistem akan mengirim reminder 3 hari sebelumnya.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
