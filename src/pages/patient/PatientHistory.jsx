import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider, EmptyState } from '../../components/UI'
import { CONSULTATION_HISTORY } from '../../data/mockData'
import { formatDate } from '../../lib/utils'
import { FileText, History, Download, Pill } from 'lucide-react'

export default function PatientHistory() {
  return (
    <>
      <PageHeader
        eyebrow="Arsip Medis"
        title="Riwayat"
        titleAccent="Konsultasi"
        subtitle="Semua konsultasi yang pernah Anda lakukan, tersimpan dan dapat diakses kapan saja."
      />

      <div className="space-y-3">
        {CONSULTATION_HISTORY.map((c, i) => (
          <Card key={c.id} className="stagger-item">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="font-serif-display text-[19px] leading-tight">{c.doctorName}</div>
                <div className="text-[11.5px] text-ink-mute font-mono uppercase tracking-wider mt-0.5">
                  {formatDate(c.date)} · {c.mode}
                </div>
              </div>
              <Chip variant="done">{c.status}</Chip>
            </div>
            <DashedDivider className="my-3" />
            <div className="grid md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <div className="eyebrow mb-1">Keluhan Utama</div>
                <div className="text-ink-soft">{c.chief}</div>
              </div>
              <div>
                <div className="eyebrow mb-1">Diagnosis</div>
                <div>{c.diagnosis}</div>
              </div>
              <div className="md:col-span-2">
                <div className="eyebrow mb-1">Rencana &amp; Edukasi</div>
                <div className="text-ink-soft">{c.plan}</div>
              </div>
              {c.followUpDate && (
                <div className="md:col-span-2 flex items-center gap-2 pt-3 border-t border-dashed border-line">
                  <div className="w-8 h-8 rounded-full bg-coral-soft flex items-center justify-center">
                    <History size={14} className="text-coral" />
                  </div>
                  <div className="text-[12.5px]">
                    <span className="text-ink-mute">Follow-up dijadwalkan:</span>{' '}
                    <strong>{formatDate(c.followUpDate)}</strong>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
