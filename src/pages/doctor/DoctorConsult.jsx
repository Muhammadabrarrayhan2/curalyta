import { useState } from 'react'
import {
  Sparkles,
  AlertTriangle,
  Brain,
  FileText,
  Send,
  Paperclip,
  Video,
  ShieldCheck,
  Info,
  Check,
  ClipboardList,
  ActivitySquare,
  Stethoscope,
  MessageSquare,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Chip, DashedDivider } from '../../components/UI'
import { DOCTOR_PATIENTS } from '../../data/mockData'
import { classNames } from '../../lib/utils'

/**
 * DoctorConsult — inti dari Curalyta dari sisi dokter.
 * 3-pane layout:
 *   1. Patient queue (left)
 *   2. Conversation/consultation (center)
 *   3. AI Clinical Support (right)
 */

const AI_DATA = {
  'pt-002': {
    intake: {
      chief: 'Sesak napas, dada terasa berat, pusing',
      onset: 'Sejak tadi malam (~9 jam)',
      severity: 'Sedang-berat',
      comorbid: 'Hipertensi, DM tipe 2',
      medication: 'Amlodipine, Metformin',
      allergies: 'Tidak diketahui',
    },
    redFlags: [
      {
        level: 'high',
        title: 'Kombinasi sesak + nyeri dada',
        note: 'Pada wanita 58 tahun dengan komorbid HT dan DM, pertimbangkan ACS (termasuk atipikal). Evaluasi kardiovaskular urgent direkomendasikan.',
      },
    ],
    ddx: [
      {
        name: 'Sindrom koroner akut (ACS)',
        likelihood: 68,
        support: 'Usia, DM+HT, nyeri dada berat + sesak, keringat dingin.',
        against: 'Nyeri belum divisualisasi lokasi pastinya.',
      },
      {
        name: 'Gagal jantung akut dekompensata',
        likelihood: 42,
        support: 'Sesak progresif, riwayat HT, kemungkinan kardiomegali.',
        against: 'Belum ada riwayat CHF sebelumnya.',
      },
      {
        name: 'Emboli paru',
        likelihood: 18,
        support: 'Sesak akut, pleuritic chest pain.',
        against: 'Tidak ada faktor risiko VTE yang dilaporkan.',
      },
      {
        name: 'Krisis hipertensi',
        likelihood: 22,
        support: 'Riwayat HT, gejala pusing + sesak.',
        against: 'Perlu pengukuran TD saat ini.',
      },
    ],
    scores: [
      { name: 'HEART Score', value: '—', note: 'Perlu EKG dan troponin', status: 'incomplete' },
      { name: 'Wells (PE)', value: '1.5', note: 'Low-intermediate risk', status: 'ok' },
      { name: 'qSOFA', value: '0', note: 'Low sepsis risk', status: 'ok' },
    ],
    missing: [
      'EKG 12 lead saat ini',
      'Tekanan darah & saturasi O₂',
      'Troponin I/T (lab cito)',
      'Riwayat keluarga CAD',
    ],
    suggestedQuestions: [
      'Apakah nyeri menjalar ke lengan kiri / rahang?',
      'Berapa lama nyeri berlangsung setiap episode?',
      'Apakah ada riwayat serangan jantung di keluarga?',
      'Kapan terakhir periksa tekanan darah?',
    ],
  },
  'pt-001': {
    intake: {
      chief: 'Nyeri ulu hati, mual, memburuk setelah makan',
      onset: '3 hari',
      severity: 'Ringan-sedang',
      comorbid: 'Tidak ada yang signifikan',
      medication: 'Kadang antasida',
      allergies: 'Amoksisilin',
    },
    redFlags: [],
    ddx: [
      {
        name: 'GERD',
        likelihood: 62,
        support: 'Nyeri ulu hati memburuk setelah makan, mual.',
        against: 'Belum ada regurgitasi atau disfagia.',
      },
      {
        name: 'Gastritis akut',
        likelihood: 48,
        support: 'Mual, epigastrik pain.',
        against: 'Riwayat NSAID atau alkohol belum dikonfirmasi.',
      },
      {
        name: 'Dispepsia fungsional',
        likelihood: 35,
        support: 'Pola gejala bisa cocok.',
        against: 'Perlu eksklusi organik.',
      },
      {
        name: 'Kolesistitis',
        likelihood: 8,
        support: 'Nyeri post-prandial.',
        against: 'Lokasi tidak tipikal, tidak ada demam.',
      },
    ],
    scores: [
      { name: 'Alvarado', value: '—', note: 'Tidak relevan (bukan RLQ)', status: 'na' },
    ],
    missing: [
      'Riwayat NSAID/alkohol',
      'Karakter nyeri (tajam/tumpul)',
      'Pola tidur terakhir 3 hari',
    ],
    suggestedQuestions: [
      'Apakah ada riwayat konsumsi NSAID/aspirin?',
      'Pola makan seperti apa belakangan ini?',
      'Ada penurunan berat badan atau anoreksia?',
    ],
  },
}

