import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider } from '../../components/UI'
import { SPECIALTIES, DOCTORS } from '../../data/mockData'
import { Plus, Pencil, Power } from 'lucide-react'

export default function AdminServices() {
  const withCount = SPECIALTIES.filter((s) => s.id !== 'all').map((s) => ({
    ...s,
    count: DOCTORS.filter((d) => d.specialtyId === s.id).length,
  }))

  return (
    <>
      <PageHeader
        eyebrow="Katalog"
        title="Spesialis"
        titleAccent="& Layanan"
        subtitle="Kategori spesialisasi dan jenis layanan yang ditawarkan di platform."
        actions={
          <button className="btn-primary text-[12px] px-3 py-2">
            <Plus size={13} /> Tambah Spesialis
          </button>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {withCount.map((s, i) => (
          <Card key={s.id} className="stagger-item">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-ivory-deep flex items-center justify-center font-serif-display text-[20px] text-teal-900">
                {s.icon}
              </div>
              <Chip variant="verified">Aktif</Chip>
            </div>
            <div className="font-serif-display text-[19px] mb-1">{s.name}</div>
            <div className="text-[11.5px] text-ink-mute font-mono uppercase tracking-wider">
              {s.count} dokter terdaftar
            </div>
            <DashedDivider />
            <div className="flex gap-2">
              <button className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1">
                <Pencil size={10} /> Edit
              </button>
              <button className="text-[11px] text-ink-mute hover:text-rose-medical flex items-center gap-1 ml-auto">
                <Power size={10} /> Nonaktifkan
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
