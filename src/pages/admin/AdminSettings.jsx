import PageHeader from '../../components/PageHeader'
import { Card, CardHeader, Chip, DashedDivider } from '../../components/UI'
import { useState } from 'react'
import { Bell, Sparkles, CreditCard, Globe, Network } from 'lucide-react'

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={'relative w-11 h-6 rounded-full transition-colors ' + (on ? 'bg-teal-700' : 'bg-ivory-deep border border-line')}
    >
      <span
        className={'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ' + (on ? 'translate-x-[22px]' : 'translate-x-0.5')}
      />
    </button>
  )
}

export default function AdminSettings() {
  const [s, setS] = useState({
    aiFeatures: true,
    aiRedFlag: true,
    aiNoteGen: true,
    mlPrediction: false,
    emailNotif: true,
    smsNotif: true,
    whatsappNotif: false,
    twoFaRequired: true,
    auditRetention: true,
    satusehat: false,
    midtrans: true,
  })
  const toggle = (k) => setS((x) => ({ ...x, [k]: !x[k] }))

  return (
    <>
      <PageHeader
        eyebrow="Konfigurasi"
        title="Pengaturan"
        titleAccent="Sistem"
        subtitle="Kontrol umum platform: fitur AI, notifikasi, integrasi pembayaran, dan interoperabilitas."
      />

      <div className="grid md:grid-cols-2 gap-5">
        {/* AI Config */}
        <Card>
          <CardHeader title="Fitur AI" meta="Clinical support" />
          <SettingRow label="AI Features (global)" desc="Master switch untuk semua modul AI" on={s.aiFeatures} onChange={() => toggle('aiFeatures')} />
          <SettingRow label="Red Flag Detector" desc="Deteksi tanda bahaya otomatis saat konsultasi" on={s.aiRedFlag} onChange={() => toggle('aiRedFlag')} />
          <SettingRow label="Note Generator" desc="Draft SOAP otomatis dari chat dan intake" on={s.aiNoteGen} onChange={() => toggle('aiNoteGen')} />
          <SettingRow
            label={<>ML Prediction Engine <Chip variant="pending">Beta</Chip></>}
            desc="Prediksi risiko berbasis machine learning"
            on={s.mlPrediction} onChange={() => toggle('mlPrediction')}
          />
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader title="Notifikasi" meta="Channel" />
          <SettingRow label="Email" desc="Konfirmasi booking, reset password" on={s.emailNotif} onChange={() => toggle('emailNotif')} />
          <SettingRow label="SMS" desc="Reminder jadwal konsultasi" on={s.smsNotif} onChange={() => toggle('smsNotif')} />
          <SettingRow label="WhatsApp" desc="Via Business API (biaya tambahan)" on={s.whatsappNotif} onChange={() => toggle('whatsappNotif')} />
        </Card>

        {/* Security */}
        <Card>
          <CardHeader title="Keamanan" meta="Compliance" />
          <SettingRow label="2FA wajib untuk dokter & admin" desc="Sesuai rekomendasi UU PDP" on={s.twoFaRequired} onChange={() => toggle('twoFaRequired')} />
          <SettingRow label="Retensi audit log 2 tahun" desc="Disimpan terenkripsi di cold storage" on={s.auditRetention} onChange={() => toggle('auditRetention')} />
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader title="Integrasi" meta="Ekosistem" />
          <SettingRow
            label={<><Network size={12} className="inline mr-1" /> SATUSEHAT (Kemenkes)</>}
            desc="Interoperabilitas rekam medis nasional"
            on={s.satusehat} onChange={() => toggle('satusehat')}
          />
          <SettingRow
            label={<><CreditCard size={12} className="inline mr-1" /> Midtrans Payment</>}
            desc="Payment gateway Indonesia — QRIS, GoPay, Bank Transfer"
            on={s.midtrans} onChange={() => toggle('midtrans')}
          />
        </Card>
      </div>

      <Card className="mt-5 bg-gradient-to-br from-teal-900 to-teal-700 text-ivory border-teal-900">
        <Globe size={18} className="text-coral-soft mb-3" />
        <div className="font-serif-display text-[19px] mb-2">Curalyta · versi 0.1.0 (prototype)</div>
        <div className="text-[12.5px] text-ivory/75 leading-relaxed max-w-2xl">
          Perubahan konfigurasi di halaman ini akan di-deploy ke production dalam 5 menit dan tercatat
          di audit log. Perubahan yang mempengaruhi data pasien (mis. integrasi SATUSEHAT) memerlukan
          review DPO (Data Protection Officer) terlebih dahulu.
        </div>
      </Card>
    </>
  )
}

function SettingRow({ label, desc, on, onChange }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="flex-1">
          <div className="text-[13px] font-medium flex items-center gap-2">{label}</div>
          <div className="text-[11.5px] text-ink-mute mt-0.5">{desc}</div>
        </div>
        <Toggle on={on} onChange={onChange} />
      </div>
      <DashedDivider className="my-0 last:hidden" />
    </>
  )
}
