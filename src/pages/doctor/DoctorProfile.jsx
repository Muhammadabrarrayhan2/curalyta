import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, Pencil, Star, MapPin, Languages, GraduationCap, Clock } from 'lucide-react'
import { formatRupiah } from '../../lib/utils'

export default function DoctorProfile() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader
        eyebrow="Akun Dokter"
        title="Profil"
        titleAccent="Profesional"
        subtitle="Informasi yang tampil di profil publik Anda. Perubahan data medis sensitif akan divalidasi ulang oleh tim admin."
        actions={
          <button className="btn-primary text-[12px] px-3 py-2">
            <Pencil size={12} /> Edit Profil
          </button>
        }
      />

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          <Card>
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-900 text-ivory flex items-center justify-center font-semibold text-[28px]">
                {user.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-serif-display text-[24px] leading-tight">{user.name}</h2>
                  <Chip variant="verified" icon={ShieldCheck}>Verified</Chip>
                </div>
                <div className="text-[13.5px] text-teal-700 mb-2">{user.specialty}</div>
                <div className="flex items-center gap-4 text-[12px] text-ink-mute font-mono">
                  <span className="flex items-center gap-1"><Star size={11} className="text-amber-medical fill-amber-medical" /> {user.rating}</span>
                  <span>·</span>
                  <span>{user.experience} tahun praktik</span>
                  <span>·</span>
                  <span>{user.reviewCount} ulasan</span>
                </div>
              </div>
            </div>
            <DashedDivider />
            <div className="grid md:grid-cols-2 gap-5 text-[13px]">
              <div>
                <div className="eyebrow mb-1">STR</div>
                <div className="font-mono text-[12px]">{user.strNumber}</div>
              </div>
              <div>
                <div className="eyebrow mb-1">SIP</div>
                <div className="font-mono text-[12px]">{user.sipNumber}</div>
              </div>
              <div>
                <div className="eyebrow mb-1">Afiliasi</div>
                <div>{user.hospital}</div>
              </div>
              <div>
                <div className="eyebrow mb-1">Lokasi</div>
                <div className="flex items-center gap-1"><MapPin size={11} /> {user.location}</div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-serif-display text-[19px] mb-3">Tentang Dokter</h3>
            <p className="text-[13.5px] text-ink-soft leading-relaxed">
              Praktik klinis fokus pada hipertensi, diabetes, dan penyakit metabolik. Memberikan
              pendekatan konsultasi yang tenang, berbasis bukti, dan edukatif. Berpengalaman menangani
              kasus-kasus kompleks dengan komorbid ganda.
            </p>
          </Card>

          <Card>
            <h3 className="font-serif-display text-[19px] mb-3">Bahasa &amp; Pendidikan</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center gap-2"><Languages size={13} className="text-ink-mute" /> Indonesia, English</div>
              <div className="flex items-center gap-2"><GraduationCap size={13} className="text-ink-mute" /> Fakultas Kedokteran, Universitas Indonesia (2013)</div>
              <div className="flex items-center gap-2"><GraduationCap size={13} className="text-ink-mute" /> Spesialis Penyakit Dalam, FKUI-RSCM (2020)</div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="eyebrow mb-2">Tarif Konsultasi</div>
            <div className="font-serif-display text-[32px] text-teal-900 leading-none">{formatRupiah(user.fee)}</div>
            <div className="text-[11px] text-ink-mute mt-1">Per sesi · online &amp; offline</div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-900 to-teal-700 text-ivory border-teal-900">
            <ShieldCheck size={18} className="text-coral-soft mb-2" />
            <div className="font-serif-display text-[17px] mb-1">Status Verifikasi</div>
            <div className="text-[12.5px] text-ivory/80 leading-relaxed">
              Akun Anda telah diverifikasi pada 14 Februari 2024. Re-verifikasi dilakukan setiap
              perpanjangan STR/SIP.
            </div>
          </Card>

          <Card>
            <div className="eyebrow mb-3">Jam Praktik Minggu Ini</div>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-ink-mute">Senin</span><span>09:00–12:00 · 19:00–21:00</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Selasa</span><span>09:00–12:00 · 14:00–17:00</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Rabu</span><span>14:00–17:00</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Kamis</span><span>09:00–12:00 · 19:00–21:00</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Jumat</span><span>09:00–11:30</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Sabtu</span><span>10:00–13:00</span></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
