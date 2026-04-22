import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Badge, Empty, Avatar } from '@/components/ui';
import { Icon, type IconName } from '@/components/ui/Icon';
import { fmtDate, relativeTime } from '@/lib/format';
import type { AdminStats, User } from '@/types';

export function AdminHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminStats>('/admin/stats');
      return data;
    },
    refetchInterval: 30_000,
  });

  const { data: sysData } = useQuery({
    queryKey: ['admin', 'system'],
    queryFn: async () => {
      const { data } = await api.get<{ system: { env: string; aiEnabled: boolean; aiModel: string | null; uploadLimitMB: number } }>('/admin/system');
      return data.system;
    },
  });

  if (isLoading || !data) return <div className="text-center py-16 text-stone-400">Memuat...</div>;

  const kpis: { label: string; value: number; icon: IconName; tone?: 'warning' }[] = [
    { label: 'Total Pengguna', value: data.stats.totalUsers, icon: 'users' },
    { label: 'Dokter', value: data.stats.totalDoctors, icon: 'stethoscope' },
    { label: 'Pasien', value: data.stats.totalPatients, icon: 'user' },
    { label: 'Menunggu Verifikasi', value: data.stats.pendingVerifications, icon: 'clock', tone: data.stats.pendingVerifications > 0 ? 'warning' : undefined },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${
              k.tone === 'warning' ? 'bg-amber-50 text-clinical-warning' : 'bg-sage-light text-sage-deep'
            }`}>
              <Icon name={k.icon} size={18} />
            </div>
            <div className="number-display text-4xl text-ink leading-none mb-1">{k.value}</div>
            <div className="text-[12px] text-stone-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Pending verifications alert */}
      {data.stats.pendingVerifications > 0 && (
        <Link to="/admin/verifications" className="card p-5 flex items-center justify-between border-l-4 border-l-clinical-warning hover:bg-stone-50/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-clinical-warning flex items-center justify-center">
              <Icon name="verified" size={20} />
            </div>
            <div>
              <div className="font-medium text-ink">Ada {data.stats.pendingVerifications} dokter menunggu verifikasi</div>
              <div className="text-[12.5px] text-stone-500 mt-0.5">Review dan approve registrasi dokter baru</div>
            </div>
          </div>
          <Icon name="arrowRight" size={18} className="text-stone-400" />
        </Link>
      )}

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        {/* Recent signups */}
        <div className="card">
          <div className="p-5 border-b border-stone-100">
            <h3 className="font-display text-lg text-ink">Pendaftaran Terbaru</h3>
            <p className="text-[12px] text-stone-500 mt-0.5">10 akun terakhir</p>
          </div>
          {data.recentSignups.length === 0 ? (
            <Empty icon="users" title="Belum ada pendaftaran" />
          ) : (
            <div className="divide-y divide-stone-50">
              {data.recentSignups.map((u: User) => (
                <div key={u.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <div className="font-medium text-[14px] text-ink">{u.name}</div>
                      <div className="text-[12px] text-stone-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge tone={u.role === 'DOCTOR' ? 'sage' : u.role === 'ADMIN' ? 'ink' : 'info'}>
                      {u.role === 'DOCTOR' ? 'Dokter' : u.role === 'ADMIN' ? 'Admin' : 'Pasien'}
                    </Badge>
                    <div className="text-[11px] text-stone-400 mt-1">{relativeTime(u.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System info */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-display text-lg text-ink mb-4">System Info</h3>
            <div className="space-y-3 text-sm">
              <Row label="Environment">
                <Badge tone={sysData?.env === 'production' ? 'success' : 'info'}>{sysData?.env || '—'}</Badge>
              </Row>
              <Row label="AI Status">
                {sysData?.aiEnabled ? <Badge tone="success">Aktif</Badge> : <Badge tone="default">Tidak aktif</Badge>}
              </Row>
              {sysData?.aiEnabled && <Row label="AI Model"><span className="font-mono text-[12px]">{sysData.aiModel}</span></Row>}
              <Row label="Upload Limit"><span className="font-mono">{sysData?.uploadLimitMB} MB</span></Row>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-lg text-ink mb-4">Aktivitas Platform</h3>
            <div className="space-y-3 text-sm">
              <Row label="Pengguna Aktif">
                <span className="number-display text-lg text-ink">{data.stats.activeUsers}</span>
              </Row>
              <Row label="Total Observasi">
                <span className="number-display text-lg text-ink">{data.stats.totalObservations}</span>
              </Row>
              <Row label="Total Appointment">
                <span className="number-display text-lg text-ink">{data.stats.totalAppointments}</span>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-stone-500">{label}</span>
      {children}
    </div>
  );
}
