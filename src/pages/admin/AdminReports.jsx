import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, Stat, Chip } from '../../components/UI'
import { TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react'
import { formatRupiah } from '../../lib/utils'

const MONTHLY = [
  { m: 'Nov', v: 4820 },
  { m: 'Des', v: 5210 },
  { m: 'Jan', v: 6105 },
  { m: 'Feb', v: 6734 },
  { m: 'Mar', v: 7412 },
  { m: 'Apr', v: 8190 },
]

const TOP_DOCTORS = [
  { name: 'dr. Ayu Pradipta, Sp.PD', count: 142, rating: 4.9 },
  { name: 'dr. Ratna Widyastuti, Sp.OG', count: 128, rating: 4.9 },
  { name: 'dr. Hendra Sukarya, Sp.JP', count: 118, rating: 4.8 },
  { name: 'dr. Lestari Wahyuni, Sp.A', count: 104, rating: 4.9 },
  { name: 'dr. Bima Arsa, Sp.KJ', count: 89, rating: 4.9 },
]

const TOP_SPEC = [
  { name: 'Penyakit Dalam', v: 1842 },
  { name: 'Anak', v: 1456 },
  { name: 'Umum', v: 1203 },
  { name: 'Kandungan', v: 987 },
  { name: 'Psikiatri', v: 654 },
]

export default function AdminReports() {
  const max = Math.max(...MONTHLY.map((m) => m.v))
  const maxSpec = Math.max(...TOP_SPEC.map((s) => s.v))

  return (
    <>
      <PageHeader
        eyebrow="Analitik"
        title="Laporan"
        titleAccent="& Analitik"
        subtitle="Metrik bisnis dan operasional Curalyta — performa dokter, pertumbuhan, dan tren spesialisasi."
        actions={
          <button className="btn-ghost text-[12px] px-3 py-2">
            <Download size={12} /> Export Laporan
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue MTD" value={formatRupiah(487500000)} delta="+18.4%" icon={DollarSign} accent="teal" />
        <Stat label="Konsultasi MTD" value="3,248" delta="+22%" icon={Activity} accent="coral" />
        <Stat label="Pasien Baru" value="412" delta="+9%" icon={Users} accent="sage" />
        <Stat label="Retensi 30-hari" value="68%" delta="+3.2%" icon={TrendingUp} accent="sand" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Monthly chart */}
        <Card>
          <CardHeader title="Pertumbuhan konsultasi" meta="6 bulan terakhir" action={<Chip variant="verified" icon={TrendingUp}>+69.9%</Chip>} />
          <div className="pt-4 flex items-end gap-3 h-[200px]">
            {MONTHLY.map((m) => {
              const h = (m.v / max) * 100
              return (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end h-full">
                    <div className="w-full rounded-t-md bg-gradient-to-t from-teal-900 to-teal-500 relative group" style={{ height: `${h}%` }}>
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-ivory text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {m.v.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="text-[10.5px] font-mono text-ink-mute">{m.m}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top specialties */}
        <Card>
          <CardHeader title="Spesialisasi terpopuler" meta="30 hari" />
          <div className="space-y-3">
            {TOP_SPEC.map((s, i) => (
              <div key={s.name}>
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span>{s.name}</span>
                  <span className="font-mono text-ink-mute">{s.v.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full h-1.5 bg-ivory-deep rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-900 to-coral rounded-full"
                    style={{ width: `${(s.v / maxSpec) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top doctors */}
        <Card className="md:col-span-2">
          <CardHeader title="Dokter paling aktif" meta="30 hari terakhir" />
          <div className="divide-y divide-line-soft">
            {TOP_DOCTORS.map((d, i) => (
              <div key={d.name} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-ivory-deep flex items-center justify-center font-serif-display text-[13px] text-teal-900">
                  {i + 1}
                </div>
                <div className="flex-1 font-medium text-[13.5px]">{d.name}</div>
                <div className="text-[12px] text-ink-mute font-mono">{d.count} konsultasi</div>
                <Chip variant="verified">★ {d.rating}</Chip>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
