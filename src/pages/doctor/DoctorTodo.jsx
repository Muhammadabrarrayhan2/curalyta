import { useState } from 'react'
import { Plus, Sparkles, ListChecks } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Chip } from '../../components/UI'
import { classNames } from '../../lib/utils'

const INITIAL_TASKS = [
  { id: 't1', title: 'Balas chat pasien Raka Wijaya', patient: 'Raka Wijaya', priority: 'high', status: 'pending', aiGenerated: true, due: 'Hari ini' },
  { id: 't2', title: 'Review hasil lab HbA1c Bambang S.', patient: 'Bambang Sutrisno', priority: 'high', status: 'pending', aiGenerated: true, due: 'Hari ini' },
  { id: 't3', title: 'Prioritaskan Siti Hartini — red flag', patient: 'Siti Hartini', priority: 'urgent', status: 'pending', aiGenerated: true, due: 'Segera' },
  { id: 't4', title: 'Selesaikan catatan pasien #0982', patient: 'Arif Ramli', priority: 'med', status: 'in_progress', aiGenerated: false, due: 'Hari ini' },
  { id: 't5', title: 'Follow-up hipertensi M.S.', patient: 'Murti Suryani', priority: 'med', status: 'in_progress', aiGenerated: true, due: 'Besok' },
  { id: 't6', title: 'Konfirmasi 3 booking baru', patient: '—', priority: 'low', status: 'pending', aiGenerated: false, due: 'Hari ini' },
  { id: 't7', title: 'Catatan konsultasi pasien Dewi', patient: 'Dewi Anggraeni', priority: 'med', status: 'done', aiGenerated: false, due: 'Kemarin' },
  { id: 't8', title: 'Follow-up demam anak Nina', patient: 'Nina', priority: 'low', status: 'done', aiGenerated: true, due: 'Kemarin' },
]

const COLS = [
  { id: 'pending', label: 'Belum Dikerjakan', color: 'coral' },
  { id: 'in_progress', label: 'Sedang Dikerjakan', color: 'teal' },
  { id: 'done', label: 'Selesai', color: 'sage' },
]

export default function DoctorTodo() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)

  const move = (id, nextStatus) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)))
  }

  return (
    <>
      <PageHeader
        eyebrow="Produktivitas"
        title="To-Do"
        titleAccent="List"
        subtitle="Pusat pekerjaan harian. Sebagian tugas dihasilkan otomatis oleh AI dari aktivitas platform."
        actions={
          <>
            <button className="btn-ghost text-[12px] px-3 py-2">
              <Sparkles size={12} /> Regenerate from AI
            </button>
            <button className="btn-primary text-[12px] px-3 py-2">
              <Plus size={13} /> Tugas Baru
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className="bg-ivory-paper border border-line-soft rounded-[14px] p-4 min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-line">
                <div className="flex items-center gap-2">
                  <div className={classNames(
                    'w-1.5 h-1.5 rounded-full',
                    col.color === 'coral' ? 'bg-coral' : col.color === 'teal' ? 'bg-teal-500' : 'bg-sage'
                  )} />
                  <div className="font-serif-display text-[15px]">{col.label}</div>
                </div>
                <div className="text-[11px] font-mono text-ink-mute">{colTasks.length}</div>
              </div>

              <div className="space-y-2.5">
                {colTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-ivory border border-line-soft rounded-lg stagger-item hover:border-teal-500 transition-colors">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="text-[12.5px] font-medium flex-1 leading-snug">{t.title}</div>
                      {t.aiGenerated && <Chip variant="ai">AI</Chip>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10.5px] font-mono text-ink-mute">
                        {t.patient !== '—' && `${t.patient} · `}{t.due}
                      </div>
                      <Chip variant={
                        t.priority === 'urgent' ? 'urgent' :
                        t.priority === 'high' ? 'new' :
                        t.priority === 'med' ? 'neutral' : 'done'
                      }>{t.priority}</Chip>
                    </div>

                    {/* Quick move controls */}
                    <div className="flex gap-1 mt-2">
                      {col.id !== 'pending' && (
                        <button onClick={() => move(t.id, 'pending')} className="text-[10px] text-ink-mute hover:text-ink">← Pending</button>
                      )}
                      {col.id !== 'in_progress' && (
                        <button onClick={() => move(t.id, 'in_progress')} className="text-[10px] text-ink-mute hover:text-ink ml-auto">In progress</button>
                      )}
                      {col.id !== 'done' && (
                        <button onClick={() => move(t.id, 'done')} className="text-[10px] text-ink-mute hover:text-ink ml-auto">Selesai →</button>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-[11.5px] text-ink-mute italic">Tidak ada tugas.</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* AI insight */}
      <div className="mt-6 bg-gradient-to-br from-teal-900 to-teal-700 text-ivory rounded-[14px] p-5 flex items-start gap-4">
        <Sparkles size={16} className="text-coral-soft shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[10.5px] font-mono uppercase tracking-wider text-coral-soft mb-1">
            AI To-Do Generator
          </div>
          <div className="font-serif-display text-[17px] leading-snug mb-1">
            {tasks.filter((t) => t.aiGenerated).length} tugas dihasilkan otomatis minggu ini
          </div>
          <div className="text-[12.5px] text-ivory/75 leading-relaxed">
            AI menganalisis chat belum dibalas, hasil lab baru, follow-up yang lewat tenggat, dan red flag pasien — lalu menyusun tugas prioritas agar tidak ada yang terlewat.
          </div>
        </div>
      </div>
    </>
  )
}
