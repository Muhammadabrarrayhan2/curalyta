import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button, Field, Input, Avatar, Modal, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDate } from '@/lib/format';

export function AdminProfile() {
  const toast = useToast();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={user.name} size="xl" />
            <div>
              <h2 className="font-display text-2xl text-ink">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge tone="ink">
                  <Icon name="shield" size={12} /> Administrator
                </Badge>
              </div>
              <div className="text-sm text-stone-500 mt-2">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowPassword(true)}>
            <Icon name="lock" size={14} /> Ubah password
          </Button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg text-ink mb-4">Informasi Akun</h3>
        <div className="space-y-3 text-sm">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Telepon" value={user.phone || '—'} />
          <InfoRow label="Role" value="Administrator" />
          <InfoRow label="Status" value={user.active ? 'Aktif' : 'Nonaktif'} />
          <InfoRow label="Terdaftar" value={fmtDate(user.createdAt)} />
          {user.lastLoginAt && <InfoRow label="Login terakhir" value={fmtDate(user.lastLoginAt)} />}
        </div>
      </div>

      <div className="card p-5 bg-amber-50/40 border-amber-100">
        <div className="flex items-start gap-3">
          <Icon name="shield" size={20} className="text-clinical-warning shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-ink text-sm">Keamanan Akun Administrator</div>
            <p className="text-[12.5px] text-stone-600 leading-relaxed mt-1">
              Akun administrator memiliki akses penuh ke seluruh sistem. Gunakan password kuat, jangan bagikan kredensial, dan aktifkan otentikasi dua faktor saat tersedia di versi mendatang.
            </p>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={showPassword}
        onClose={() => setShowPassword(false)}
        onSaved={() => {
          setShowPassword(false);
          toast.success('Password berhasil diubah');
        }}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className="text-ink text-right">{value}</span>
    </div>
  );
}

function ChangePasswordModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
    },
    onSuccess: () => onSaved(),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.oldPassword) e.oldPassword = 'Wajib';
    if (!form.newPassword) e.newPassword = 'Wajib';
    else if (form.newPassword.length < 8) e.newPassword = 'Minimal 8 karakter';
    if (form.newPassword !== form.confirm) e.confirm = 'Tidak cocok';
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-display text-xl text-ink">Ubah Password Admin</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50">
            <Icon name="x" size={18} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
          <Field label="Password lama" error={errors.oldPassword} required>
            <Input type="password" value={form.oldPassword} error={!!errors.oldPassword}
                   onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
          </Field>
          <Field label="Password baru" error={errors.newPassword} required hint="Minimal 8 karakter, gunakan kombinasi huruf+angka+simbol">
            <Input type="password" value={form.newPassword} error={!!errors.newPassword}
                   onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          </Field>
          <Field label="Konfirmasi password baru" error={errors.confirm} required>
            <Input type="password" value={form.confirm} error={!!errors.confirm}
                   onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Batal</Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>Ubah Password</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
