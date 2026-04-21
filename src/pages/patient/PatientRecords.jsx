import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider } from '../../components/UI'
import { Pill, FileText, Download, ImageIcon, FlaskConical } from 'lucide-react'

const PRESCRIPTIONS = [
  {
    id: 'rx-091',
    date: '2026-04-18',
    doctor: 'dr. Ayu Pradipta, Sp.PD',
    drugs: [
      { name: 'Amlodipine 5mg', instruction: '1x1 tablet pagi setelah makan, 30 hari' },
    ],
    status: 'active',
  },
  {
    id: 'rx-082',
    date: '2026-03-22',
    doctor: 'dr. Lestari Wahyuni, Sp.A',
    drugs: [
      { name: 'Parasetamol 250mg/5ml', instruction: '3x sehari 1 sendok takar, bila demam' },
      { name: 'Vitamin C', instruction: '1x1 tablet/hari, 7 hari' },
    ],
    status: 'completed',
  },
]

const FILES = [
  { id: 'f-1', name: 'Hasil Lab Profil Lipid', type: 'lab', size: '240 KB', date: '2026-03-10' },
  { id: 'f-2', name: 'Foto Ruam Kulit', type: 'image', size: '1.2 MB', date: '2026-02-14' },
  { id: 'f-3', name: 'Hasil EKG', type: 'lab', size: '180 KB', date: '2026-01-28' },
]

export default function PatientRecords() {
  return (
    <>
      <PageHeader
        eyebrow="Rekam Medis"
        title="Resep"
        titleAccent="& Catatan"
        subtitle="Semua resep digital dan file medis yang telah Anda unggah atau terima."
      />

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="eyebrow mb-3">Resep Digital</div>
          <div className="space-y-3">
            {PRESCRIPTIONS.map((rx) => (
              <Card key={rx.id}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ivory-deep flex items-center justify-center">
                      <Pill size={15} className="text-teal-900" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="font-serif-display text-[16px] leading-tight">{rx.doctor}</div>
                      <div className="text-[11px] text-ink-mute font-mono uppercase tracking-wider">{rx.date}</div>
                    </div>
                  </div>
                  <Chip variant={rx.status === 'active' ? 'new' : 'done'}>{rx.status}</Chip>
                </div>
                <DashedDivider className="my-3" />
                <div className="space-y-2.5">
                  {rx.drugs.map((d, i) => (
                    <div key={i} className="text-[13px]">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-[12px] text-ink-mute">{d.instruction}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-ghost w-full justify-center mt-4 text-[12px] py-2">
                  <Download size={12} /> Unduh PDF bertanda tangan
                </button>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-3">File Medis</div>
          <Card>
            <div className="divide-y divide-line-soft">
              {FILES.map((f) => {
                const Icon = f.type === 'image' ? ImageIcon : FlaskConical
                return (
                  <div key={f.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ivory-deep flex items-center justify-center">
                      <Icon size={14} className="text-ink-soft" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{f.name}</div>
                      <div className="text-[11px] text-ink-mute font-mono">{f.date} · {f.size}</div>
                    </div>
                    <button className="w-9 h-9 rounded-full hover:bg-ivory-deep flex items-center justify-center">
                      <Download size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
            <DashedDivider />
            <button className="btn-primary w-full justify-center">
              <FileText size={13} /> Upload File Baru
            </button>
          </Card>
        </div>
      </div>
    </>
  )
}
