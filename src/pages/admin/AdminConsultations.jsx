import PageHeader from '../../components/PageHeader'
import { Card, Chip, Stat } from '../../components/UI'
import { Activity, Clock, AlertTriangle, Sparkles } from 'lucide-react'

const LIVE = [
  { id: 'cs-901', patient: 'Siti Hartini', doctor: 'dr. Ayu Pradipta', duration: '00:14:22', aiAlerts: 2, mode: 'online' },
  { id: 'cs-902', patient: 'Nina Amalia', doctor: 'dr. Lestari Wahyuni', duration: '00:06:41', aiAlerts: 0, mode: 'online' },
  { id: 'cs-903', patient: 'Tomi Handoko', doctor: 'dr. Bima Arsa', duration: '00:22:18', aiAlerts: 1, mode: 'online' },
  { id: 'cs-904', patient: 'Linda Yulianti', doctor: 'dr. Maya Kusuma', duration: '00:03:09', aiAlerts: 0, mode: 'offline' },
]

export default function AdminConsultations() {
  return (
    <>
      <PageHeader
        eyebrow="Real-time"
        title="Monitoring"
        titleAccent="Konsultasi"
        subtitle="Konsultasi yang sedang berjalan di platform. Admin tidak membaca isi chat — hanya metadata dan sinyal AI agregat."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Konsultasi Aktif" value={LIVE.length} icon={Activity} accent="teal" />
        <Stat label="AI Red Flags" value={LIVE.reduce((a, b) => a + b.aiAlerts, 0)} icon={AlertTriangle} accent="coral" />
        <Stat label="Rata-rata Durasi" value="11:32" icon={Clock} accent="sage" />
        <Stat label="AI Interventions" value={47} delta="+8 dibanding kemarin" icon={Sparkles} accent="sand" />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-coral">Live</span>
          <span className="text-[12px] text-ink-mute ml-2">· Data di-refresh tiap 3 detik</span>
        </div>
        <div className="divide-y divide-line-soft">
          {LIVE.map((l) => (
            <div key={l.id} className="py-3.5 first:pt-0 last:pb-0 grid grid-cols-12 items-center gap-3 text-[13px]">
              <div className="col-span-1 font-mono text-[11px] text-ink-mute">{l.id}</div>
              <div className="col-span-3">
                <div className="font-medium">{l.patient}</div>
                <div className="text-[11px] text-ink-mute">ditangani</div>
              </div>
              <div className="col-span-3 text-ink-soft">{l.doctor}</div>
              <div className="col-span-2 font-mono text-[12px] flex items-center gap-1.5">
                <Clock size={10} /> {l.duration}
              </div>
              <div className="col-span-2">
                {l.aiAlerts > 0 ? (
                  <Chip variant="urgent" icon={AlertTriangle}>{l.aiAlerts} AI alert</Chip>
                ) : (
                  <Chip variant="verified">Normal</Chip>
                )}
              </div>
              <div className="col-span-1 text-right">
                <Chip variant={l.mode === 'online' ? 'online' : 'offline'}>{l.mode}</Chip>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
