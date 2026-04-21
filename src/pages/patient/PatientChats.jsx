import { useState } from 'react'
import { Send, Paperclip, MoreVertical, ShieldCheck, Search, Video } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Chip } from '../../components/UI'
import { DOCTORS } from '../../data/mockData'
import { classNames } from '../../lib/utils'

const INITIAL_CHATS = [
  {
    id: 'ch-1',
    doctorId: 'dr-001',
    unread: 2,
    time: '14:22',
    messages: [
      { from: 'doctor', text: 'Halo Raka. Saya dr. Ayu. Saya sudah baca keluhan nyeri ulu hati Anda.', time: '14:15' },
      { from: 'doctor', text: 'Boleh saya tanyakan, apakah nyerinya memburuk saat perut kosong, atau setelah makan?', time: '14:16' },
      { from: 'patient', text: 'Setelah makan, Dok. Terutama makanan pedas.', time: '14:20' },
      { from: 'doctor', text: 'Baik. Apakah ada mual atau muntah? Sudah coba obat apa saja?', time: '14:22' },
    ],
  },
  {
    id: 'ch-2',
    doctorId: 'dr-003',
    unread: 0,
    time: 'Kemarin',
    messages: [
      { from: 'doctor', text: 'Demamnya sudah turun? Sudah minum parasetamol sesuai anjuran?', time: '19:05' },
      { from: 'patient', text: 'Sudah Dok, demam sudah tidak ada. Terima kasih.', time: '19:10' },
    ],
  },
]

export default function PatientChats() {
  const [active, setActive] = useState(INITIAL_CHATS[0].id)
  const [input, setInput] = useState('')
  const [chats, setChats] = useState(INITIAL_CHATS)

  const activeChat = chats.find((c) => c.id === active)
  const activeDoctor = DOCTORS.find((d) => d.id === activeChat?.doctorId)

  const send = () => {
    if (!input.trim()) return
    setChats((list) =>
      list.map((c) =>
        c.id === active
          ? {
              ...c,
              time: 'Baru saja',
              messages: [...c.messages, { from: 'patient', text: input, time: 'Baru saja' }],
            }
          : c
      )
    )
    setInput('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Komunikasi"
        title="Chat"
        titleAccent="Saya"
        subtitle="Percakapan langsung dengan dokter Anda. Terenkripsi end-to-end."
      />

      <div className="grid grid-cols-12 bg-ivory-paper border border-line-soft rounded-[14px] shadow-soft overflow-hidden" style={{ height: 'min(700px, calc(100vh - 240px))' }}>
        {/* Chat list */}
        <div className="col-span-12 md:col-span-4 border-r border-line-soft flex flex-col">
          <div className="p-4 border-b border-line-soft">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input
                placeholder="Cari percakapan…"
                className="w-full pl-9 pr-3 py-2 bg-ivory border border-line-soft rounded-lg text-[13px] outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((c) => {
              const doc = DOCTORS.find((d) => d.id === c.doctorId)
              const last = c.messages[c.messages.length - 1]
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={classNames(
                    'w-full text-left px-4 py-3.5 border-b border-line-soft flex gap-3 transition-colors',
                    active === c.id ? 'bg-ivory-deep' : 'hover:bg-ivory'
                  )}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[14px] text-teal-900 font-medium shrink-0">
                    {doc?.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="text-[13px] font-medium truncate">{doc?.name.split(',')[0]}</div>
                      <div className="text-[10px] font-mono text-ink-mute">{c.time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[12px] text-ink-mute truncate flex-1">{last.text}</div>
                      {c.unread > 0 && (
                        <span className="bg-coral text-white text-[9px] font-semibold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className="hidden md:flex col-span-8 flex-col">
          {activeChat && (
            <>
              <div className="px-5 py-3.5 border-b border-line-soft flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand to-sage flex items-center justify-center font-serif-display text-[13px] text-teal-900 font-medium">
                    {activeDoctor?.initials}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{activeDoctor?.name}</div>
                    <div className="text-[11px] text-teal-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Online
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-full hover:bg-ivory-deep flex items-center justify-center">
                    <Video size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-ivory-deep flex items-center justify-center">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-ivory space-y-2.5">
                <div className="self-center text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ivory-paper border border-dashed border-line rounded-full text-[10px] font-mono uppercase tracking-wider text-ink-mute">
                    <ShieldCheck size={10} /> Percakapan terenkripsi end-to-end
                  </div>
                </div>
                {activeChat.messages.map((m, i) => (
                  <div key={i} className={classNames('flex', m.from === 'patient' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={classNames(
                        'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed',
                        m.from === 'patient'
                          ? 'bg-teal-900 text-ivory rounded-tr-sm'
                          : 'bg-ivory-paper border border-line-soft rounded-tl-sm'
                      )}
                    >
                      <div>{m.text}</div>
                      <div className={classNames('text-[10px] font-mono mt-1', m.from === 'patient' ? 'text-ivory/60' : 'text-ink-mute')}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 border-t border-line-soft flex gap-2 bg-ivory-paper">
                <button className="w-10 h-10 rounded-full bg-ivory-deep hover:bg-line-soft flex items-center justify-center">
                  <Paperclip size={14} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Tulis pesan…"
                  className="flex-1 px-4 py-2.5 bg-ivory border border-line-soft rounded-full text-[13.5px] outline-none"
                />
                <button
                  onClick={send}
                  className="w-10 h-10 rounded-full bg-teal-900 hover:bg-teal-700 text-ivory flex items-center justify-center"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
