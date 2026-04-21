import { Link } from 'react-router-dom'
import {
  Users,
  MessageSquare,
  CalendarDays,
  ListChecks,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Video,
  MapPin,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, Stat, Chip, DashedDivider } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import { DOCTOR_PATIENTS } from '../../data/mockData'

export default function DoctorHome() {
  const { user } = useAuth()
  const todayQueue = DOCTOR_PATIENTS.filter((p) => p.status === 'waiting')
  const urgent = DOCTOR_PATIENTS.filter((p) => p.hasRedFlag)

  const hour = new Date().getHours()
  const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'

  return (
    <>
      <PageHeader
        eyebrow={`${greet}, ${user.name.split(',')[0]}`}
        title="Beranda"
        titleAccent="Klinis"
        subtitle="Ringkasan pasien hari ini, tugas yang tertunda, dan sinyal dari AI clinical support."
      />

      {/* Urgent banner if red flags exist */}
      {urgent.length > 0 && (
        <div className="mb-6 bg-rose-soft/60 border border-rose-medical/30 rounded-[14px] p-4 flex items-start gap-3 animate-slide-up">
          <div className="shrink-0 w-10 h-10 rounded-full bg-rose-medical flex items-center justify-center">
            <AlertTriangle size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-rose-medical mb-0.5 flex items-center gap-2">
              {urgent.length} pasien dengan red flag menunggu
              <Chip variant="ai">AI detect</Chip>
            </div>
            <div className="text-[12.5px] text-[#6E2929] leading-relaxed">
              AI mendeteksi gejala potensial berbahaya. Prioritaskan pemeriksaan mereka segera.
            </div>
          </div>
          <Link to="/doctor/consult" className="btn-coral btn-sm shrink-0 mt-0.5">
            Buka <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Pasien hari ini" value={todayQueue.length} delta="+2 dari kemarin" icon={Users} accent="teal" />
        <Stat label="Chat belum dibalas" value={2} icon={MessageSquare} accent="coral" />
        <Stat label="Konsultasi bulan ini" value={128} delta="+12%" icon={Activity} accent="sage" />
        <Stat label="Rating rata-rata" value={user.rating} icon={ShieldCheck} accent="sand" />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Patient queue */}
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Antrian pasien hari ini"
              meta={`${todayQueue.length} pasien`}
              action={
                <Link to="/doctor/consult" className="text-[12px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1">
                  Ruang konsultasi <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="divide-y divide-line-soft">
              {todayQueue.map((p) => (
                <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 stagger-item">
                  <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[14px] text-teal-900 font-medium">
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-[13.5px] flex items-center gap-2">
                          {p.name}
                          <span className="text-[11px] text-ink-mute font-mono">{p.age}{p.gender}</span>
                          {p.hasRedFlag && <Chip variant="urgent" icon={AlertTriangle}>Red flag</Chip>}
                        </div>
                        <div className="text-[12.5px] text-ink-mute mt-0.5 truncate max-w-md">
                          {p.chief}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono text-ink-mute">{p.bookingTime}</div>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {p.mode === 'online' ? <Video size={10} className="text-teal-700" /> : <MapPin size={10} className="text-teal-700" />}
                          <span className="text-[10px] text-teal-700 capitalize">{p.mode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Briefing */}
          <Card className="bg-gradient-to-br from-teal-900 to-teal-700 text-ivory border-teal-900">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-coral-soft" />
              <span className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-coral-soft">
                AI Clinical Briefing · Hari ini
              </span>
            </div>
            <div className="font-serif-display text-[22px] leading-snug mb-4">
              {urgent.length} kasus membutuhkan perhatian prioritas.
            </div>
            <div className="space-y-2.5 text-[13px] text-ivory/85">
              <div className="flex gap-2">
                <span className="text-coral-soft font-mono shrink-0">01</span>
                <span>Siti Hartini (58P) — sesak + nyeri dada. <em className="font-serif-display italic">Pertimbangkan evaluasi kardiovaskular segera.</em></span>
              </div>
              <div className="flex gap-2">
                <span className="text-coral-soft font-mono shrink-0">02</span>
                <span>Bambang Sutrisno (64L) — kontrol DM+HT. Hasil lab HbA1c baru tersedia, cek tren.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-coral-soft font-mono shrink-0">03</span>
                <span>Raka Wijaya (29L) — nyeri ulu hati 3 hari, AI memproyeksikan GERD/gastritis; data EKG belum ada.</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-ivory/15 text-[10.5px] text-ivory/60 leading-relaxed">
              Briefing ini saran otomatis. Evaluasi klinis dan keputusan tetap di tangan Anda.
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="To-do terdekat" meta="5 tugas" action={
              <Link to="/doctor/todo" className="text-[12px] font-medium text-teal-700 hover:text-teal-900">Semua →</Link>
            } />
            <div className="space-y-2.5">
              {[
                { t: 'Balas chat pasien Raka Wijaya', p: 'high' },
                { t: 'Review lab Bambang Sutrisno', p: 'high' },
                { t: 'Selesaikan catatan pasien #0982', p: 'med' },
                { t: 'Follow-up hipertensi pasien M.S.', p: 'med' },
                { t: 'Konfirmasi 3 booking baru', p: 'low' },
              ].map((task, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[12.5px]">
                  <input type="checkbox" className="mt-0.5 accent-teal-700" />
                  <div className="flex-1">{task.t}</div>
                  <Chip variant={task.p === 'high' ? 'urgent' : task.p === 'med' ? 'new' : 'neutral'}>{task.p}</Chip>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Verifikasi akun" meta="Status" />
            <div className="flex items-center gap-3">
              <Chip variant="verified" icon={ShieldCheck}>Terverifikasi</Chip>
            </div>
            <DashedDivider />
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-ink-mute">STR</span>
                <span className="font-mono text-[11px]">{user.strNumber?.slice(0, 18)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">SIP</span>
                <span className="font-mono text-[11px]">{user.sipNumber?.slice(0, 18)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-mute">Afiliasi</span>
                <span>{user.hospital}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
