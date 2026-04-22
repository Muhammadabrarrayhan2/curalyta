import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { Avatar, Badge, Button, Empty, Field, Modal, Tabs } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { fmtDate } from '@/lib/format';
import type { DoctorProfile } from '@/types';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

export function AdminVerifications() {
  const toast = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>('PENDING');
  const [selected, setSelected] = useState<DoctorProfile | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verifications', tab],
    queryFn: async () => {
      const { data } = await api.get<{ doctors: DoctorProfile[] }>(`/admin/verifications?status=${tab}`);
      return data.doctors;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      await api.post(`/admin/verifications/${doctorId}`, { approve: true });
    },
    onSuccess: () => {
      toast.success('Dokter disetujui');
      qc.invalidateQueries({ queryKey: ['admin'] });
      setSelected(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ doctorId, reason }: { doctorId: string; reason: string }) => {
      await api.post(`/admin/verifications/${doctorId}`, { approve: false, reason });
    },
    onSuccess: () => {
      toast.success('Dokter ditolak');
      qc.invalidateQueries({ queryKey: ['admin'] });
      setRejectOpen(false);
      setRejectReason('');
      setSelected(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const tabs: { id: Status; label: string }[] = [
    { id: 'PENDING', label: 'Menunggu' },
    { id: 'APPROVED', label: 'Disetujui' },
    { id: 'REJECTED', label: 'Ditolak' },
  ];

  return (
    <div className="space-y-5">
      <Tabs tabs={tabs.map((t) => ({ ...t, count: tab === t.id ? data?.length : undefined }))} active={tab} onChange={(id) => setTab(id as Status)} />

      {isLoading ? (
        <div className="text-center py-16 text-stone-400">Memuat...</div>
      ) : !data || data.length === 0 ? (
        <div className="card">
          <Empty icon="verified" title={tab === 'PENDING' ? 'Tidak ada dokter menunggu verifikasi' : tab === 'APPROVED' ? 'Belum ada dokter disetujui' : 'Belum ada dokter ditolak'} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {data.map((d, i) => (
            <div key={d.id} className={`p-5 ${i > 0 ? 'border-t border-stone-50' : ''} hover:bg-stone-50/50 transition-colors cursor-pointer`} onClick={() => setSelected(d)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar name={d.user?.name || '?'} size="md" />
                  <div>
                    <div className="font-medium text-ink">{d.user?.name}</div>
                    <div className="text-[13px] text-stone-500 mt-0.5">{d.specialization} · {d.experience} thn</div>
                    <div className="text-[12px] text-stone-400 mt-0.5">{d.institution}</div>
                    <div className="flex items-center gap-3 mt-2 text-[11.5px] text-stone-500">
                      <span className="flex items-center gap-1"><Icon name="mail" size={12} /> {d.user?.email}</span>
                      {d.user?.phone && <span className="flex items-center gap-1"><Icon name="phone" size={12} /> {d.user.phone}</span>}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1.5">STR: <span className="font-mono text-ink">{d.licenseNumber}</span>{d.sipNumber && <> · SIP: <span className="font-mono text-ink">{d.sipNumber}</span></>}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge tone={d.verificationStatus === 'APPROVED' ? 'success' : d.verificationStatus === 'PENDING' ? 'warning' : 'danger'}>
                    {d.verificationStatus === 'APPROVED' ? 'Disetujui' : d.verificationStatus === 'PENDING' ? 'Menunggu' : 'Ditolak'}
                  </Badge>
                  <div className="text-[11px] text-stone-400 mt-1">Daftar {fmtDate(d.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} size="lg">
        {selected && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <Avatar name={selected.user?.name || '?'} size="lg" />
                <div>
                  <h3 className="font-display text-xl text-ink">{selected.user?.name}</h3>
                  <div className="text-sm text-stone-500 mt-0.5">{selected.specialization}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" size={18} /></button>
            </div>

            <div className="space-y-4">
              <Section title="Kontak">
                <InfoRow label="Email" value={selected.user?.email || '—'} />
                <InfoRow label="Telepon" value={selected.user?.phone || '—'} />
              </Section>

              <Section title="Kredensial Profesi">
                <InfoRow label="Nomor STR" value={selected.licenseNumber} mono />
                {selected.sipNumber && <InfoRow label="Nomor SIP" value={selected.sipNumber} mono />}
                <InfoRow label="Pengalaman" value={`${selected.experience} tahun`} />
                <InfoRow label="Institusi" value={selected.institution} />
                {selected.schedule && <InfoRow label="Jadwal" value={selected.schedule} />}
              </Section>

              {selected.bio && (
                <Section title="Bio">
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.bio}</p>
                </Section>
              )}

              {selected.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-clinical-danger">
                  <div className="font-medium mb-1">Alasan penolakan sebelumnya:</div>
                  {selected.rejectionReason}
                </div>
              )}
            </div>

            {selected.verificationStatus === 'PENDING' && (
              <div className="flex gap-2 pt-5 mt-5 border-t border-stone-100">
                <Button variant="danger" className="flex-1" onClick={() => setRejectOpen(true)}>
                  <Icon name="x" size={14} /> Tolak
                </Button>
                <Button className="flex-1" onClick={() => approveMutation.mutate(selected.id)} loading={approveMutation.isPending}>
                  <Icon name="check" size={14} /> Setujui
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} size="sm">
        <div className="p-6">
          <h3 className="font-display text-xl text-ink mb-3">Tolak Verifikasi</h3>
          <p className="text-sm text-stone-500 mb-4">Alasan ini akan dikirim sebagai notifikasi ke dokter.</p>
          <Field label="Alasan penolakan" required>
            <textarea
              rows={4}
              className="input resize-none"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Misalnya: Nomor STR tidak valid, dokumen tidak lengkap, ..."
            />
          </Field>
          <div className="flex gap-2 mt-5">
            <Button variant="ghost" onClick={() => setRejectOpen(false)} className="flex-1">Batal</Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={!rejectReason.trim()}
              loading={rejectMutation.isPending}
              onClick={() => selected && rejectMutation.mutate({ doctorId: selected.id, reason: rejectReason.trim() })}
            >
              Tolak
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-50/50 rounded-lg p-4">
      <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-2.5">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`text-ink text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
