import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { Bell, Calendar, MessageSquare, Sparkles, Pill } from 'lucide-react'

const NOTIFS = [
  {
    id: 'n-1', type: 'reminder', icon: Calendar, color: 'coral',
    title: 'Konsultasi besok pukul 14:30', desc: 'dengan dr. Ayu Pradipta, Sp.PD — via online',
    time: '2 jam lalu', unread: true,
  },
  {
    id: 'n-2', type: 'chat', icon: MessageSquare, color: 'teal',
    title: 'Pesan baru dari dr. Ayu', desc: '"Baik. Apakah ada mual atau muntah?"',
    time: '5 jam lalu', unread: true,
  },
  {
    id: 'n-3', type: 'ai', icon: Sparkles, color: 'teal',
    title: 'Ringkasan dari AI Assistant', desc: 'Kontrol tekanan darah Anda berjalan baik. Edukasi baru tersedia.',
    time: '1 hari lalu', unread: false,
  },
  {
    id: 'n-4', type: 'rx', icon: Pill, color: 'sage',
    title: 'Resep baru tersedia', desc: 'Amlodipine 5mg — 30 hari. Klik untuk melihat.',
    time: '3 hari lalu', unread: false,
  },
]

const COLOR_BG = {
  coral: 'bg-coral-soft',
  teal: 'bg-teal-100',
  sage: 'bg-sage/30',
}
const COLOR_TXT = {
  coral: 'text-coral',
  teal: 'text-teal-900',
  sage: 'text-teal-700',
}

export default function PatientNotifications() {
  return (
    <>
      <PageHeader
        eyebrow="Pengingat"
        title="Notifikasi"
        subtitle="Pengingat jadwal, pesan dokter, update AI, dan info resep — semuanya di sini."
      />
      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          {NOTIFS.map((n) => {
            const Icon = n.icon
            return (
              <div
                key={n.id}
                className={`flex gap-4 p-5 transition-colors hover:bg-ivory ${n.unread ? 'bg-ivory-deep/40' : ''}`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl ${COLOR_BG[n.color]} flex items-center justify-center`}>
                  <Icon size={15} strokeWidth={1.75} className={COLOR_TXT[n.color]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-[14px] mb-0.5 flex items-center gap-2">
                      {n.title}
                      {n.unread && <span className="w-2 h-2 rounded-full bg-coral" />}
                    </div>
                    <div className="text-[11px] text-ink-mute font-mono whitespace-nowrap">{n.time}</div>
                  </div>
                  <div className="text-[13px] text-ink-mute">{n.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
