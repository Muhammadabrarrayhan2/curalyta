import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { Avatar, Badge, Button, Empty, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDate } from '@/lib/format';
import type { User, UserRole } from '@/types';
import { useAuth } from '@/store/auth';

interface AdminUser extends User {
  doctor?: { verificationStatus: string; specialization: string } | null;
  emailVerified?: boolean;
}

export function AdminUsers() {
  const toast = useToast();
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, roleFilter, activeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { pageSize: '100' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.active = activeFilter;
      const { data } = await api.get<{ users: AdminUser[]; pagination: { total: number } }>('/admin/users', { params });
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await api.post(`/admin/users/${id}/active`, { active });
    },
    onSuccess: () => {
      toast.success('Status akun diperbarui');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input className="pl-10" placeholder="Cari nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input !w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}>
          <option value="">Semua role</option>
          <option value="DOCTOR">Dokter</option>
          <option value="PATIENT">Pasien</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className="input !w-auto" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}>
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-stone-400">Memuat...</div>
      ) : !data || data.users.length === 0 ? (
        <div className="card"><Empty icon="users" title="Tidak ada pengguna ditemukan" /></div>
      ) : (
        <div className="card overflow-auto">
          <div className="grid grid-cols-[minmax(200px,1.5fr)_100px_minmax(180px,1fr)_100px_130px_100px] min-w-[800px] px-5 py-3 border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
            <div>Nama / Email</div><div>Role</div><div>Detail</div><div>Status</div><div>Terdaftar</div><div></div>
          </div>
          <div className="divide-y divide-stone-50">
            {data.users.map((u) => (
              <div key={u.id} className="grid grid-cols-[minmax(200px,1.5fr)_100px_minmax(180px,1fr)_100px_130px_100px] min-w-[800px] px-5 py-3 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0">
                    <div className="font-medium text-[13.5px] text-ink truncate">{u.name}</div>
                    <div className="text-[11.5px] text-stone-500 truncate">{u.email}</div>
                  </div>
                </div>
                <div>
                  <Badge tone={u.role === 'DOCTOR' ? 'sage' : u.role === 'ADMIN' ? 'ink' : 'info'}>
                    {u.role === 'DOCTOR' ? 'Dokter' : u.role === 'ADMIN' ? 'Admin' : 'Pasien'}
                  </Badge>
                </div>
                <div className="text-[12px] text-stone-500 truncate">
                  {u.role === 'DOCTOR' && u.doctor ? (
                    <>{u.doctor.specialization} · <Badge tone={u.doctor.verificationStatus === 'APPROVED' ? 'success' : u.doctor.verificationStatus === 'PENDING' ? 'warning' : 'danger'}>{u.doctor.verificationStatus}</Badge></>
                  ) : (
                    u.phone || '—'
                  )}
                </div>
                <div>
                  <Badge tone={u.active ? 'success' : 'default'}>{u.active ? 'Aktif' : 'Nonaktif'}</Badge>
                </div>
                <div className="text-[11.5px] text-stone-500">{fmtDate(u.createdAt)}</div>
                <div>
                  {u.id !== currentUser?.id && (
                    <Button
                      variant={u.active ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => toggleActive.mutate({ id: u.id, active: !u.active })}
                      disabled={toggleActive.isPending}
                    >
                      {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-stone-100 text-[12px] text-stone-500">
            Total: <span className="font-mono text-ink">{data.pagination.total}</span> pengguna
          </div>
        </div>
      )}
    </div>
  );
}
