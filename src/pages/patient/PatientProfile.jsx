import PageHeader from '../../components/PageHeader'
import { Card, DashedDivider } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Phone, MapPin, Heart, AlertTriangle, Shield } from 'lucide-react'

export default function PatientProfile() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        eyebrow="Akun"
        title="Profil"
        titleAccent="Saya"
        subtitle="Kelola data pribadi dan kesehatan Anda. Data ini dibagikan terbatas hanya ke dokter yang Anda pilih."
      />

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-900 text-ivory flex items-center justify-center font-semibold text-[22px]">
                {user.initials}
              </div>
              <div>
                <div className="font-serif-display text-[22px] leading-tight">{user.name}</div>
                <div className="text-[12px] text-ink-mute">Pasien sejak April 2026</div>
              </div>
              <button className="btn-ghost ml-auto text-[12px] px-3 py-1.5">Edit foto</button>
            </div>
            <DashedDivider />
            <div className="grid md:grid-cols-2 gap-5 text-[13px]">
              <Field label="Nama Lengkap" value={user.name} icon={User} />
              <Field label="Usia" value={`${user.age} tahun`} />
              <Field label="Jenis Kelamin" value={user.gender} />
              <Field label="No. Telepon" value={user.phone} icon={Phone} />
              <Field label="Lokasi" value={user.location} icon={MapPin} />
              <Field label="Email" value="—" icon={Mail} />
            </div>
          </Card>

          <Card>
            <h3 className="font-serif-display text-[19px] mb-4">Informasi Medis</h3>
            <div className="grid md:grid-cols-2 gap-5 text-[13px]">
              <Field label="Golongan Darah" value={user.bloodType} icon={Heart} />
              <Field label="Alergi" value={user.allergies?.join(', ') || '—'} icon={AlertTriangle} accent="rose" />
              <Field
                label="Kondisi Kronis"
                value={user.chronicConditions?.length ? user.chronicConditions.join(', ') : '—'}
              />
              <Field label="Obat Rutin" value="Amlodipine 5mg (aktif)" />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-gradient-to-br from-teal-900 to-teal-700 text-ivory border-teal-900">
            <Shield size={18} className="text-coral-soft mb-3" />
            <h4 className="font-serif-display text-[18px] mb-2">Privasi &amp; Consent</h4>
            <p className="text-[12.5px] text-ivory/75 leading-relaxed">
              Data Anda dilindungi oleh UU Pelindungan Data Pribadi No. 27/2022. Anda berhak
              mencabut persetujuan, mengekspor, atau menghapus data kapan saja.
            </p>
            <button className="mt-4 text-[12px] font-medium text-coral-soft hover:text-coral flex items-center gap-1">
              Kelola consent →
            </button>
          </Card>

          <Card>
            <h4 className="font-serif-display text-[17px] mb-3">Keamanan Akun</h4>
            <div className="space-y-2.5 text-[12.5px]">
              <div className="flex justify-between items-center py-2 border-b border-line-soft">
                <span className="text-ink-mute">Metode Login</span>
                <span className="font-medium">Role-based (demo)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-line-soft">
                <span className="text-ink-mute">2FA</span>
                <span className="font-medium text-ink-mute">Nonaktif</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-ink-mute">Sesi aktif</span>
                <span className="font-medium">1 perangkat</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

function Field({ label, value, icon: Icon, accent }) {
  return (
    <div>
      <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-mute mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={11} strokeWidth={1.8} />}
        {label}
      </div>
      <div className={accent === 'rose' ? 'text-rose-medical font-medium' : 'font-medium'}>{value}</div>
    </div>
  )
}
