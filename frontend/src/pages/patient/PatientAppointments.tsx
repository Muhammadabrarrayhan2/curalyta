import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge, Empty } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { fmtDateTime } from '@/lib/format';
import type { Appointment } from '@/types';

export function PatientAppointments() {
  const { data, isLoading } = useQuery({
    queryKey: ['me', 'appointments'],
    queryFn: async () => {
      const { data } = await api.get<{ appointments: Appointment[] }>('/me/appointments');
      return data.appointments;
    },
  });

  if (isLoading) return <div className="text-center py-16 text-stone-400">Memuat...</div>;

  const now = Date.now();
  const upcoming = (data || []).filter((a) => new Date(a.date).getTime() >= now);
  const past = (data || []).filter((a) => new Date(a.date).getTime() < now);

  const statusTone = (s: string) => {
    if (s === 'COMPLETED') return 'success';
    if (s === 'CANCELLED') return 'danger';
    if (s === 'NO_SHOW') return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-ink mb-3">Mendatang ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="card"><Empty icon="calendar" title="Belum ada appointment mendatang" description="Dokter akan menjadwalkan appointment untuk Anda bila diperlukan." /></div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} statusTone={statusTone(a.status)} />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-ink mb-3">Riwayat ({past.length})</h2>
          <div className="space-y-3">
            {past.map((a) => (
              <AppointmentCard key={a.id} appointment={a} statusTone={statusTone(a.status)} muted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, statusTone, muted }: { appointment: Appointment; statusTone: 'success' | 'danger' | 'warning' | 'info'; muted?: boolean }) {
  return (
    <div className={`card p-5 ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-sage-light text-sage-deep flex items-center justify-center shrink-0">
            <Icon name="calendar" size={20} />
          </div>
          <div>
            <div className="font-medium text-[15px] text-ink">{fmtDateTime(appointment.date)}</div>
            <div className="text-[12px] text-stone-500 mt-0.5">{appointment.duration} menit</div>
            {appointment.reason && <div className="text-[13px] text-stone-600 mt-2">{appointment.reason}</div>}
            {appointment.notes && <div className="text-[12px] text-stone-500 mt-1 italic">{appointment.notes}</div>}
            {appointment.doctor && (
              <div className="text-[12px] text-stone-400 mt-2">dengan {appointment.doctor.user.name}</div>
            )}
          </div>
        </div>
        <Badge tone={statusTone}>
          {appointment.status === 'SCHEDULED' ? 'Terjadwal' : appointment.status === 'COMPLETED' ? 'Selesai' : appointment.status === 'CANCELLED' ? 'Dibatalkan' : 'Tidak hadir'}
        </Badge>
      </div>
    </div>
  );
}
