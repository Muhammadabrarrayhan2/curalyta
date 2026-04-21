import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { DOCTOR_PATIENTS } from '../../data/mockData'
import { Search, AlertTriangle, FileText } from 'lucide-react'
import { useState } from 'react'

export default function DoctorPatients() {
  const [q, setQ] = useState('')
  const list = DOCTOR_PATIENTS.filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.chief.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <PageHeader
        eyebrow="Daftar Pasien"
        title="Semua"
        titleAccent="Pasien"
        subtitle="Pasien aktif dan riwayat — dengan ringkasan AI dan sinyal klinis untuk setiap orang."
      />

      <div className="flex gap-2 mb-5 bg-ivory-paper border border-line-soft rounded-[14px] p-1.5 shadow-soft">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={15} className="text-ink-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari pasien atau keluhan…"
            className="flex-1 bg-transparent outline-none text-[14px] py-2"
          />
        </div>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-ink-mute bg-ivory-deep/40">
            <div className="col-span-4">Pasien</div>
            <div className="col-span-4">Keluhan / Diagnosis</div>
            <div className="col-span-2">Terakhir</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {list.map((p) => (
            <div key={p.id} className="grid grid-cols-12 px-5 py-4 items-center hover:bg-ivory transition-colors stagger-item">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[13px] text-teal-900 font-medium">
                  {p.initials}
                </div>
                <div>
                  <div className="text-[13.5px] font-medium">{p.name}</div>
                  <div className="text-[11px] text-ink-mute font-mono">{p.age}{p.gender}</div>
                </div>
              </div>
              <div className="col-span-4 text-[12.5px] text-ink-soft pr-4">{p.chief}</div>
              <div className="col-span-2 text-[11.5px] text-ink-mute font-mono">{p.lastInteraction}</div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {p.hasRedFlag && <Chip variant="urgent" icon={AlertTriangle}>Urgent</Chip>}
                {p.hasNewLab && <Chip variant="new">Lab baru</Chip>}
                {!p.hasRedFlag && !p.hasNewLab && <Chip variant="neutral">{p.status}</Chip>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
