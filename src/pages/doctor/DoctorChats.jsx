import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { DOCTOR_PATIENTS } from '../../data/mockData'
import { MessageSquare, AlertTriangle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DoctorChats() {
  return (
    <>
      <PageHeader
        eyebrow="Komunikasi"
        title="Chat"
        titleAccent="Pasien"
        subtitle="Percakapan aktif dengan semua pasien Anda. Klik salah satu untuk masuk ke ruang konsultasi dengan AI panel."
      />

      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          {DOCTOR_PATIENTS.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              to="/doctor/consult"
              className="flex items-center gap-4 px-5 py-4 hover:bg-ivory transition-colors stagger-item"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[13px] text-teal-900 font-medium">
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-[13.5px] font-medium">{p.name}</div>
                  {p.hasRedFlag && <Chip variant="urgent" icon={AlertTriangle}>Urgent</Chip>}
                </div>
                <div className="text-[12px] text-ink-mute truncate italic">"{p.chief}"</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-mono text-ink-mute flex items-center gap-1 justify-end mb-1">
                  <Clock size={10} /> {p.lastInteraction}
                </div>
                <MessageSquare size={14} className="text-teal-700 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}
