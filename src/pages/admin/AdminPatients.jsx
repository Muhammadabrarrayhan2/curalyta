import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { Search, Download } from 'lucide-react'
import { useState } from 'react'

const PATIENTS = [
  { id: 'pt-001', name: 'Raka Wijaya', initials: 'RW', age: 29, gender: 'L', location: 'Jakarta Selatan', joined: '2026-02-14', consultations: 4, status: 'active' },
  { id: 'pt-002', name: 'Siti Hartini', initials: 'SH', age: 58, gender: 'P', location: 'Jakarta Pusat', joined: '2025-11-02', consultations: 12, status: 'active' },
  { id: 'pt-003', name: 'Bambang Sutrisno', initials: 'BS', age: 64, gender: 'L', location: 'Tangerang', joined: '2025-08-19', consultations: 26, status: 'active' },
  { id: 'pt-004', name: 'Dewi Anggraeni', initials: 'DA', age: 34, gender: 'P', location: 'Bekasi', joined: '2026-01-05', consultations: 3, status: 'active' },
  { id: 'pt-005', name: 'Eko Pratama', initials: 'EP', age: 41, gender: 'L', location: 'Depok', joined: '2026-03-22', consultations: 1, status: 'active' },
  { id: 'pt-006', name: 'Murti Suryani', initials: 'MS', age: 52, gender: 'P', location: 'Bogor', joined: '2025-06-14', consultations: 18, status: 'active' },
  { id: 'pt-007', name: 'Arif Ramli', initials: 'AR', age: 38, gender: 'L', location: 'Jakarta Utara', joined: '2025-12-01', consultations: 5, status: 'inactive' },
]

export default function AdminPatients() {
  const [q, setQ] = useState('')
  const filtered = PATIENTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHeader
        eyebrow="Direktori Internal"
        title="Data"
        titleAccent="Pasien"
        subtitle="Seluruh pasien terdaftar. Akses rincian pasien tercatat di audit trail sesuai UU PDP."
        actions={
          <button className="btn-ghost text-[12px] px-3 py-2">
            <Download size={12} /> Export CSV
          </button>
        }
      />

      <div className="flex gap-2 mb-5 bg-ivory-paper border border-line-soft rounded-[14px] p-1.5 shadow-soft">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={15} className="text-ink-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari pasien…"
            className="flex-1 bg-transparent outline-none text-[14px] py-2"
          />
        </div>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-ink-mute bg-ivory-deep/40">
            <div className="col-span-4">Pasien</div>
            <div className="col-span-3">Lokasi</div>
            <div className="col-span-2">Bergabung</div>
            <div className="col-span-2 text-right">Konsultasi</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {filtered.map((p) => (
            <div key={p.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-ivory transition-colors">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[12px] text-teal-900 font-medium">
                  {p.initials}
                </div>
                <div>
                  <div className="text-[13px] font-medium">{p.name}</div>
                  <div className="text-[11px] font-mono text-ink-mute">{p.age}{p.gender}</div>
                </div>
              </div>
              <div className="col-span-3 text-[12px] text-ink-mute">{p.location}</div>
              <div className="col-span-2 text-[11.5px] font-mono text-ink-mute">{p.joined}</div>
              <div className="col-span-2 text-right font-serif-display text-[15px]">{p.consultations}</div>
              <div className="col-span-1 text-right">
                <Chip variant={p.status === 'active' ? 'verified' : 'neutral'}>{p.status}</Chip>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
