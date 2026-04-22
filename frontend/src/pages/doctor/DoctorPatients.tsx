import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Avatar, Badge, Button, Empty, Field, Input, Modal, Spinner } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { computeAge, genderLabel, newsBadgeTone, relativeTime } from '@/lib/format';
import type { PatientProfile, Gender } from '@/types';

interface PatientList {
  data: PatientProfile[];
  pagination: { total: number; page: number; pageSize: number };
}

export function DoctorPatients() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery<PatientList>({
    queryKey: ['patients', search],
    queryFn: async () =>
      (await api.get<PatientList>('/patients', { params: { search: search || undefined } })).data,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            className="pl-10"
            placeholder="Cari pasien berdasarkan nama atau kondisi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={14} /> Tambah pasien
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : !data || data.data.length === 0 ? (
        <div className="card">
          <Empty
            icon="users"
            title={search ? 'Tidak ditemukan' : 'Belum ada pasien'}
            description={search ? `Tidak ada pasien cocok dengan "${search}"` : 'Tambahkan pasien pertama Anda untuk memulai.'}
            action={!search ? <Button size="sm" onClick={() => setShowAdd(true)}><Icon name="plus" size={14} /> Tambah pasien</Button> : undefined}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(200px,1.5fr)_1fr_100px_90px_140px_40px] px-5 py-3 border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
            <div>Nama</div>
            <div>Kondisi</div>
            <div>Usia</div>
            <div className="text-center">NEWS2</div>
            <div>Vitals Terakhir</div>
            <div></div>
          </div>
          <div className="divide-y divide-stone-50">
            {data.data.map((p) => (
              <Link
                key={p.id}
                to={`/doctor/patients/${p.id}`}
                className="block px-5 py-3 hover:bg-stone-50/50 transition-colors grid md:grid-cols-[minmax(200px,1.5fr)_1fr_100px_90px_140px_40px] gap-3 items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0">
                    <div className="font-medium text-[14px] text-ink truncate">{p.name}</div>
                    <div className="text-[12px] text-stone-500 truncate">
                      {genderLabel(p.gender)}
                      {p.bloodType ? ` · ${p.bloodType}` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-[13px] text-stone-500 truncate">{p.chronicConditions || '—'}</div>
                <div className="text-[13px] text-ink font-mono">{computeAge(p.dateOfBirth)} th</div>
                <div className="flex justify-center">
                  {p.news2 ? (
                    <Badge tone={newsBadgeTone(p.news2.level)}>{p.news2.score}</Badge>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </div>
                <div className="text-[12px] text-stone-500">
                  {p.latestVitals ? relativeTime(p.latestVitals.date) : '—'}
                </div>
                <div><Icon name="chevronRight" size={16} className="text-stone-300" /></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <AddPatientModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function AddPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!form.name) e.name = 'Nama wajib';
    if (!form.dateOfBirth) e.dateOfBirth = 'Tanggal lahir wajib';
    if (!form.gender) e.gender = 'Pilih jenis kelamin';
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      await api.post('/patients', {
        name: form.name,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as Gender,
        address: form.address || null,
        bloodType: form.bloodType || null,
        allergies: form.allergies || null,
        chronicConditions: form.chronicConditions || null,
        emergencyContact: form.emergencyContact || null,
      });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
      toast.success('Pasien ditambahkan');
      setForm({});
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menambah pasien';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl text-ink">Tambah Pasien</h2>
            <p className="text-[12.5px] text-stone-500 mt-0.5">Daftarkan pasien baru ke praktik Anda</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
          <Field label="Nama lengkap" required error={errors.name}>
            <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} error={!!errors.name} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tanggal lahir" required error={errors.dateOfBirth}>
              <Input type="date" value={form.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} error={!!errors.dateOfBirth} max={new Date().toISOString().split('T')[0]} />
            </Field>
            <Field label="Jenis kelamin" required error={errors.gender}>
              <select className={`input ${errors.gender ? 'error' : ''}`} value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
                <option value="">—</option>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </Field>
            <Field label="Gol. darah">
              <select className="input" value={form.bloodType || ''} onChange={(e) => set('bloodType', e.target.value)}>
                <option value="">—</option>
                <option>A</option><option>B</option><option>AB</option><option>O</option>
              </select>
            </Field>
          </div>
          <Field label="Alamat">
            <Input value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Alergi">
              <Input value={form.allergies || ''} onChange={(e) => set('allergies', e.target.value)} placeholder="Penisilin, seafood..." />
            </Field>
            <Field label="Kontak darurat">
              <Input value={form.emergencyContact || ''} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="No. HP keluarga" />
            </Field>
          </div>
          <Field label="Kondisi kronis" hint="Pisahkan dengan koma">
            <Input value={form.chronicConditions || ''} onChange={(e) => set('chronicConditions', e.target.value)} placeholder="Hipertensi, diabetes..." />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" loading={loading}>Tambah Pasien</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
