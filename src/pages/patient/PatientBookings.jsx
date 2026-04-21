import { Calendar, Clock, Video, MapPin, X, MessageSquare } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider, EmptyState } from '../../components/UI'
import { UPCOMING_BOOKINGS, CONSULTATION_HISTORY, DOCTORS } from '../../data/mockData'
import { formatDate } from '../../lib/utils'
import { useState } from 'react'
import { classNames } from '../../lib/utils'

export default function PatientBookings() {
  const [tab, setTab] = useState('upcoming')

  const upcoming = UPCOMING_BOOKINGS
  const past = CONSULTATION_HISTORY

  return (
    <>
      <PageHeader
        eyebrow="Jadwal"
        title="Konsultasi"
        titleAccent="Saya"
        subtitle="Semua booking aktif dan riwayat konsultasi Anda, terurut berdasarkan tanggal."
      />

      <div className="flex gap-1 mb-6 p-1 bg-ivory-deep border border-line-soft rounded-full w-fit">
        {[
          { id: 'upcoming', label: `Mendatang (${upcoming.length})` },
          { id: 'past', label: `Selesai (${past.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={classNames(
              'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all',
              tab === t.id ? 'bg-ivory-paper text-teal-900 shadow-soft' : 'text-ink-mute hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'upcoming' && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <Card>
              <EmptyState icon={Calendar} title="Belum ada booking" description="Cari dokter dan buat jadwal konsultasi pertama Anda." />
            </Card>
          ) : (
            upcoming.map((b) => {
              const doc = DOCTORS.find((d) => d.id === b.doctorId)
              return (
                <Card key={b.id} className="stagger-item">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[20px] text-teal-900 font-medium">
                      {doc?.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-serif-display text-[19px] leading-tight">{b.doctorName}</div>
                          <div className="text-[12.5px] text-teal-700">{b.specialty}</div>
                        </div>
                        <Chip variant="new">{b.status}</Chip>
                      </div>

                      <DashedDivider className="my-3" />

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-0.5">Tanggal</div>
                          <div className="text-[13px] font-medium flex items-center gap-1.5">
                            <Calendar size={11} /> {formatDate(b.date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-0.5">Waktu</div>
                          <div className="text-[13px] font-medium flex items-center gap-1.5">
                            <Clock size={11} /> {b.time}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-mute mb-0.5">Mode</div>
                          <div className="text-[13px] font-medium flex items-center gap-1.5 capitalize">
                            {b.mode === 'online' ? <Video size={11} /> : <MapPin size={11} />} {b.mode}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-mute mb-1">Keluhan</div>
                      <div className="text-[13px] text-ink-soft italic mb-4">"{b.chief}"</div>

                      <div className="flex gap-2">
                        <button className="btn-primary btn-sm">
                          <MessageSquare size={12} /> Buka Chat
                        </button>
                        <button className="btn-ghost text-[12px] px-3 py-1.5 text-rose-medical border-rose-medical/30 hover:bg-rose-soft/50">
                          <X size={12} /> Batalkan
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {tab === 'past' && (
        <div className="space-y-3">
          {past.map((c) => (
            <Card key={c.id} className="stagger-item">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="font-serif-display text-[18px] leading-tight">{c.doctorName}</div>
                  <div className="text-[11.5px] text-ink-mute font-mono uppercase tracking-wider mt-0.5">
                    {formatDate(c.date)} · {c.mode}
                  </div>
                </div>
                <Chip variant="done">{c.status}</Chip>
              </div>
              <DashedDivider className="my-3" />
              <div className="grid md:grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="eyebrow mb-1">Keluhan</div>
                  <div className="text-ink-soft">{c.chief}</div>
                </div>
                <div>
                  <div className="eyebrow mb-1">Diagnosis</div>
                  <div>{c.diagnosis}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="eyebrow mb-1">Rencana</div>
                  <div className="text-ink-soft">{c.plan}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
