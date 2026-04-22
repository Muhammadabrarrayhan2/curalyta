import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button, Field, Input, Avatar, Modal } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDate, computeAge } from '@/lib/format';
import type { PatientProfile as PatientType } from '@/types';

export function PatientProfile() {
  const toast = useToast();
  const { user, refresh } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['patient', 'me'],
    queryFn: async () => {
      const { data } = await api.get<{ patient: PatientType }>('/me/patient/profile');
      return data.patient;
    },
  });

  if (isLoading || !data) {
    return <div className="text-center py-16 text-stone-400">Memuat...</div>;
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={user?.name || ''} size="xl" />
            <div>
              <h2 className="font-display text-2xl text-ink">{user?.name}</h2>
              <div className="text-sm text-stone-500 mt-0.5">
                {computeAge(data.dateOfBirth) ?? '—'} tahun · {data.gender === 'MALE' ? 'Laki-laki' : data.gender === 'FEMALE' ? 'Perempuan' : 'Lainnya'}
                {data.bloodType && ` · Gol. darah ${data.bloodType}`}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPassword(true)}>
              <Icon name="lock" size={14} /> Password
            </Button>
            <Button size="sm" onClick={() => setShowEdit(true)}>
              <Icon name="edit" size={14} /> Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display text-lg text-ink mb-4">Data Diri</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Nama lengkap" value={data.name} />
            <InfoRow label="Tanggal lahir" value={fmtDate(data.dateOfBirth)} />
            <InfoRow label="Alamat" value={data.address || '—'} />
            <InfoRow label="Kontak darurat" value={data.emergencyContact || '—'} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-lg text-ink mb-4">Riwayat Kesehatan</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Golongan darah" value={data.bloodType || '—'} />
            <InfoRow label="Alergi" value={data.allergies || 'Tidak ada'} />
            <InfoRow label="Kondisi kronis" value={data.chronicConditions || 'Tidak ada'} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg text-ink mb-4">Akun</h3>
        <div className="space-y-3 text-sm">
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="Telepon" value={user?.phone || '—'} />
          <InfoRow label="Terdaftar sejak" value={fmtDate(data.createdAt)} />
        </div>
      </div>

      <EditModal
        open={showEdit}
        patient={data}
        onClose={() => setShowEdit(false)}
        onSaved={async () => {
          setShowEdit(false);
          await refetch();
          await refresh();
          toast.success('Profil diperbarui');
        }}
      />

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

function EditModal({ open, patient, onClose, onSaved }: { open: boolean; patient: PatientType; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    address: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: '',
    emergencyContactName: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        address: patient.address || '',
        bloodType: patient.bloodType || '',
        allergies: patient.allergies || '',
        chronicConditions: patient.chronicConditions || '',
        emergencyContact: patient.emergencyContact || '',
        emergencyContactName: patient.emergencyContactName || '',
      });
    }
  }, [open, patient]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      await api.patch('/me/patient/profile', data);
    },
    onSuccess: () => onSaved(),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-display text-xl text-ink">Edit Profil</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3">
          <Field label="Alamat">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Golongan darah">
              <select className="input" value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })}>
                <option value="">—</option>
                <option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
              </select>
            </Field>
            <Field label="Kontak darurat (HP)">
              <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </Field>
          </div>
          <Field label="Nama kontak darurat">
            <Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
          </Field>
          <Field label="Alergi">
            <Input placeholder="Pisahkan dengan koma" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
          </Field>
          <Field label="Kondisi kronis">
            <Input placeholder="Hipertensi, diabetes..." value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Batal</Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>Simpan</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (open) { setForm({ oldPassword: '', newPassword: '', confirm: '' }); setErrors({}); } }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/password', { oldPassword: form.oldPassword, newPassword: form.newPassword });
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
    if (Object.keys(e).length) { setErrors(e); return; }
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-display text-xl text-ink">Ubah Password</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
          <Field label="Password lama" error={errors.oldPassword} required>
            <Input type="password" value={form.oldPassword} error={!!errors.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} />
          </Field>
          <Field label="Password baru" error={errors.newPassword} required hint="Minimal 8 karakter">
            <Input type="password" value={form.newPassword} error={!!errors.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          </Field>
          <Field label="Konfirmasi" error={errors.confirm} required>
            <Input type="password" value={form.confirm} error={!!errors.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Batal</Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>Ubah</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
