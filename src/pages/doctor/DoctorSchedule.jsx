import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { DOCTOR_SCHEDULE } from '../../data/mockData'
import { Video, MapPin, Plus } from 'lucide-react'

export default function DoctorSchedule() {
  return (
    <>
      <PageHeader
        eyebrow="Pengaturan Jadwal"
        title="Jadwal"
        titleAccent="Praktik"
        subtitle="Atur hari kerja, slot waktu, dan mode konsultasi. Pasien hanya bisa memesan sesuai slot yang Anda buka."
        actions={
          <button className="btn-primary text-[12px] px-3 py-2">
            <Plus size={13} /> Tambah Slot
          </button>
        }
      />

      <div className="grid gap-3">
        {DOCTOR_SCHEDULE.map((day) => (
          <Card key={day.day} className="stagger-item">
            <div className="flex items-start justify-between gap-4">
              <div className="w-24 shrink-0">
                <div className="font-serif-display text-[19px]">{day.day}</div>
                <div className="text-[10.5px] font-mono text-ink-mute uppercase tracking-wider mt-1">
                  {day.slots.length} slot
                </div>
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                {day.slots.length === 0 ? (
                  <div className="text-[12px] text-ink-mute italic py-2">Tidak praktik</div>
                ) : (
                  day.slots.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-ivory border border-line-soft rounded-lg">
                      <div className="font-mono text-[12.5px] font-medium">{s.start} – {s.end}</div>
                      <Chip variant={s.mode === 'online' ? 'online' : 'offline'} icon={s.mode === 'online' ? Video : MapPin}>
                        {s.mode}
                      </Chip>
                    </div>
                  ))
                )}
              </div>
              <button className="btn-ghost text-[11px] px-2.5 py-1.5 shrink-0">Edit</button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
