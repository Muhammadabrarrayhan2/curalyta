import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Badge, Avatar, Empty, Button, Spinner } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { computeAge, genderLabel, newsBadgeTone, newsLabel, relativeTime, fmtDateTime } from '@/lib/format';
import type { DoctorDashboard, TaskStatus } from '@/types';

export function DoctorHome() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<DoctorDashboard>({
    queryKey: ['doctor-dashboard'],
    queryFn: async () => (await api.get<DoctorDashboard>('/dashboard/doctor')).data,
    refetchInterval: 60_000,
  });

  async function toggleTaskDone(id: string, currentStatus: TaskStatus) {
    const nextStatus: TaskStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
    await api.patch(`/tasks/${id}`, { status: nextStatus });
    queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        <Spinner size={24} />
      </div>
    );
  }

  if (!data) return null;

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-display text-3xl text-ink">
            {greeting}, dr. <span className="font-serif-italic">{user?.name.split(' ')[0]}</span>
          </div>
          <div className="text-sm text-stone-500 mt-1">
            Hari ini {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Pasien" value={data.stats.totalPatients} icon="users" />
        <KpiCard label="Appointment Hari Ini" value={data.stats.appointmentsToday} icon="calendar" />
        <KpiCard label="Tugas Aktif" value={data.stats.pendingTasks} icon="list" />
        <KpiCard
          label="Prioritas Tinggi"
          value={data.stats.highPriorityPatients}
          icon="alert"
          tone={data.stats.highPriorityPatients > 0 ? 'danger' : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        {/* Critical patients */}
        <div className="card">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-ink">Pasien Prioritas</h3>
              <p className="text-[12px] text-stone-500 mt-0.5">Berdasarkan NEWS2 + komorbiditas</p>
            </div>
            <Link to="/doctor/patients" className="text-sm text-stone-500 hover:text-ink">Lihat semua →</Link>
          </div>
          {data.criticalPatients.length === 0 ? (
            <Empty icon="checkCircle" title="Tidak ada pasien prioritas" description="Semua pasien dalam kondisi stabil." />
          ) : (
            <div className="divide-y divide-stone-50">
              {data.criticalPatients.map((p) => (
                <Link
                  key={p.id}
                  to={`/doctor/patients/${p.id}`}
                  className="block p-4 hover:bg-stone-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={p.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium text-[14px] text-ink truncate">{p.name}</div>
                        <div className="text-[12px] text-stone-500 truncate">
                          {computeAge(p.dateOfBirth)} th · {genderLabel(p.gender)}
                          {p.chronicConditions ? ` · ${p.chronicConditions.split(',')[0]}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.news2 && (
                        <>
                          <div className="text-right">
                            <div className="text-[10px] text-stone-400 uppercase tracking-wider">NEWS2</div>
                            <div className="number-display text-xl text-ink leading-none">{p.news2.score}</div>
                          </div>
                          <Badge tone={newsBadgeTone(p.news2.level)}>{newsLabel(p.news2.level)}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-ink">Tugas Hari Ini</h3>
              <p className="text-[12px] text-stone-500 mt-0.5">
                {data.stats.pendingTasks} aktif
                {data.stats.overdueTasks > 0 && ` · ${data.stats.overdueTasks} overdue`}
              </p>
            </div>
            <Link to="/doctor/tasks" className="text-sm text-stone-500 hover:text-ink">Semua →</Link>
          </div>
          {data.tasks.length === 0 ? (
            <Empty
              icon="checkCircle"
              title="Tidak ada tugas"
              action={<Link to="/doctor/tasks"><Button size="sm"><Icon name="plus" size={14} /> Tambah</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-stone-50 max-h-[420px] overflow-auto">
              {data.tasks.map((t) => (
                <div key={t.id} className="p-4 flex items-start gap-3 hover:bg-stone-50/50">
                  <button
                    onClick={() => toggleTaskDone(t.id, t.status)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-2 border-stone-300 hover:border-sage shrink-0 transition-colors"
                    aria-label="Tandai selesai"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] text-ink">{t.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                      {t.dueAt && (
                        <span className="flex items-center gap-1">
                          <Icon name="clock" size={12} /> {fmtDateTime(t.dueAt)}
                        </span>
                      )}
                      {(t.priority === 'HIGH' || t.priority === 'URGENT') && (
                        <Badge tone={t.priority === 'URGENT' ? 'danger' : 'warning'}>
                          {t.priority === 'URGENT' ? 'Urgent' : 'Tinggi'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointments today */}
      {data.appointmentsToday.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-stone-100">
            <h3 className="font-display text-lg text-ink">Jadwal Hari Ini</h3>
          </div>
          <div className="divide-y divide-stone-50">
            {data.appointmentsToday.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-center shrink-0">
                    <div className="number-display text-lg text-ink leading-none">{new Date(a.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[10px] text-stone-400 uppercase mt-0.5">{a.duration}m</div>
                  </div>
                  <div className="h-8 w-px bg-stone-100" />
                  {a.patient && (
                    <div>
                      <div className="font-medium text-ink text-sm">{a.patient.name}</div>
                      <div className="text-[12px] text-stone-500">{a.reason || 'Konsultasi'}</div>
                    </div>
                  )}
                </div>
                <Badge tone={a.status === 'SCHEDULED' ? 'info' : a.status === 'COMPLETED' ? 'success' : 'default'}>
                  {a.status === 'SCHEDULED' ? 'Terjadwal' : a.status === 'COMPLETED' ? 'Selesai' : a.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent patients */}
      <div className="card">
        <div className="p-5 border-b border-stone-100">
          <h3 className="font-display text-lg text-ink">Aktivitas Pasien Terbaru</h3>
        </div>
        {data.recentPatients.length === 0 ? (
          <Empty icon="users" title="Belum ada pasien" description="Tambahkan pasien pertama untuk memulai." action={<Link to="/doctor/patients"><Button size="sm"><Icon name="plus" size={14} /> Tambah pasien</Button></Link>} />
        ) : (
          <div className="divide-y divide-stone-50">
            {data.recentPatients.map((p) => (
              <Link key={p.id} to={`/doctor/patients/${p.id}`} className="block p-4 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={p.name} />
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate">{p.name}</div>
                      <div className="text-[12px] text-stone-500 truncate">
                        {computeAge(p.dateOfBirth)} th · {genderLabel(p.gender)}
                        {p.latestVitals ? ` · Vitals ${relativeTime(p.latestVitals.date)}` : ' · Belum ada vitals'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.news2 && <Badge tone={newsBadgeTone(p.news2.level)}>NEWS {p.news2.score}</Badge>}
                    <Icon name="chevronRight" size={16} className="text-stone-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: 'users' | 'calendar' | 'list' | 'alert';
  tone?: 'danger';
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            tone === 'danger' ? 'bg-red-50 text-clinical-danger' : 'bg-sage-light text-sage-deep'
          }`}
        >
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div className="number-display text-4xl text-ink leading-none mb-1">{value}</div>
      <div className="text-[12px] text-stone-500">{label}</div>
    </div>
  );
}
