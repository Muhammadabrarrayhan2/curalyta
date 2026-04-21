import { Link } from 'react-router-dom'
import {
  Users,
  Stethoscope,
  BadgeCheck,
  Activity,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, Stat, Chip, DashedDivider } from '../../components/UI'
import { ADMIN_STATS, DOCTOR_VERIFICATIONS } from '../../data/mockData'
import { formatRupiah } from '../../lib/utils'

export default function AdminHome() {
  const pending = DOCTOR_VERIFICATIONS.filter((v) => v.status === 'pending').slice(0, 3)

  // Weekly activity bars
  const weekData = [
    { d: 'Sen', v: 178 },
    { d: 'Sel', v: 204 },
    { d: 'Rab', v: 189 },
    { d: 'Kam', v: 234 },
    { d: 'Jum', v: 215 },
    { d: 'Sab', v: 156 },
    { d: 'Min', v: 98 },
  ]
  const max = Math.max(...weekData.map((w) => w.v))

  return (
    <>
      <PageHeader
        eyebrow="Platform Operations"
        title="Dashboard"
        titleAccent="Admin"
        subtitle="Pantauan real-time verifikasi dokter, konsultasi aktif, dan kesehatan operasional platform."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Dokter" value={ADMIN_STATS.totalDoctors.toLocaleString('id-ID')} delta="+18 minggu ini" icon={Stethoscope} accent="teal" />
        <Stat label="Terverifikasi" value={ADMIN_STATS.verifiedDoctors.toLocaleString('id-ID')} delta="95.3%" icon={BadgeCheck} accent="sage" />
        <Stat label="Total Pasien" value={ADMIN_STATS.totalPatients.toLocaleString('id-ID')} delta="+324 minggu ini" icon={Users} accent="sand" />
        <Stat label="Booking Hari Ini" value={ADMIN_STATS.bookingsToday} delta="+12% vs kemarin" icon={CalendarDays} accent="coral" />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          {/* Activity chart */}
          <Card>
            <CardHeader
              title="Aktivitas konsultasi · 7 hari"
              meta="Total booking per hari"
              action={
                <Chip variant="verified" icon={TrendingUp}>+12.4%</Chip>
              }
            />
            <div className="pt-4 flex items-end gap-2 h-[180px]">
              {weekData.map((w) => {
                const h = (w.v / max) * 100
                return (
                  <div key={w.d} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end h-full">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-teal-900 to-teal-500 relative group cursor-pointer hover:from-coral hover:to-coral-soft transition-colors"
                        style={{ height: `${h}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-ink text-ivory text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {w.v}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10.5px] font-mono text-ink-mute">{w.d}</div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Pending verifications */}
          <Card>
            <CardHeader
              title="Verifikasi menunggu review"
              meta={`${ADMIN_STATS.pendingVerifications} pending`}
              action={
                <Link to="/admin/verifications" className="text-[12px] font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1">
                  Semua <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="divide-y divide-line-soft">
              {pending.map((v) => (
                <div key={v.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 stagger-item">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[13px] text-teal-900 font-medium shrink-0">
                    {v.doctorName.split(' ')[1]?.[0] || '?'}{v.doctorName.split(' ')[2]?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[13.5px] font-medium">{v.doctorName}</div>
                        <div className="text-[11.5px] text-teal-700">{v.specialty} · {v.location}</div>
                      </div>
                      <Chip variant={v.status === 'pending' ? 'pending' : 'revision'}>{v.status}</Chip>
                    </div>
                    <div className="mt-1.5 text-[10.5px] font-mono text-ink-mute">
                      Dikirim {v.submittedAt} · {v.documents.length} dokumen
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Kesehatan Sistem" meta="Real-time" />
            <div className="space-y-3 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-mute">Konsultasi aktif</span>
                <span className="font-medium">{ADMIN_STATS.activeConsultations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mute">Selesai hari ini</span>
                <span className="font-medium">{ADMIN_STATS.completedToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-mute">Pendapatan hari ini</span>
                <span className="font-medium">{formatRupiah(ADMIN_STATS.revenueToday)}</span>
              </div>
              <DashedDivider />
              <div className="flex items-center gap-2 text-teal-700">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Semua sistem berjalan normal
              </div>
            </div>
          </Card>

          <Card className="bg-ink text-ivory border-ink">
            <ShieldCheck size={18} className="text-coral mb-3" />
            <div className="font-serif-display text-[17px] mb-2">Audit &amp; Compliance</div>
            <div className="text-[12px] text-ivory/70 leading-relaxed mb-3">
              Semua akses rekam medis dicatat, termasuk aksi AI. Log dapat diekspor untuk audit internal atau permintaan regulator.
            </div>
            <Link to="/admin/security" className="text-[11.5px] text-coral font-medium flex items-center gap-1">
              Lihat audit log <ArrowRight size={11} />
            </Link>
          </Card>

          <div className="bg-rose-soft/60 border border-rose-medical/25 rounded-[14px] p-4 flex items-start gap-3">
            <AlertTriangle size={15} className="text-rose-medical shrink-0 mt-0.5" />
            <div className="text-[12px] text-[#6E2929] leading-relaxed">
              <strong>1 laporan moderasi</strong> menunggu review — pelanggaran konten chat.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
