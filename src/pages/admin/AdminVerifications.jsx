import { useState } from 'react'
import { X, Check, FileCheck, AlertTriangle, Download, ShieldCheck, Send } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider } from '../../components/UI'
import { DOCTOR_VERIFICATIONS } from '../../data/mockData'
import { classNames } from '../../lib/utils'

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState(DOCTOR_VERIFICATIONS)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = verifications.filter((v) => filter === 'all' || v.status === filter)

  const updateStatus = (id, status, note = '') => {
    setVerifications((vs) => vs.map((v) => (v.id === id ? { ...v, status, revisionNote: note || v.revisionNote } : v)))
    setSelected(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Trust & Safety"
        title="Verifikasi"
        titleAccent="Dokter"
        subtitle="Periksa STR, SIP, dan dokumen pendukung. Pastikan semua data valid sebelum menyetujui akun dokter."
      />

      <div className="flex gap-1 mb-5 p-1 bg-ivory-deep border border-line-soft rounded-full w-fit">
        {[
          { id: 'all', label: `Semua (${verifications.length})` },
          { id: 'pending', label: `Pending (${verifications.filter((v) => v.status === 'pending').length})` },
          { id: 'revision', label: `Revisi (${verifications.filter((v) => v.status === 'revision').length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={classNames(
              'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all',
              filter === t.id ? 'bg-ivory-paper text-teal-900 shadow-soft' : 'text-ink-mute hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((v) => (
          <Card key={v.id} className="stagger-item">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[16px] text-teal-900 font-medium shrink-0">
                {v.doctorName.split(' ')[1]?.[0] || '?'}{v.doctorName.split(' ')[2]?.[0] || ''}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="font-serif-display text-[18px] leading-tight">{v.doctorName}</div>
                    <div className="text-[12.5px] text-teal-700">{v.specialty} · {v.location}</div>
                  </div>
                  <Chip variant={v.status === 'pending' ? 'pending' : 'revision'}>{v.status}</Chip>
                </div>
                <DashedDivider className="my-3" />
                <div className="grid md:grid-cols-3 gap-4 text-[12.5px] mb-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-0.5">STR</div>
                    <div className="font-mono">{v.str}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-0.5">SIP</div>
                    <div className="font-mono">{v.sip}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-0.5">Afiliasi</div>
                    <div>{v.hospital}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  {v.documents.map((doc) => (
                    <Chip key={doc} variant="neutral" icon={FileCheck}>{doc}</Chip>
                  ))}
                </div>
                {v.revisionNote && (
                  <div className="bg-[#F7E8C8]/50 border border-[#6B4E0C]/20 rounded-lg p-3 mb-3 text-[12px] text-[#6B4E0C]">
                    <strong>Catatan revisi:</strong> {v.revisionNote}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setSelected(v)} className="btn-primary text-[12px] px-3 py-1.5">
                    Review Detail
                  </button>
                  <button onClick={() => updateStatus(v.id, 'verified')} className="btn-ghost text-[12px] px-3 py-1.5 text-teal-900 border-teal-500/40">
                    <Check size={12} /> Setujui
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-ivory-paper border border-line-soft rounded-[18px] shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ivory-deep hover:bg-line-soft flex items-center justify-center z-10"
            >
              <X size={16} />
            </button>
            <div className="p-7">
              <div className="eyebrow mb-2">Review Verifikasi</div>
              <h2 className="font-serif-display text-[26px] leading-tight mb-3">{selected.doctorName}</h2>
              <div className="flex items-center gap-2 mb-5">
                <Chip variant="pending">{selected.status}</Chip>
                <span className="text-[11px] text-ink-mute font-mono">Dikirim {selected.submittedAt}</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-ivory border border-line-soft rounded-lg p-4">
                  <div className="eyebrow mb-2">Dokumen Terunggah</div>
                  <div className="space-y-2">
                    {selected.documents.map((d) => (
                      <div key={d} className="flex items-center justify-between p-2 bg-ivory-paper rounded-md text-[12.5px]">
                        <div className="flex items-center gap-2">
                          <FileCheck size={13} className="text-teal-700" />
                          <span>{d}</span>
                        </div>
                        <button className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1">
                          <Download size={11} /> Lihat
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-teal-100/40 border border-teal-500/20 rounded-lg p-4 text-[12.5px] text-teal-900 flex items-start gap-2 leading-relaxed">
                  <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                  <div>
                    Pastikan STR valid melalui registrasi <strong>KKI (Konsil Kedokteran Indonesia)</strong> dan SIP sesuai area praktik. Data yang salah dapat berimplikasi hukum.
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selected.id, 'verified')}
                  className="btn-primary flex-1 justify-center"
                >
                  <Check size={14} /> Setujui &amp; Aktifkan
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'revision', 'Mohon periksa ulang nomor STR.')}
                  className="btn-ghost flex-1 justify-center"
                >
                  <Send size={14} /> Minta Revisi
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'rejected')}
                  className="btn-ghost justify-center text-rose-medical border-rose-medical/30 hover:bg-rose-soft/50 px-4"
                >
                  <X size={14} /> Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
