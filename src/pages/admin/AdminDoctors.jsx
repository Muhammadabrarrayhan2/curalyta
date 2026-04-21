import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { DOCTORS } from '../../data/mockData'
import { Search, Star, Download } from 'lucide-react'
import { useState } from 'react'
import { formatRupiah } from '../../lib/utils'

export default function AdminDoctors() {
  const [q, setQ] = useState('')
  const filtered = DOCTORS.filter(
    (d) => d.name.toLowerCase().includes(q.toLowerCase()) || d.specialty.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <PageHeader
        eyebrow="Direktori Internal"
        title="Data"
        titleAccent="Dokter"
        subtitle="Semua dokter yang terdaftar di Curalyta, termasuk status, rating, dan performa."
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
            placeholder="Cari nama atau spesialisasi…"
            className="flex-1 bg-transparent outline-none text-[14px] py-2"
          />
        </div>
      </div>

      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-ink-mute bg-ivory-deep/40">
            <div className="col-span-4">Dokter</div>
            <div className="col-span-2">Spesialis</div>
            <div className="col-span-2">Lokasi</div>
            <div className="col-span-1 text-right">Rating</div>
            <div className="col-span-2 text-right">Tarif</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {filtered.map((d) => (
            <div key={d.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-ivory transition-colors">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[12px] text-teal-900 font-medium">
                  {d.initials}
                </div>
                <div className="text-[13px] font-medium truncate">{d.name}</div>
              </div>
              <div className="col-span-2 text-[12px] text-teal-700 truncate">{d.specialty}</div>
              <div className="col-span-2 text-[12px] text-ink-mute truncate">{d.location}</div>
              <div className="col-span-1 text-right text-[12px] flex items-center justify-end gap-1">
                <Star size={10} className="text-amber-medical fill-amber-medical" /> {d.rating}
              </div>
              <div className="col-span-2 text-right text-[12px] font-mono">{formatRupiah(d.fee)}</div>
              <div className="col-span-1 text-right">
                <Chip variant="verified">Active</Chip>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
