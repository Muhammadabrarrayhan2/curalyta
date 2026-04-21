import PageHeader from '../../components/PageHeader'
import { Card, Chip, Stat } from '../../components/UI'
import { CalendarDays, Clock, Video, MapPin, XCircle, CheckCircle2 } from 'lucide-react'

const BOOKINGS = [
  { id: 'bk-221', patient: 'Raka Wijaya', doctor: 'dr. Ayu Pradipta', time: '14:30', mode: 'online', status: 'confirmed' },
  { id: 'bk-222', patient: 'Siti Hartini', doctor: 'dr. Ayu Pradipta', time: '14:45', mode: 'online', status: 'in_progress' },
  { id: 'bk-223', patient: 'Bambang Sutrisno', doctor: 'dr. Ayu Pradipta', time: '15:15', mode: 'online', status: 'confirmed' },
  { id: 'bk-224', patient: 'Dewi Anggraeni', doctor: 'dr. Bima Arsa', time: '19:00', mode: 'online', status: 'confirmed' },
  { id: 'bk-225', patient: 'Linda Yulianti', doctor: 'dr. Maya Kusuma', time: '11:00', mode: 'offline', status: 'completed' },
  { id: 'bk-226', patient: 'Tomi Handoko', doctor: 'dr. Hendra Sukarya', time: '09:00', mode: 'offline', status: 'cancelled' },
  { id: 'bk-227', patient: 'Nina Amalia', doctor: 'dr. Lestari Wahyuni', time: '16:00', mode: 'online', status: 'completed' },
]

export default function AdminBookings() {
  return (
    <>
      <PageHeader
        eyebrow="Operasional"
        title="Booking"
        titleAccent="& Jadwal"
        subtitle="Monitoring seluruh booking yang berlangsung hari ini di platform — real-time."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Hari Ini" value={BOOKINGS.length} icon={CalendarDays} accent="teal" />
        <Stat label="Sedang Berlangsung" value={BOOKINGS.filter((b) => b.status === 'in_progress').length} icon={Clock} accent="coral" />
        <Stat label="Selesai" value={BOOKINGS.filter((b) => b.status === 'completed').length} icon={CheckCircle2} accent="sage" />
        <Stat label="Dibatalkan" value={BOOKINGS.filter((b) => b.status === 'cancelled').length} icon={XCircle} accent="sand" />
      </div>

      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-ink-mute bg-ivory-deep/40">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Pasien</div>
            <div className="col-span-3">Dokter</div>
            <div className="col-span-1">Jam</div>
            <div className="col-span-2">Mode</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {BOOKINGS.map((b) => (
            <div key={b.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-ivory transition-colors text-[12.5px]">
              <div className="col-span-1 font-mono text-ink-mute text-[11px]">{b.id}</div>
              <div className="col-span-3 truncate">{b.patient}</div>
              <div className="col-span-3 truncate text-ink-soft">{b.doctor}</div>
              <div className="col-span-1 font-mono">{b.time}</div>
              <div className="col-span-2">
                <Chip variant={b.mode === 'online' ? 'online' : 'offline'} icon={b.mode === 'online' ? Video : MapPin}>
                  {b.mode}
                </Chip>
              </div>
              <div className="col-span-2 text-right">
                <Chip variant={
                  b.status === 'in_progress' ? 'new' :
                  b.status === 'completed' ? 'done' :
                  b.status === 'cancelled' ? 'urgent' :
                  'verified'
                }>
                  {b.status}
                </Chip>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
