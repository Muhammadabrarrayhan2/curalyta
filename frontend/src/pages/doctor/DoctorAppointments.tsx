import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { Avatar, Badge, Button, Empty, Field, Input, Modal, Spinner, Tabs } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDateTime } from '@/lib/format';
import type { Appointment, PatientProfile } from '@/types';

export function DoctorAppointments() {
  const [scope, setScope] = useState<'today' | 'upcoming' | 'past' | 'all'>('upcoming');
  const [showAdd, setShowAdd] = useState(false);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', scope],
    queryFn: async () =>
      (await api.get<{ appointments: Appointment[] }>('/appointments', { params: { scope } })).data.appointments,
  });

  const queryClient = useQueryClient();
  const toast = useToast();

  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/appointments/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function remove(id: string) {
    if (!confirm('Hapus appointment ini?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment dihapus');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-stone-500">
          {appointments ? `${appointments.length} appointment` : '—'}
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" size={14} /> Jadwalkan baru</Button>
      </div>

      <Tabs
        tabs={[
          { id: 'today', label: 'Hari ini' },
          { id: 'upcoming', label: 'Akan datang' },
          { id: 'past', label: 'Lampau' },
          { id: 'all', label: 'Semua' },
        ]}
        active={scope}
        onChange={(id) => setScope(id as typeof scope)}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : !appointments || appointments.length === 0 ? (
        <div className="card"><Empty icon="calendar" title="Tidak ada appointment" action={<Button size="sm" onClick={() => setShowAdd(true)}>Jadwalkan baru</Button>} /></div>
      ) : (
        <div className="card divide-y divide-stone-50">
          {appointments.map((a) => (
            <div key={a.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-center shrink-0 w-16 border-r border-stone-100 pr-3">
                  <div className="number-display text-lg text-ink leading-none">
                    {new Date(a.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[10px] text-stone-400 uppercase mt-0.5">{a.duration}m</div>
                </div>
                <Avatar name={a.patient?.name || '?'} size="sm" />
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{a.patient?.name || 'Pasien'}</div>
                  <div className="text-[12px] text-stone-500 truncate">
                    {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {a.reason ? ` · ${a.reason}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  tone={
                    a.status === 'SCHEDULED' ? 'info' :
                    a.status === 'COMPLETED' ? 'success' :
                    a.status === 'CANCELLED' ? 'danger' : 'default'
                  }
                >
                  {a.status === 'SCHEDULED' ? 'Terjadwal' :
                    a.status === 'COMPLETED' ? 'Selesai' :
                    a.status === 'CANCELLED' ? 'Dibatalkan' : 'No-show'}
                </Badge>
                {a.status === 'SCHEDULED' && (
                  <>
                    <button onClick={() => updateStatus(a.id, 'COMPLETED')} className="p-1.5 text-stone-500 hover:text-clinical-success" title="Tandai selesai">
                      <Icon name="check" size={14} />
                    </button>
                    <button onClick={() => updateStatus(a.id, 'CANCELLED')} className="p-1.5 text-stone-500 hover:text-clinical-danger" title="Batalkan">
                      <Icon name="x" size={14} />
                    </button>
                  </>
                )}
                <button onClick={() => remove(a.id)} className="p-1.5 text-stone-400 hover:text-clinical-danger">
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAppointmentModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function AddAppointmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({ duration: '30' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: patients } = useQuery<PatientProfile[]>({
    queryKey: ['patients-for-appt'],
    queryFn: async () => (await api.get<{ data: PatientProfile[] }>('/patients', { params: { pageSize: 100 } })).data.data,
    enabled: open,
  });

  async function submit() {
    const e: Record<string, string | undefined> = {};
    if (!form.patientId) e.patientId = 'Pilih pasien';
    if (!form.date) e.date = 'Waktu wajib';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await api.post('/appointments', {
        patientId: form.patientId,
        date: new Date(form.date).toISOString(),
        duration: Number(form.duration) || 30,
        reason: form.reason || null,
        notes: form.notes || null,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
      toast.success('Appointment dijadwalkan');
      setForm({ duration: '30' });
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
          <h2 className="font-display text-xl text-ink">Jadwalkan Appointment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
          <Field label="Pasien" required error={errors.patientId}>
            <select
              className={`input ${errors.patientId ? 'error' : ''}`}
              value={form.patientId || ''}
              onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">— Pilih pasien —</option>
              {patients?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Waktu" required error={errors.date}>
              <Input type="datetime-local" value={form.date || ''} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} error={!!errors.date} />
            </Field>
            <Field label="Durasi (menit)">
              <Input type="number" min={5} max={240} value={form.duration || '30'} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
            </Field>
          </div>
          <Field label="Alasan / Keluhan">
            <Input value={form.reason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Kontrol rutin, konsultasi awal..." />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" loading={loading}>Jadwalkan</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
