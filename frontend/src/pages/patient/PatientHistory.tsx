import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge, Empty, Tabs } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { fmtDate, fmtDateTime } from '@/lib/format';
import type { Observation, VitalSign } from '@/types';

export function PatientHistory() {
  const [tab, setTab] = useState('observations');

  const { data: obsData, isLoading: obsLoading } = useQuery({
    queryKey: ['me', 'observations'],
    queryFn: async () => {
      const { data } = await api.get<{ observations: (Observation & { doctor: { user: { name: string } } })[] }>('/me/observations');
      return data.observations;
    },
  });

  const { data: vitalsData, isLoading: vitalsLoading } = useQuery({
    queryKey: ['me', 'vitals'],
    queryFn: async () => {
      const { data } = await api.get<{ vitals: VitalSign[] }>('/me/vitals');
      return data.vitals;
    },
  });

  return (
    <div className="space-y-5">
      <Tabs
        tabs={[
          { id: 'observations', label: 'Catatan Medis', count: obsData?.length },
          { id: 'vitals', label: 'Vital Signs', count: vitalsData?.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'observations' && (
        obsLoading ? (
          <div className="text-center py-16 text-stone-400">Memuat...</div>
        ) : !obsData || obsData.length === 0 ? (
          <div className="card">
            <Empty icon="fileText" title="Belum ada catatan medis" description="Catatan dari dokter akan muncul di sini setelah konsultasi." />
          </div>
        ) : (
          <div className="space-y-3">
            {obsData.map((o) => (
              <div key={o.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12px] text-stone-500">
                    <Icon name="clock" size={12} className="inline mr-1" />
                    {fmtDateTime(o.date)}
                  </div>
                  <div className="text-[12px] text-stone-500">dr. {o.doctor.user.name}</div>
                </div>
                <div className="space-y-3">
                  {o.subjective && <SoapBlock label="Keluhan / Subjective" content={o.subjective} />}
                  {o.objective && <SoapBlock label="Pemeriksaan / Objective" content={o.objective} />}
                  {o.assessment && <SoapBlock label="Assessment" content={o.assessment} />}
                  {o.plan && <SoapBlock label="Rencana / Plan" content={o.plan} />}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'vitals' && (
        vitalsLoading ? (
          <div className="text-center py-16 text-stone-400">Memuat...</div>
        ) : !vitalsData || vitalsData.length === 0 ? (
          <div className="card">
            <Empty icon="activity" title="Belum ada data vital" description="Vital signs yang dicatat dokter akan muncul di sini." />
          </div>
        ) : (
          <div className="card overflow-auto">
            <div className="grid grid-cols-[1fr_70px_90px_70px_70px_70px_70px] min-w-[620px] px-4 py-3 border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
              <div>Tanggal</div>
              <div>Nadi</div>
              <div>TD</div>
              <div>Suhu</div>
              <div>SpO₂</div>
              <div>RR</div>
              <div>NEWS2</div>
            </div>
            {vitalsData.map((v) => (
              <div key={v.id} className="grid grid-cols-[1fr_70px_90px_70px_70px_70px_70px] min-w-[620px] px-4 py-3 border-b border-stone-50 last:border-0 text-[13px] items-center">
                <div className="font-medium">{fmtDate(v.date)}</div>
                <div className="font-mono">{v.heartRate ?? '—'}</div>
                <div className="font-mono">{v.systolicBP ? `${v.systolicBP}/${v.diastolicBP ?? '—'}` : '—'}</div>
                <div className="font-mono">{v.temperature ?? '—'}</div>
                <div className="font-mono">{v.oxygenSaturation ?? '—'}</div>
                <div className="font-mono">{v.respirationRate ?? '—'}</div>
                <div>
                  {v.news2Score != null ? (
                    <Badge tone={v.news2Score >= 5 ? 'danger' : v.news2Score >= 3 ? 'warning' : 'success'}>{v.news2Score}</Badge>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function SoapBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-sage-deep uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">{content}</div>
    </div>
  );
}
