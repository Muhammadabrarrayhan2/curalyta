import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge, Empty } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { fmtDate, fmtDateTime, relativeTime, computeAge } from '@/lib/format';
import type { PatientDashboard } from '@/types';
import { useAuth } from '@/store/auth';

export function PatientHome() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'patient'],
    queryFn: async () => {
      const { data } = await api.get<PatientDashboard>('/dashboard/patient');
      return data;
    },
  });

  if (isLoading || !data) {
    return <div className="text-center py-16 text-stone-400">Memuat...</div>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <div className="font-display text-3xl text-ink">
          {greeting}, <span className="font-serif-italic">{user?.name.split(' ')[0]}</span>
        </div>
        <div className="text-sm text-stone-500 mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Doctor info */}
      {data.patient.doctor ? (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-1">Dokter Anda</div>
              <div className="font-display text-xl text-ink">
                {data.patient.doctor.user?.name || 'Dokter'}
              </div>
              <div className="text-sm text-stone-500 mt-0.5">{data.patient.doctor.specialization}</div>
              <div className="text-[12px] text-stone-400 mt-0.5">{data.patient.doctor.institution}</div>
            </div>
            <Icon name="stethoscope" size={32} className="text-sage" />
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <Empty
            icon="stethoscope"
            title="Belum terhubung dengan dokter"
            description="Dokter akan menghubungkan akun Anda setelah kunjungan pertama."
          />
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-1">Total Observasi</div>
          <div className="number-display text-3xl text-ink">{data.stats.observationCount}</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-1">Appointment Mendatang</div>
          <div className="number-display text-3xl text-ink">{data.stats.upcomingAppointments}</div>
        </div>
      </div>

      {/* Latest vitals */}
      {data.latestVitals && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg text-ink">Vital Signs Terakhir</h3>
              <p className="text-[12px] text-stone-500">Dicatat {relativeTime(data.latestVitals.date)}</p>
            </div>
            {data.latestVitals.news2Score != null && (
              <Badge tone={data.latestVitals.news2Score >= 5 ? 'danger' : data.latestVitals.news2Score >= 3 ? 'warning' : 'success'}>
                NEWS2 {data.latestVitals.news2Score}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Nadi', value: data.latestVitals.heartRate, unit: 'bpm', icon: 'heart' as const },
              { label: 'Tekanan', value: data.latestVitals.systolicBP ? `${data.latestVitals.systolicBP}/${data.latestVitals.diastolicBP ?? '—'}` : null, unit: 'mmHg', icon: 'activity' as const },
              { label: 'Suhu', value: data.latestVitals.temperature, unit: '°C', icon: 'thermometer' as const },
              { label: 'SpO₂', value: data.latestVitals.oxygenSaturation, unit: '%', icon: 'activity' as const },
              { label: 'Respirasi', value: data.latestVitals.respirationRate, unit: '/min', icon: 'activity' as const },
            ].map((v) => (
              <div key={v.label} className="p-3 rounded-lg bg-stone-50">
                <div className="flex items-center gap-1.5 text-[10px] text-stone-400 uppercase tracking-wider mb-1">
                  <Icon name={v.icon} size={10} /> {v.label}
                </div>
                <div className="number-display text-lg text-ink">
                  {v.value != null ? <>{v.value}<span className="text-[10px] text-stone-400 ml-0.5">{v.unit}</span></> : <span className="text-stone-300">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming appointments */}
      <div className="card">
        <div className="p-5 border-b border-stone-100">
          <h3 className="font-display text-lg text-ink">Appointment Mendatang</h3>
        </div>
        {data.upcomingAppointments.length === 0 ? (
          <Empty icon="calendar" title="Tidak ada appointment" description="Belum ada jadwal yang ditentukan oleh dokter Anda." />
        ) : (
          <div className="divide-y divide-stone-50">
            {data.upcomingAppointments.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sage-light text-sage-deep flex items-center justify-center shrink-0">
                    <Icon name="calendar" size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-[14px] text-ink">{fmtDateTime(a.date)}</div>
                    {a.reason && <div className="text-[12px] text-stone-500">{a.reason}</div>}
                    {a.doctor && <div className="text-[11px] text-stone-400">dengan {a.doctor.user.name}</div>}
                  </div>
                </div>
                <Badge tone="info">{a.duration} menit</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent observations */}
      <div className="card">
        <div className="p-5 border-b border-stone-100">
          <h3 className="font-display text-lg text-ink">Catatan Medis Terbaru</h3>
        </div>
        {data.recentObservations.length === 0 ? (
          <Empty icon="fileText" title="Belum ada catatan" description="Catatan dari dokter akan muncul di sini." />
        ) : (
          <div className="divide-y divide-stone-50">
            {data.recentObservations.map((o) => (
              <div key={o.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] text-stone-400">
                    {fmtDate(o.date)} · dr. {o.doctor.user.name}
                  </div>
                </div>
                {o.subjective && (
                  <div className="text-[13px] text-stone-600 line-clamp-2">{o.subjective}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient info card */}
      <div className="card p-5">
        <h3 className="font-display text-lg text-ink mb-4">Data Pasien</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="Nama" value={data.patient.name} />
          <InfoRow label="Usia" value={computeAge(data.patient.dateOfBirth) != null ? `${computeAge(data.patient.dateOfBirth)} tahun` : '—'} />
          <InfoRow label="Jenis kelamin" value={data.patient.gender === 'MALE' ? 'Laki-laki' : data.patient.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'} />
          <InfoRow label="Golongan darah" value={data.patient.bloodType || '—'} />
          {data.patient.allergies && <InfoRow label="Alergi" value={data.patient.allergies} />}
          {data.patient.chronicConditions && <InfoRow label="Kondisi kronis" value={data.patient.chronicConditions} />}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-ink">{value}</div>
    </div>
  );
}
