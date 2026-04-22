import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { Badge, Button, Empty, Field, Input, Modal, Spinner, Tabs } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDateTime, priorityBadgeTone, priorityLabel } from '@/lib/format';
import type { Task, TaskStatus, TaskPriority } from '@/types';

export function DoctorTasks() {
  const [scope, setScope] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  const [showAdd, setShowAdd] = useState(false);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', scope],
    queryFn: async () => (await api.get<{ tasks: Task[] }>('/tasks', { params: { scope } })).data.tasks,
  });

  const { data: stats } = useQuery<{ total: number; pending: number; done: number; overdue: number }>({
    queryKey: ['tasks-stats'],
    queryFn: async () => (await api.get('/tasks/stats')).data,
  });

  const queryClient = useQueryClient();
  const toast = useToast();

  async function updateStatus(task: Task, status: TaskStatus) {
    try {
      await api.patch(`/tasks/${task.id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removeTask(id: string) {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
      toast.success('Tugas dihapus');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          {stats && (
            <div className="flex items-center gap-4 text-sm text-stone-500">
              <span>{stats.pending} aktif</span>
              <span>·</span>
              <span className="text-clinical-danger">{stats.overdue} overdue</span>
              <span>·</span>
              <span>{stats.done} selesai</span>
            </div>
          )}
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" size={14} /> Tugas baru</Button>
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'Semua' },
          { id: 'today', label: 'Hari ini' },
          { id: 'week', label: 'Pekan ini' },
          { id: 'overdue', label: 'Overdue' },
        ]}
        active={scope}
        onChange={(id) => setScope(id as typeof scope)}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="card">
          <Empty
            icon="checkCircle"
            title="Tidak ada tugas"
            description={scope === 'all' ? 'Tambahkan tugas pertama Anda.' : 'Tidak ada tugas dalam filter ini.'}
            action={<Button size="sm" onClick={() => setShowAdd(true)}>Tambah tugas</Button>}
          />
        </div>
      ) : (
        <div className="card divide-y divide-stone-50">
          {tasks.map((t) => {
            const overdue = t.dueAt && t.status !== 'DONE' && new Date(t.dueAt) < new Date();
            return (
              <div key={t.id} className="p-4 flex items-start gap-3">
                <button
                  onClick={() => updateStatus(t, t.status === 'DONE' ? 'PENDING' : 'DONE')}
                  className={`mt-0.5 w-5 h-5 rounded-sm border-2 shrink-0 transition-all ${
                    t.status === 'DONE' ? 'bg-sage border-sage' : 'border-stone-300 hover:border-sage'
                  }`}
                >
                  {t.status === 'DONE' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full p-0.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-[14px] ${t.status === 'DONE' ? 'line-through text-stone-400' : 'text-ink'}`}>
                    {t.title}
                  </div>
                  {t.description && <div className="text-[12.5px] text-stone-500 mt-1">{t.description}</div>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {t.dueAt && (
                      <span className={`text-[11.5px] flex items-center gap-1 ${overdue ? 'text-clinical-danger' : 'text-stone-500'}`}>
                        <Icon name="clock" size={12} /> {fmtDateTime(t.dueAt)}
                        {overdue && <Badge tone="danger" className="!py-0">Overdue</Badge>}
                      </span>
                    )}
                    <Badge tone={priorityBadgeTone(t.priority)}>{priorityLabel(t.priority)}</Badge>
                  </div>
                </div>
                <button onClick={() => removeTask(t.id)} className="text-stone-400 hover:text-clinical-danger p-1">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddTaskModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function AddTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  async function submit() {
    if (!form.title || form.title.length < 2) {
      setErrors({ title: 'Judul minimal 2 karakter' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/tasks', {
        title: form.title,
        description: form.description || null,
        priority: (form.priority as TaskPriority) || 'MEDIUM',
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
      toast.success('Tugas ditambahkan');
      setForm({});
      setErrors({});
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-display text-xl text-ink">Tugas Baru</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
          <Field label="Judul" required error={errors.title}>
            <Input value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={!!errors.title} placeholder="Follow up pasien X..." autoFocus />
          </Field>
          <Field label="Deskripsi (opsional)">
            <textarea className="input resize-none" rows={3} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioritas">
              <select className="input" value={form.priority || 'MEDIUM'} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Urgent</option>
              </select>
            </Field>
            <Field label="Tenggat">
              <Input type="datetime-local" value={form.dueAt || ''} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" loading={loading}>Tambah</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
