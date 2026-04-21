import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, Chip, DashedDivider } from '../../components/UI'
import { Lock, ShieldCheck, AlertTriangle, Eye, UserX, Database } from 'lucide-react'

const AUDIT = [
  { time: '14:22:03', actor: 'dr. Ayu Pradipta', action: 'Mengakses rekam medis Raka Wijaya', severity: 'info' },
  { time: '14:18:47', actor: 'Satya Nugraha (Admin)', action: 'Menyetujui verifikasi dr. Alisa Ramadhani', severity: 'info' },
  { time: '14:12:10', actor: 'AI Engine', action: 'Menghasilkan red flag alert untuk pasien #pt-002', severity: 'ai' },
  { time: '13:58:22', actor: 'Sistem', action: '3x gagal login untuk akun dr. Tania Pranata — akun di-lock sementara', severity: 'warn' },
  { time: '13:40:11', actor: 'Raka Wijaya', action: 'Mengunduh resep digital #rx-091', severity: 'info' },
  { time: '13:25:09', actor: 'AI Engine', action: 'Draft catatan SOAP disimpan untuk pasien #pt-001', severity: 'ai' },
]

const REPORTS = [
  { id: 'rp-1', reporter: 'Pasien Dewi A.', subject: 'Chat dr. X', reason: 'Bahasa tidak profesional', status: 'open' },
]

export default function AdminSecurity() {
  return (
    <>
      <PageHeader
        eyebrow="Trust & Safety"
        title="Moderasi"
        titleAccent="& Keamanan"
        subtitle="Audit trail seluruh aksi sensitif di platform, laporan moderasi, dan kontrol keamanan akses."
      />

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <Card className="bg-ink text-ivory border-ink">
          <Database size={18} className="text-coral mb-3" />
          <div className="font-serif-display text-[18px] mb-1">PHI Access Log</div>
          <div className="text-[12px] text-ivory/70 leading-relaxed mb-3">
            Setiap akses rekam medis dicatat. Total <strong className="text-ivory">1.482 akses</strong> dalam 24 jam terakhir.
          </div>
          <div className="text-[11px] text-coral font-mono uppercase tracking-wider">UU PDP 27/2022 Compliant</div>
        </Card>

        <Card>
          <ShieldCheck size={18} className="text-teal-700 mb-3" />
          <div className="font-serif-display text-[18px] mb-1">Enkripsi Data</div>
          <div className="text-[12px] text-ink-mute leading-relaxed">
            TLS 1.3 untuk transit. AES-256 untuk data at rest. Chat medis E2E encrypted.
          </div>
        </Card>

        <Card>
          <Lock size={18} className="text-teal-700 mb-3" />
          <div className="font-serif-display text-[18px] mb-1">2FA Coverage</div>
          <div className="font-serif-display text-[28px] text-teal-900 mb-1">87%</div>
          <div className="text-[11.5px] text-ink-mute">Dokter &amp; admin dengan 2FA aktif.</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Audit log */}
        <div className="md:col-span-2">
          <Card padding={false}>
            <div className="p-5 border-b border-line-soft">
              <CardHeader title="Audit Log" meta="Real-time · 24 jam terakhir" />
            </div>
            <div className="divide-y divide-line-soft">
              {AUDIT.map((a, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4 text-[12.5px] hover:bg-ivory transition-colors">
                  <div className="font-mono text-[11px] text-ink-mute w-20 shrink-0">{a.time}</div>
                  <Chip variant={a.severity === 'warn' ? 'urgent' : a.severity === 'ai' ? 'ai' : 'neutral'}>
                    {a.severity}
                  </Chip>
                  <div className="flex-1">
                    <span className="font-medium">{a.actor}</span>
                    <span className="text-ink-mute"> · {a.action}</span>
                  </div>
                  <button className="text-ink-mute hover:text-teal-700">
                    <Eye size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Laporan moderasi" meta={`${REPORTS.length} pending`} />
            {REPORTS.map((r) => (
              <div key={r.id} className="p-3 bg-rose-soft/40 border border-rose-medical/20 rounded-lg mb-2">
                <div className="flex items-start gap-2 mb-1">
                  <AlertTriangle size={13} className="text-rose-medical shrink-0 mt-0.5" />
                  <div className="text-[12.5px] font-medium flex-1">{r.subject}</div>
                  <Chip variant="urgent">{r.status}</Chip>
                </div>
                <div className="text-[11.5px] text-[#6E2929] leading-relaxed pl-5">
                  Dilaporkan oleh {r.reporter}: {r.reason}
                </div>
                <div className="pl-5 mt-2 flex gap-2">
                  <button className="text-[11px] text-teal-700 hover:text-teal-900">Review</button>
                  <button className="text-[11px] text-rose-medical hover:text-rose-medical/80 ml-auto">
                    <UserX size={10} className="inline" /> Suspend user
                  </button>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <CardHeader title="Tindakan cepat" />
            <div className="space-y-2 text-[12.5px]">
              <button className="w-full text-left p-2 rounded hover:bg-ivory-deep flex items-center gap-2">
                <UserX size={12} className="text-rose-medical" /> Force logout semua sesi
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-ivory-deep flex items-center gap-2">
                <Lock size={12} className="text-teal-700" /> Aktifkan 2FA wajib
              </button>
              <button className="w-full text-left p-2 rounded hover:bg-ivory-deep flex items-center gap-2">
                <Database size={12} className="text-teal-700" /> Ekspor audit log (CSV)
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