export default function DoctorConsult() {
  const [activeId, setActiveId] = useState('pt-002')
  const [noteDraft, setNoteDraft] = useState('')
  const [showNoteGen, setShowNoteGen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'system', text: 'Konsultasi dimulai · AI Smart Intake telah diringkas ke panel kanan.' },
    { from: 'patient', text: 'Selamat siang Dokter. Saya sesak sejak tadi malam, dada berat dan pusing.' },
    { from: 'doctor', text: 'Baik, Bu. Apakah ada riwayat sakit jantung atau tekanan darah tinggi?' },
    { from: 'patient', text: 'Iya Dok, saya darah tinggi dan diabetes. Rutin minum amlodipine dan metformin.' },
  ])
  const [chatInput, setChatInput] = useState('')

  const active = DOCTOR_PATIENTS.find((p) => p.id === activeId)
  const ai = AI_DATA[activeId] || AI_DATA['pt-001']

  const send = () => {
    if (!chatInput.trim()) return
    setMessages((m) => [...m, { from: 'doctor', text: chatInput }])
    setChatInput('')
  }

  const generateNote = () => {
    setShowNoteGen(true)
    setTimeout(() => {
      setNoteDraft(
        `SOAP — ${active?.name} (${active?.age}${active?.gender})

S (Subjective):
Pasien datang dengan keluhan ${ai.intake.chief}. Onset ${ai.intake.onset}. Keparahan ${ai.intake.severity}. Riwayat penyakit: ${ai.intake.comorbid}. Obat rutin: ${ai.intake.medication}. Alergi: ${ai.intake.allergies}.

O (Objective):
[Perlu diisi: tanda vital, EKG, pemeriksaan fisik]

A (Assessment):
Diagnosis kerja: ${ai.ddx[0].name} (probabilitas ${ai.ddx[0].likelihood}%).
DDx yang perlu disingkirkan: ${ai.ddx.slice(1, 3).map((d) => d.name).join(', ')}.

P (Plan):
1. [Isi rencana diagnostik]
2. [Isi terapi awal]
3. Edukasi pasien mengenai tanda bahaya.
4. Follow-up / rujukan bila diperlukan.

— Draft dihasilkan oleh AI Clinical Note Generator. Harap di-review dan disetujui dokter sebelum disimpan ke rekam medis.`
      )
    }, 400)
  }

  return (
    <>
      <PageHeader
        eyebrow="Ruang Konsultasi"
        title="Pusat"
        titleAccent="Klinis"
        subtitle="Chat dengan pasien didampingi AI clinical support — Patient Summary, DDx Assistant, Red Flag Detector, dan Note Generator."
        actions={
          <>
            <button className="btn-ghost text-[12px] px-3 py-2">
              <Video size={12} /> Mulai Video
            </button>
            <button onClick={generateNote} className="btn-primary text-[12px] px-3 py-2">
              <Sparkles size={12} /> Generate Catatan
            </button>
          </>
        }
      />

      <div className="grid grid-cols-12 bg-ivory-paper border border-line-soft rounded-[14px] shadow-soft overflow-hidden" style={{ height: 'min(760px, calc(100vh - 240px))' }}>
        {/* Patient queue */}
        <aside className="col-span-3 border-r border-line-soft flex flex-col">
          <div className="px-4 py-3.5 border-b border-line-soft">
            <div className="eyebrow mb-1">Antrian</div>
            <div className="font-serif-display text-[18px]">{DOCTOR_PATIENTS.filter((p) => p.status === 'waiting').length} pasien menunggu</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {DOCTOR_PATIENTS.filter((p) => p.status === 'waiting').map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={classNames(
                  'w-full text-left p-4 border-b border-line-soft transition-colors',
                  activeId === p.id ? 'bg-ivory-deep' : 'hover:bg-ivory'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[12px] text-teal-900 font-medium">
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="text-[13px] font-medium truncate">{p.name}</div>
                      {p.hasRedFlag && <AlertTriangle size={11} className="text-rose-medical shrink-0" />}
                    </div>
                    <div className="text-[10.5px] text-ink-mute font-mono mb-1">{p.age}{p.gender} · {p.bookingTime}</div>
                    <div className="text-[11.5px] text-ink-mute truncate">{p.chief}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat main */}
        <section className="col-span-12 md:col-span-5 flex flex-col">
          <div className="px-5 py-3.5 border-b border-line-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[13px] text-teal-900 font-medium">
                {active?.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-medium">{active?.name}</div>
                  {active?.hasRedFlag && <Chip variant="urgent" icon={AlertTriangle}>Urgent</Chip>}
                </div>
                <div className="text-[11px] text-ink-mute font-mono">{active?.age}{active?.gender} · Mode {active?.mode}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-ivory space-y-2.5">
            {messages.map((m, i) =>
              m.from === 'system' ? (
                <div key={i} className="flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ivory-paper border border-dashed border-line rounded-full text-[10px] font-mono uppercase tracking-wider text-ink-mute">
                    <ShieldCheck size={10} /> {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className={classNames('flex', m.from === 'doctor' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={classNames(
                      'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed',
                      m.from === 'doctor'
                        ? 'bg-teal-900 text-ivory rounded-tr-sm'
                        : 'bg-ivory-paper border border-line-soft rounded-tl-sm'
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Note gen drawer */}
          {showNoteGen && (
            <div className="border-t border-line-soft bg-gradient-to-br from-teal-900/[0.03] to-coral/[0.03] p-4 max-h-[280px] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={12} className="text-coral" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-teal-700">AI Note Draft</span>
                </div>
                <div className="flex gap-2">
                  <button className="text-[11px] text-ink-mute hover:text-ink" onClick={() => setShowNoteGen(false)}>Tutup</button>
                  <button className="btn-primary text-[11px] px-2.5 py-1">
                    <Check size={11} /> Setujui &amp; simpan
                  </button>
                </div>
              </div>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="w-full text-[12px] font-mono bg-ivory-paper border border-line-soft rounded-lg p-3 leading-relaxed resize-none"
                rows={10}
                placeholder="AI sedang menyusun draft SOAP…"
              />
            </div>
          )}

          <div className="p-3.5 border-t border-line-soft flex gap-2 bg-ivory-paper">
            <button className="w-10 h-10 rounded-full bg-ivory-deep hover:bg-line-soft flex items-center justify-center">
              <Paperclip size={14} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Tulis pertanyaan atau respons…"
              className="flex-1 px-4 py-2.5 bg-ivory border border-line-soft rounded-full text-[13.5px] outline-none"
            />
            <button onClick={send} className="w-10 h-10 rounded-full bg-teal-900 hover:bg-teal-700 text-ivory flex items-center justify-center">
              <Send size={14} />
            </button>
          </div>
        </section>

        {/* AI clinical panel */}
        <aside className="col-span-12 md:col-span-4 border-l border-line-soft flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-line-soft flex items-center gap-2">
            <Sparkles size={14} className="text-coral" />
            <div className="font-serif-display text-[16px]">AI Clinical Support</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Red flags */}
            {ai.redFlags.length > 0 && (
              <div className="px-4 py-3 border-b border-line-soft">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-rose-medical mb-2">
                  <AlertTriangle size={10} /> Red Flag
                </div>
                {ai.redFlags.map((rf, i) => (
                  <div key={i} className="bg-rose-soft/60 border border-rose-medical/25 rounded-lg p-3 mb-1.5">
                    <div className="text-[12px] font-semibold text-rose-medical mb-1">{rf.title}</div>
                    <div className="text-[11.5px] text-[#6E2929] leading-relaxed">{rf.note}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Patient summary */}
            <div className="px-4 py-3 border-b border-line-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-700 mb-2">
                <FileText size={10} /> Patient Summary
              </div>
              <div className="space-y-1.5 text-[12px]">
                {Object.entries(ai.intake).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-ink-mute capitalize shrink-0">{k}</span>
                    <span className="text-right text-ink-soft">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Differential Dx */}
            <div className="px-4 py-3 border-b border-line-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-700 mb-2">
                <Brain size={10} /> Differential Dx
              </div>
              <div className="space-y-2">
                {ai.ddx.map((d, i) => (
                  <div key={i} className="bg-ivory-paper border border-line-soft rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[12px] font-medium">{d.name}</div>
                      <div className="text-[10px] font-mono text-teal-700">{d.likelihood}%</div>
                    </div>
                    <div className="w-full h-1 bg-ivory-deep rounded-full overflow-hidden mb-2">
                      <div
                        className={classNames(
                          'h-full rounded-full',
                          d.likelihood > 50 ? 'bg-coral' : d.likelihood > 25 ? 'bg-amber-medical' : 'bg-sage'
                        )}
                        style={{ width: `${d.likelihood}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-ink-mute leading-relaxed">
                      <span className="text-teal-700">↑</span> {d.support}
                    </div>
                    <div className="text-[11px] text-ink-mute leading-relaxed mt-0.5">
                      <span className="text-rose-medical">↓</span> {d.against}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scores */}
            <div className="px-4 py-3 border-b border-line-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-700 mb-2">
                <ActivitySquare size={10} /> Clinical Scores
              </div>
              <div className="space-y-1.5 text-[12px]">
                {ai.scores.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 bg-ivory rounded-md">
                    <div>
                      <div className="font-medium text-[12px]">{s.name}</div>
                      <div className="text-[10.5px] text-ink-mute">{s.note}</div>
                    </div>
                    <div className={classNames(
                      'font-mono text-[13px] px-2 py-0.5 rounded',
                      s.status === 'ok' ? 'bg-teal-100 text-teal-900' : s.status === 'incomplete' ? 'bg-[#F7E8C8] text-[#6B4E0C]' : 'bg-ivory-deep text-ink-mute'
                    )}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing data */}
            <div className="px-4 py-3 border-b border-line-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-700 mb-2">
                <Info size={10} /> Data yang Kurang
              </div>
              <ul className="space-y-1 text-[11.5px] text-ink-soft">
                {ai.missing.map((m, i) => (
                  <li key={i} className="flex gap-2"><span className="text-coral">◦</span> {m}</li>
                ))}
              </ul>
            </div>

            {/* Suggested questions */}
            <div className="px-4 py-3 border-b border-line-soft">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-700 mb-2">
                <MessageSquare size={10} /> Saran Pertanyaan Lanjut
              </div>
              <div className="space-y-1.5">
                {ai.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setChatInput(q)}
                    className="w-full text-left p-2 text-[11.5px] bg-ivory hover:bg-teal-100 border border-line-soft rounded-md transition-colors leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-3 text-[10.5px] text-ink-mute leading-relaxed border-t border-dashed border-line">
              AI adalah decision support — bukan pengganti dokter. Keputusan klinis final, termasuk diagnosis, resep, dan rujukan, tetap di tangan Anda.
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
