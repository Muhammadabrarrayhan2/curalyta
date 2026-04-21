import { useState, useMemo } from 'react'
import { Search, Star, MapPin, Video, Clock, ShieldCheck, X, Calendar, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Card, Chip, DashedDivider } from '../../components/UI'
import { DOCTORS, SPECIALTIES } from '../../data/mockData'
import { formatRupiah, classNames } from '../../lib/utils'

export default function PatientDoctors() {
  const [query, setQuery] = useState('')
  const [spec, setSpec] = useState('all')
  const [mode, setMode] = useState('all')
  const [sort, setSort] = useState('rating')
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const filtered = useMemo(() => {
    let list = DOCTORS.filter((d) => {
      const matchQ = query === '' ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.specialty.toLowerCase().includes(query.toLowerCase())
      const matchSpec = spec === 'all' || d.specialtyId === spec
      const matchMode = mode === 'all' || d.modes.includes(mode)
      return matchQ && matchSpec && matchMode
    })
    if (sort === 'rating') list = list.sort((a, b) => b.rating - a.rating)
    if (sort === 'price-low') list = list.sort((a, b) => a.fee - b.fee)
    if (sort === 'price-high') list = list.sort((a, b) => b.fee - a.fee)
    if (sort === 'experience') list = list.sort((a, b) => b.experience - a.experience)
    return list
  }, [query, spec, mode, sort])

  return (
    <>
      <PageHeader
        eyebrow="Direktori Dokter"
        title="Temukan"
        titleAccent="dokter yang tepat"
        subtitle={`${filtered.length} dokter terverifikasi · seluruh Indonesia · konsultasi online dan offline`}
      />

      {/* Search */}
      <div className="flex gap-2 mb-5 bg-ivory-paper border border-line-soft rounded-[14px] p-1.5 shadow-soft">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={16} className="text-ink-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama dokter atau spesialisasi…"
            className="flex-1 bg-transparent outline-none text-[14px] py-2.5"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2.5 bg-ivory-deep border border-line-soft rounded-lg text-[13px] outline-none cursor-pointer"
        >
          <option value="rating">Rating Tertinggi</option>
          <option value="price-low">Harga Terendah</option>
          <option value="price-high">Harga Tertinggi</option>
          <option value="experience">Paling Berpengalaman</option>
        </select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SPECIALTIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSpec(s.id)}
            className={classNames(
              'px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all flex items-center gap-1.5',
              spec === s.id
                ? 'bg-teal-900 text-ivory border-teal-900'
                : 'bg-ivory-paper border-line text-ink-soft hover:border-teal-500'
            )}
          >
            <span className="text-[10px]">{s.icon}</span>
            {s.name}
          </button>
        ))}
        <div className="border-l border-line mx-1 my-1" />
        {[
          { id: 'all', label: 'Semua Mode' },
          { id: 'online', label: 'Online' },
          { id: 'offline', label: 'Offline' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={classNames(
              'px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all',
              mode === m.id
                ? 'bg-coral text-white border-coral'
                : 'bg-ivory-paper border-line text-ink-soft hover:border-coral'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setSelectedDoctor(d)}
            className="stagger-item text-left bg-ivory-paper border border-line-soft rounded-[14px] p-5 hover:border-teal-500 hover:shadow-medium hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[20px] text-teal-900 font-medium">
                {d.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif-display text-[17px] leading-tight mb-0.5">{d.name}</div>
                <div className="text-[12px] text-teal-700 mb-1.5">{d.specialty}</div>
                <div className="flex items-center gap-3 text-[11px] text-ink-mute font-mono">
                  <span className="flex items-center gap-1">
                    <Star size={10} className="text-amber-medical fill-amber-medical" />
                    {d.rating} ({d.reviewCount})
                  </span>
                  <span>{d.experience} thn</span>
                </div>
              </div>
              {d.verified && <ShieldCheck size={14} className="text-teal-500 shrink-0" />}
            </div>

            <DashedDivider className="my-3" />

            <div className="grid grid-cols-2 gap-3 mb-3 text-[11px] text-ink-mute">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5">Tarif</div>
                <div className="font-serif-display text-[15px] text-ink">{formatRupiah(d.fee)}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5">Slot Terdekat</div>
                <div className="text-[12px] text-ink flex items-center gap-1"><Clock size={10} /> {d.nextSlot}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line-soft">
              <div className="flex gap-1.5">
                {d.modes.includes('online') && <Chip variant="online" icon={Video}>Online</Chip>}
                {d.modes.includes('offline') && <Chip variant="offline" icon={MapPin}>Offline</Chip>}
              </div>
              <ArrowRight size={14} className="text-teal-700" />
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ink-mute">Tidak ada dokter cocok dengan filter tersebut.</div>
      )}

      {/* Doctor Detail / Booking Modal */}
      {selectedDoctor && (
        <DoctorModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}
    </>
  )
}

function DoctorModal({ doctor, onClose }) {
  const [step, setStep] = useState(1) // 1: profile, 2: schedule, 3: intake, 4: confirmed
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedMode, setSelectedMode] = useState(doctor.modes[0])
  const [chief, setChief] = useState('')

  const slots = [
    { date: 'Hari ini', time: '14:30' },
    { date: 'Hari ini', time: '16:00' },
    { date: 'Besok', time: '09:00' },
    { date: 'Besok', time: '10:30' },
    { date: 'Besok', time: '14:00' },
    { date: 'Lusa', time: '09:30' },
  ]

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ivory-paper border border-line-soft rounded-[18px] shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-ivory-deep hover:bg-line-soft flex items-center justify-center z-10"
        >
          <X size={16} />
        </button>

        {step === 1 && (
          <div className="p-7">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[26px] text-teal-900 font-medium">
                {doctor.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-serif-display text-[24px] leading-tight">{doctor.name}</h2>
                  {doctor.verified && <ShieldCheck size={16} className="text-teal-500" />}
                </div>
                <div className="text-[13px] text-teal-700 mb-2">{doctor.specialty}</div>
                <div className="flex items-center gap-3 text-[11.5px] text-ink-mute font-mono">
                  <span className="flex items-center gap-1"><Star size={11} className="text-amber-medical fill-amber-medical" /> {doctor.rating}</span>
                  <span>·</span>
                  <span>{doctor.experience} tahun praktik</span>
                  <span>·</span>
                  <span>{doctor.reviewCount} ulasan</span>
                </div>
              </div>
            </div>

            <DashedDivider className="my-4" />

            <div className="space-y-4 text-[13.5px]">
              <div>
                <div className="eyebrow mb-1.5">Tentang Dokter</div>
                <p className="text-ink-soft leading-relaxed">{doctor.about}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="eyebrow mb-1.5">Rumah Sakit</div>
                  <div>{doctor.hospital}</div>
                  <div className="text-[12px] text-ink-mute">{doctor.location}</div>
                </div>
                <div>
                  <div className="eyebrow mb-1.5">Bahasa</div>
                  <div>{doctor.languages.join(', ')}</div>
                </div>
              </div>
              <div>
                <div className="eyebrow mb-1.5">Tarif Konsultasi</div>
                <div className="font-serif-display text-[22px] text-teal-900">{formatRupiah(doctor.fee)}</div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={onClose} className="btn-ghost flex-1">Tutup</button>
              <button onClick={() => setStep(2)} className="btn-primary flex-1 justify-center">
                Pilih Jadwal <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-7">
            <div className="eyebrow mb-2">Langkah 1 dari 2</div>
            <h2 className="font-serif-display text-[26px] leading-tight mb-4">Pilih <em className="italic text-coral">slot dan mode</em> konsultasi</h2>

            <div className="mb-5">
              <div className="eyebrow mb-2">Mode Konsultasi</div>
              <div className="flex gap-2">
                {doctor.modes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMode(m)}
                    className={classNames(
                      'px-4 py-2.5 rounded-lg border text-[13px] font-medium flex items-center gap-2 transition-colors',
                      selectedMode === m
                        ? 'bg-teal-900 text-ivory border-teal-900'
                        : 'bg-ivory-paper border-line text-ink-soft hover:border-teal-500'
                    )}
                  >
                    {m === 'online' ? <Video size={13} /> : <MapPin size={13} />}
                    {m === 'online' ? 'Online' : 'Kunjungan Klinik'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="eyebrow mb-2">Slot Tersedia</div>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s, i) => {
                  const isSelected = selectedSlot && selectedSlot.date === s.date && selectedSlot.time === s.time
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedSlot(s)}
                      className={classNames(
                        'p-3 rounded-lg border text-left transition-colors',
                        isSelected
                          ? 'bg-teal-900 text-ivory border-teal-900'
                          : 'bg-ivory-paper border-line hover:border-teal-500'
                      )}
                    >
                      <div className={classNames('text-[11px] font-mono uppercase tracking-wider mb-0.5', isSelected ? 'text-ivory/70' : 'text-ink-mute')}>
                        {s.date}
                      </div>
                      <div className="font-serif-display text-[17px]">{s.time}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 mt-7">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1">Kembali</button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedSlot}
                className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Lanjut ke Keluhan <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-7">
            <div className="eyebrow mb-2">Langkah 2 dari 2 · AI Smart Intake</div>
            <h2 className="font-serif-display text-[26px] leading-tight mb-2">Ceritakan <em className="italic text-coral">keluhan Anda</em></h2>
            <p className="text-[13px] text-ink-mute mb-5">
              Tulis sebebas mungkin. AI akan menyusun ulang dalam format klinis sebelum dikirim ke dokter.
            </p>

            <textarea
              value={chief}
              onChange={(e) => setChief(e.target.value)}
              placeholder="Misal: sudah 3 hari saya merasa nyeri ulu hati, mual, terutama setelah makan…"
              rows={6}
              className="w-full p-4 bg-ivory border border-line-soft rounded-xl resize-none text-[13.5px] leading-relaxed"
            />

            <div className="mt-3 p-3.5 bg-teal-100/40 border border-teal-500/20 rounded-lg text-[12px] text-teal-900 leading-relaxed flex items-start gap-2">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <span>
                Data keluhan Anda dienkripsi end-to-end dan hanya dapat dibaca oleh dokter yang Anda pilih. Sesuai <strong>UU PDP No. 27/2022</strong>.
              </span>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1">Kembali</button>
              <button
                onClick={() => setStep(4)}
                disabled={chief.trim().length < 10}
                className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Konfirmasi Booking <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5">
              <Calendar size={24} className="text-teal-900" strokeWidth={1.75} />
            </div>
            <h2 className="font-serif-display text-[28px] leading-tight mb-2">Booking <em className="italic text-coral">berhasil</em></h2>
            <p className="text-[14px] text-ink-mute mb-6 max-w-sm mx-auto leading-relaxed">
              Konsultasi Anda dengan <strong className="text-ink">{doctor.name}</strong> telah
              terjadwal pada <strong className="text-ink">{selectedSlot.date} pukul {selectedSlot.time}</strong>.
            </p>

            <div className="bg-ivory border border-line-soft rounded-xl p-4 text-left text-[12.5px] space-y-1.5 mb-6">
              <div className="flex justify-between"><span className="text-ink-mute">Mode</span> <span className="font-medium capitalize">{selectedMode}</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Tarif</span> <span className="font-medium">{formatRupiah(doctor.fee)}</span></div>
              <div className="flex justify-between"><span className="text-ink-mute">Status</span> <Chip variant="verified">Terkonfirmasi</Chip></div>
            </div>

            <button onClick={onClose} className="btn-primary w-full justify-center">
              Selesai
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
