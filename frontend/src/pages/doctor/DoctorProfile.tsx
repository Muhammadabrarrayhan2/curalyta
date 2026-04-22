import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button, Field, Input, Badge, Avatar, Modal } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDate } from '@/lib/format';
import type { DoctorProfile as DoctorProfileType } from '@/types';

export function DoctorProfile() {
  const toast = useToast();
  const { user, refresh } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor', 'me'],
    queryFn: async () => {
      const { data } = await api.get<{ doctor: DoctorProfileType }>('/doctors/me');
      return data.doctor;
    },
  });

  if (isLoading || !data) {
    return <div className="text-center py-16 text-stone-400">Memuat...</div>;
  }

  const statusTone = data.verificationStatus === 'APPROVED' ? 'success' : data.verificationStatus === 'PENDING' ? 'warning' : 'danger';
  const statusLabel = data.verificationStatus === 'APPROVED' ? 'Terverifikasi' : data.verificationStatus === 'PENDING' ? 'Menunggu verifikasi' : 'Ditolak';

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={user?.name || ''} size="xl" />
            <div>
              <h2 className="font-display text-2xl text-ink">{user?.name}</h2>
              <div className="text-sm text-stone-500 mt-0.5">{data.specialization}</div>
              <div className="flex items-center gap-2 mt-3">
                <Badge tone={statusTone}>
                  <Icon name={data.verificationStatus === 'APPROVED' ? 'verified' : 'clock'} size={12} />
                  {statusLabel}
                </Badge>
                {data.verifiedAt && <span className="text-[11px] text-stone-400">Diverifikasi {fmtDate(data.verifiedAt)}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPassword(true)}>
              <Icon name="lock" size={14} /> Ubah password
            </Button>
            <Button size="sm" onClick={() => setShowEdit(true)}>
              <Icon name="edit" size={14} /> Edit profil
            </Button>
          </div>
        </div>

        {data.verificationStatus === 'REJECTED' && data.rejectionReason && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-clinical-danger">
              <div className="font-medium mb-1">Alasan penolakan verifikasi:</div>
              {data.rejectionReason}
            </div>
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display text-lg text-ink mb-4">Data Profesi</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Spesialisasi" value={data.specialization} />
            <InfoRow label="Nomor STR" value={data.licenseNumber} mono />
            <InfoRow label="Nomor SIP" value={data.sipNumber || '—'} mono />
            <InfoRow label="Pengalaman" value={`${data.experience} tahun`} />
            <InfoRow label="Institusi" value={data.institution} />
            {data.schedule && <InfoRow label="Jadwal" value={data.schedule} />}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-lg text-ink mb-4">Akun</h3>
          <div className="space-y-3 text-sm">
            <InfoRow label="Email" value={user?.email || '—'} />
            <InfoRow label="Telepon" value={user?.phone || '—'} />
            <InfoRow label="Terdaftar" value={fmtDate(data.createdAt)} />
            {user?.lastLoginAt && <InfoRow label="Login terakhir" value={fmtDate(user.lastLoginAt)} />}
          </div>

          {data.stats && (
            <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-3 gap-3">
              <Stat label="Pasien" value={data.stats.patientCount} />
              <Stat label="Appointment" value={data.stats.appointmentCount} />
              <Stat label="Tugas" value={data.stats.taskCount} />
            </div>
          )}
        </div>
      </div>

      {data.bio && (
        <div className="card p-5">
          <h3 className="font-display text-lg text-ink mb-2">Bio</h3>
          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{data.bio}</p>
        </div>
      )}

      <EditProfileModal
        open={showEdit}
        doctor={data}
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

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{label}</span>
      <span className={`text-ink text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="number-display text-2xl text-ink">{value}</div>
      <div className="text-[11px] text-stone-400 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function EditProfileModal({ open, doctor, onClose, onSaved }: { open: boolean; doctor: DoctorProfileType; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    specialization: '',
    sipNumber: '',
    experience: 0,
    institution: '',
    bio: '',
    schedule: '',
    phone: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        specialization: doctor.specialization || '',
        sipNumber: doctor.sipNumber || '',
        experience: doctor.experience || 0,
        institution: doctor.institution || '',
        bio: doctor.bio || '',
        schedule: doctor.schedule || '',
        phone: doctor.user?.phone || '',
      });
    }
  }, [open, doctor]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      await api.patch('/doctors/me', data);
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
          <Field label="Spesialisasi">
            <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomor SIP">
              <Input value={form.sipNumber} onChange={(e) => setForm({ ...form, sipNumber: e.target.value })} />
            </Field>
            <Field label="Pengalaman (tahun)">
              <Input type="number" min={0} max={70} value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Institusi">
            <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
          </Field>
          <Field label="Telepon">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Jadwal praktik">
            <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
          </Field>
          <Field label="Bio">
            <textarea rows={3} className="input resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
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
    if (!form.oldPassword) e.oldPassword = 'Password lama wajib';
    if (!form.newPassword) e.newPassword = 'Password baru wajib';
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
