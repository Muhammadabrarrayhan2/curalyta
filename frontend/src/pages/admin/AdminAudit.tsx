import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge, Empty } from '@/components/ui';
import { fmtDateTime } from '@/lib/format';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  ip: string | null;
  createdAt: string;
  user: { email: string; name: string; role: string } | null;
}

const ACTION_TONE: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  login: 'success',
  logout: 'info',
  register: 'info',
  password_change: 'warning',
  doctor_approved: 'success',
  doctor_rejected: 'danger',
  user_activated: 'success',
  user_deactivated: 'warning',
};

export function AdminAudit() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => {
      const { data } = await api.get<{ logs: AuditLog[] }>('/admin/audit?limit=200');
      return data.logs;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="text-center py-16 text-stone-400">Memuat...</div>;

  if (!data || data.length === 0) {
    return <div className="card"><Empty icon="fileText" title="Belum ada log aktivitas" /></div>;
  }

  return (
    <div className="card overflow-auto">
      <div className="grid grid-cols-[180px_180px_minmax(200px,1fr)_150px_100px] min-w-[800px] px-5 py-3 border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
        <div>Waktu</div><div>Pengguna</div><div>Aksi</div><div>Entity</div><div>IP</div>
      </div>
      <div className="divide-y divide-stone-50">
        {data.map((log) => (
          <div key={log.id} className="grid grid-cols-[180px_180px_minmax(200px,1fr)_150px_100px] min-w-[800px] px-5 py-3 items-center text-[13px]">
            <div className="font-mono text-[11.5px] text-stone-500">{fmtDateTime(log.createdAt)}</div>
            <div className="min-w-0">
              {log.user ? (
                <>
                  <div className="font-medium text-ink truncate">{log.user.name}</div>
                  <div className="text-[11px] text-stone-400 truncate">{log.user.email}</div>
                </>
              ) : (
                <span className="text-stone-400 italic">system</span>
              )}
            </div>
            <div>
              <Badge tone={ACTION_TONE[log.action] || 'default'}>{log.action}</Badge>
            </div>
            <div className="text-[11.5px] text-stone-500 font-mono truncate">
              {log.entity ? `${log.entity}${log.entityId ? `:${log.entityId.slice(0, 8)}` : ''}` : '—'}
            </div>
            <div className="text-[11.5px] text-stone-400 font-mono truncate">{log.ip || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
