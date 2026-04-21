import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { Sparkles, Check, FileText } from 'lucide-react'

const DRAFTS = [
  {
    id: 'n-1',
    patient: 'Raka Wijaya',
    date: '2026-04-21',
    status: 'ai_draft',
    snippet: 'S: Pasien mengeluh nyeri ulu hati, mual, memburuk setelah makan berat 3 hari lalu…',
  },
  {
    id: 'n-2',
    patient: 'Dewi Anggraeni',
    date: '2026-04-20',
    status: 'approved',
    snippet: 'S: Sakit kepala berulang 2 minggu, episode durasi 1-2 jam, tanpa aura…',
  },
  {
    id: 'n-3',
    patient: 'Arif Ramli',
    date: '2026-04-19',
    status: 'incomplete',
    snippet: 'S: Nyeri punggung bawah pasca mengangkat beban berat kemarin…',
  },
]

export default function DoctorNotes() {
  return (
    <>
      <PageHeader
        eyebrow="Dokumentasi"
        title="Catatan"
        titleAccent="Konsultasi"
        subtitle="Draft SOAP yang dihasilkan AI, menunggu review Anda. Tidak ada catatan yang tersimpan ke rekam medis tanpa persetujuan Anda."
      />

      <div className="space-y-3">
        {DRAFTS.map((d) => (
          <Card key={d.id} className="stagger-item">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ivory-deep flex items-center justify-center">
                  <FileText size={15} className="text-teal-900" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-serif-display text-[17px] leading-tight">{d.patient}</div>
                  <div className="text-[11px] font-mono text-ink-mute uppercase tracking-wider">{d.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.status === 'ai_draft' && <Chip variant="ai">AI Draft</Chip>}
                {d.status === 'approved' && <Chip variant="verified" icon={Check}>Approved</Chip>}
                {d.status === 'incomplete' && <Chip variant="pending">Incomplete</Chip>}
              </div>
            </div>
            <div className="text-[13px] text-ink-soft italic leading-relaxed pl-[52px] mb-3">
              "{d.snippet}"
            </div>
            <div className="pl-[52px] flex gap-2">
              <button className="btn-primary text-[11px] px-3 py-1.5">Buka & Review</button>
              {d.status === 'ai_draft' && (
                <button className="btn-ghost text-[11px] px-3 py-1.5">
                  <Sparkles size={11} /> Regenerate
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
