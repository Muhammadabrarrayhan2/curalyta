import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider } from '../../components/UI'
import { DOCTOR_PATIENTS } from '../../data/mockData'
import { Check, X, Video, MapPin, Clock } from 'lucide-react'

export default function DoctorBookings() {
  const incoming = DOCTOR_PATIENTS.filter((p) => p.status === 'upcoming' || p.status === 'waiting')

  return (
    <>
      <PageHeader
        eyebrow="Incoming"
        title="Booking"
        titleAccent="Masuk"
        subtitle="Permintaan konsultasi dari pasien — terima, tolak, atau reschedule."
      />

      <div className="space-y-3">
        {incoming.map((p) => (
          <Card key={p.id} className="stagger-item">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[18px] text-teal-900 font-medium">
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="font-serif-display text-[18px] leading-tight">{p.name}</div>
                    <div className="text-[11.5px] font-mono text-ink-mute uppercase tracking-wider">
                      {p.age}{p.gender} · {p.bookingTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasRedFlag && <Chip variant="urgent">Red flag</Chip>}
                    <Chip variant={p.mode === 'online' ? 'online' : 'offline'} icon={p.mode === 'online' ? Video : MapPin}>
                      {p.mode}
                    </Chip>
                  </div>
                </div>
                <DashedDivider className="my-3" />
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-mute mb-1">Keluhan</div>
                <div className="text-[13px] text-ink-soft italic mb-4">"{p.chief}"</div>
                <div className="flex gap-2">
                  <button className="btn-primary text-[12px] px-3 py-1.5">
                    <Check size={12} /> Terima
                  </button>
                  <button className="btn-ghost text-[12px] px-3 py-1.5 text-rose-medical border-rose-medical/30">
                    <X size={12} /> Tolak
                  </button>
                  <button className="btn-ghost text-[12px] px-3 py-1.5">
                    <Clock size={12} /> Reschedule
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
