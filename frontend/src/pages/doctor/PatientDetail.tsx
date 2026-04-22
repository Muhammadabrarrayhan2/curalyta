import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api, getErrorMessage } from '@/lib/api';
import { Avatar, Badge, Button, Empty, Field, Input, Modal, Tabs, Spinner } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import {
  computeAge,
  genderLabel,
  newsBadgeTone,
  newsLabel,
  fmtDate,
  fmtDateTime,
  relativeTime,
} from '@/lib/format';
import type {
  PatientProfile,
  Observation,
  VitalSign,
  Anomaly,
  Trend,
} from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Tab = 'overview' | 'observations' | 'vitals' | 'insights';

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('overview');
  const [showObs, setShowObs] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: patient, isLoading } = useQuery<PatientProfile>({
    queryKey: ['patient', patientId],
    queryFn: async () => (await api.get<{ patient: PatientProfile }>(`/patients/${patientId}`)).data.patient,
    enabled: !!patientId,
  });

  const { data: observationsData } = useQuery<Observation[]>({
    queryKey: ['patient-observations', patientId],
    queryFn: async () => (await api.get<{ observations: Observation[] }>(`/observations/patient/${patientId}`)).data.observations,
    enabled: !!patientId,
  });

  const { data: vitalsData } = useQuery<VitalSign[]>({
    queryKey: ['patient-vitals', patientId],
    queryFn: async () => (await api.get<{ vitals: VitalSign[] }>(`/vitals/patient/${patientId}`)).data.vitals,
    enabled: !!patientId,
  });

  const { data: analysis } = useQuery<{ anomalies: Anomaly[]; trends: Record<string, Trend> }>({
    queryKey: ['patient-analysis', patientId],
    queryFn: async () => (await api.get(`/vitals/patient/${patientId}/analysis`)).data,
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Pasien dihapus');
      navigate('/doctor/patients');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const observations = observationsData || [];
  const vitals = (vitalsData || []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestVitals = vitalsData?.[0]; // already sorted desc by backend

  async function runAISummary() {
    if (!patientId) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      const { data } = await api.post<{ summary: string }>('/ai/summarize', { patientId });
      setAiSummary(data.summary);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size={24} /></div>;
  }
  if (!patient) {
    return (
      <div className="card">
        <Empty icon="user" title="Pasien tidak ditemukan" action={<Button size="sm" onClick={() => navigate('/doctor/patients')}>Kembali</Button>} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/patients')}>
        <Icon name="arrowLeft" size={14} /> Kembali ke daftar
      </Button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={patient.name} size="xl" />
            <div>
              <h2 className="font-display text-3xl text-ink leading-tight">{patient.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-stone-500">
                <span>{computeAge(patient.dateOfBirth)} tahun</span>
                <span>·</span>
                <span>{genderLabel(patient.gender)}</span>
                {patient.bloodType && <><span>·</span><span>Gol. <strong>{patient.bloodType}</strong></span></>}
              </div>
              {patient.allergies && (
                <div className="text-[12.5px] text-clinical-danger mt-2 flex items-center gap-1.5">
                  <Icon name="alert" size={14} /> Alergi: {patient.allergies}
                </div>
              )}
              {patient.chronicConditions && (
                <div className="text-[12.5px] text-stone-500 mt-1">Kondisi kronis: {patient.chronicConditions}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => setShowAI(true)}>
              <Icon name="sparkles" size={14} /> AI Chat
            </Button>
            <Button size="sm" onClick={runAISummary} loading={aiLoading}>
              <Icon name="brain" size={14} /> AI Summary
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-100">
          <Stat
            label="NEWS2"
            value={patient.news2?.score ?? '—'}
            badge={patient.news2 ? <Badge tone={newsBadgeTone(patient.news2.level)}>{newsLabel(patient.news2.level)}</Badge> : undefined}
          />
          <Stat label="Priority" value={`${patient.priority ?? 0}/100`} />
          <Stat label="Total Observasi" value={patient.observationCount ?? observations.length} />
          <Stat
            label="Anomali"
            value={analysis?.anomalies.length ?? 0}
            badge={analysis?.anomalies.length ? <Badge tone="warning">Perlu review</Badge> : undefined}
          />
        </div>
      </div>

      {(aiSummary || aiLoading) && (
        <div className="card p-5 border-l-4 !border-l-sage">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="sparkles" size={16} className="text-sage-deep" />
              <span className="font-medium text-ink">Ringkasan Klinis AI</span>
            </div>
            {aiSummary && (
              <button onClick={() => setAiSummary('')} className="text-stone-400 hover:text-ink">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
              <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
              <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
              <span className="ml-2">Menganalisis data klinis...</span>
            </div>
          ) : (
            <div className="text-[14px] text-stone-600 leading-relaxed whitespace-pre-wrap">{aiSummary}</div>
          )}
          <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400 italic">
            Ringkasan AI — untuk mendukung review klinis, bukan pengganti penilaian dokter.
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'overview', label: 'Ringkasan' },
          { id: 'observations', label: 'SOAP Notes', count: observations.length },
          { id: 'vitals', label: 'Vital Signs', count: vitalsData?.length || 0 },
          { id: 'insights', label: 'Insights' },
        ]}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-display text-lg text-ink mb-4">Vital Signs Terakhir</h3>
            {latestVitals ? (
              <div className="space-y-2.5">
                <VitalRow label="Nadi" value={latestVitals.heartRate} unit="bpm" icon="heart" />
                <VitalRow label="Tekanan Darah" value={latestVitals.systolicBP ? `${latestVitals.systolicBP}/${latestVitals.diastolicBP ?? '—'}` : null} unit="mmHg" icon="activity" />
                <VitalRow label="Suhu" value={latestVitals.temperature} unit="°C" icon="thermometer" />
                <VitalRow label="SpO₂" value={latestVitals.oxygenSaturation} unit="%" icon="activity" />
                <VitalRow label="Respirasi" value={latestVitals.respirationRate} unit="/min" icon="activity" />
                <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100 mt-3">
                  Diukur {fmtDateTime(latestVitals.date)}
                </div>
              </div>
            ) : (
              <Empty icon="activity" title="Belum ada vital signs" action={<Button size="sm" onClick={() => setShowVitals(true)}><Icon name="plus" size={14} /> Catat</Button>} />
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-ink">Catatan Terbaru</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowObs(true)}><Icon name="plus" size={12} /> Baru</Button>
            </div>
            {observations.length === 0 ? (
              <Empty icon="fileText" title="Belum ada catatan" action={<Button size="sm" onClick={() => setShowObs(true)}>Buat SOAP</Button>} />
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-auto">
                {observations.slice(0, 3).map((o) => (
                  <div key={o.id} className="p-3 rounded-lg border border-stone-100">
                    <div className="text-[11px] text-stone-400 mb-1">{fmtDateTime(o.date)}</div>
                    {o.subjective && <div className="text-[13px] text-stone-600 line-clamp-2">{o.subjective}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {analysis && (
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="brain" size={16} className="text-sage-deep" />
                <h3 className="font-display text-lg text-ink">Machine Learning Insights</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <TrendCard label="Tren Nadi" trend={analysis.trends.heartRate} />
                <TrendCard label="Tren Tekanan Darah" trend={analysis.trends.systolicBP} />
                <TrendCard label="Tren Suhu" trend={analysis.trends.temperature} />
              </div>
              {analysis.anomalies.length > 0 && (
                <div className="mt-5 pt-4 border-t border-stone-100">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-2">Anomali Terdeteksi</div>
                  <div className="space-y-1.5">
                    {analysis.anomalies.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-[13px] p-2 rounded bg-amber-50/60">
                        <span>
                          <span className="font-mono text-ink">{a.metric}</span> nilai {a.direction} ({a.value})
                        </span>
                        <span className="text-[11px] font-mono text-stone-500">z = {a.zScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'observations' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowObs(true)}><Icon name="plus" size={14} /> Catatan baru</Button>
          </div>
          {observations.length === 0 ? (
            <div className="card">
              <Empty icon="fileText" title="Belum ada observasi" action={<Button size="sm" onClick={() => setShowObs(true)}>Buat catatan pertama</Button>} />
            </div>
          ) : (
            observations.map((o) => <ObservationCard key={o.id} obs={o} patientId={patientId!} />)
          )}
        </div>
      )}

      {tab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowVitals(true)}><Icon name="plus" size={14} /> Catat vital signs</Button>
          </div>
          {vitals.length === 0 ? (
            <div className="card">
              <Empty icon="activity" title="Belum ada vital signs" action={<Button size="sm" onClick={() => setShowVitals(true)}>Catat pertama</Button>} />
            </div>
          ) : (
            <>
              {vitals.length >= 2 && (
                <div className="card p-5">
                  <h3 className="font-display text-lg text-ink mb-4">Tren Vital Signs</h3>
                  <div className="h-[300px]">
                    <Line
                      data={{
                        labels: vitals.map((v) => fmtDate(v.date, 'dd MMM')),
                        datasets: [
                          { label: 'Nadi', data: vitals.map((v) => v.heartRate), borderColor: '#C14545', backgroundColor: 'rgba(193,69,69,0.1)', tension: 0.3 },
                          { label: 'Sistolik', data: vitals.map((v) => v.systolicBP), borderColor: '#D4704C', backgroundColor: 'rgba(212,112,76,0.1)', tension: 0.3 },
                          { label: 'SpO₂', data: vitals.map((v) => v.oxygenSaturation), borderColor: '#5C8B7E', backgroundColor: 'rgba(92,139,126,0.1)', tension: 0.3 },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } } },
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="card overflow-hidden">
                <div className="grid grid-cols-[1fr_70px_90px_70px_70px_70px_40px] px-4 py-3 border-b border-stone-100 text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                  <div>Tanggal</div>
                  <div>Nadi</div>
                  <div>TD</div>
                  <div>Suhu</div>
                  <div>SpO₂</div>
                  <div>NEWS2</div>
                  <div></div>
                </div>
                {vitalsData?.map((v) => (
                  <VitalRowItem key={v.id} vital={v} patientId={patientId!} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'insights' && analysis && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-display text-lg text-ink mb-1">NEWS2 Breakdown</h3>
            <p className="text-[12px] text-stone-500 mb-4">National Early Warning Score 2 — RCP 2017</p>
            {patient.news2 && patient.news2.breakdown.length > 0 ? (
              <div className="space-y-2">
                {patient.news2.breakdown.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded bg-stone-50">
                    <span className="text-[13px] text-stone-600">{b.label}</span>
                    <span className="font-mono text-[13px] text-clinical-danger font-semibold">+{b.points}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100">
                  <span className="text-sm font-medium text-ink">Total</span>
                  <span className="number-display text-xl text-ink">{patient.news2.score}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-stone-400">Semua parameter dalam rentang normal.</div>
            )}
          </div>
          <div className="card p-5">
            <h3 className="font-display text-lg text-ink mb-1">Priority Score</h3>
            <p className="text-[12px] text-stone-500 mb-4">Composite: NEWS2 + komorbid + usia</p>
            <div className="number-display text-5xl text-ink leading-none mb-1">
              {patient.priority ?? 0}<span className="text-lg text-stone-400">/100</span>
            </div>
            <div className="mt-2 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${(patient.priority ?? 0) > 70 ? 'bg-clinical-danger' : (patient.priority ?? 0) > 40 ? 'bg-clinical-warning' : 'bg-clinical-success'}`}
                style={{ width: `${patient.priority ?? 0}%` }}
              />
            </div>
          </div>
          <div className="card p-5 md:col-span-2">
            <h3 className="font-display text-lg text-ink mb-4">Aksi Klinis</h3>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="danger" onClick={() => {
                if (confirm(`Hapus pasien "${patient.name}" secara permanen?`)) {
                  deleteMutation.mutate();
                }
              }} loading={deleteMutation.isPending}>
                <Icon name="trash" size={14} /> Hapus pasien
              </Button>
            </div>
          </div>
        </div>
      )}

      <ObservationModal open={showObs} onClose={() => setShowObs(false)} patientId={patientId!} />
      <VitalsModal open={showVitals} onClose={() => setShowVitals(false)} patientId={patientId!} />
      <AIChatModal open={showAI} onClose={() => setShowAI(false)} patientId={patientId!} patientName={patient.name} />
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Stat({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] text-stone-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <div className="number-display text-3xl text-ink leading-none">{value}</div>
        {badge}
      </div>
    </div>
  );
}

function VitalRow({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: number | string | null | undefined;
  unit: string;
  icon: 'heart' | 'activity' | 'thermometer';
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={16} className="text-stone-400" />
        <span className="text-sm text-stone-600">{label}</span>
      </div>
      <div className="font-mono text-[15px] text-ink">
        {value != null ? (
          <>
            {value}
            <span className="text-[11px] text-stone-400 ml-1">{unit}</span>
          </>
        ) : (
          <span className="text-stone-300">—</span>
        )}
      </div>
    </div>
  );
}

function TrendCard({ label, trend }: { label: string; trend: Trend }) {
  const iconName = trend.trend === 'rising' ? 'trending' : trend.trend === 'falling' ? 'trendingDown' : 'activity';
  const colorClass = trend.trend === 'rising' ? 'text-clinical-danger' : trend.trend === 'falling' ? 'text-clinical-info' : 'text-stone-400';
  const label2 = trend.trend === 'rising' ? 'Meningkat' : trend.trend === 'falling' ? 'Menurun' : 'Stabil';
  return (
    <div>
      <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <Icon name={iconName} size={20} className={colorClass} />
        <span className="text-sm text-ink">{label2}</span>
      </div>
      <div className="text-[11px] text-stone-400 mt-0.5 font-mono">slope: {trend.slope}/hari</div>
    </div>
  );
}

function ObservationCard({ obs, patientId }: { obs: Observation; patientId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  async function remove() {
    if (!confirm('Hapus catatan ini?')) return;
    try {
      await api.delete(`/observations/${obs.id}`);
      queryClient.invalidateQueries({ queryKey: ['patient-observations', patientId] });
      toast.success('Catatan dihapus');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[13px] text-stone-500 flex items-center gap-1.5">
          <Icon name="clock" size={14} /> {fmtDateTime(obs.date)}
        </div>
        <button onClick={remove} className="text-[11px] text-stone-400 hover:text-clinical-danger">Hapus</button>
      </div>
      <div className="space-y-3">
        {obs.subjective && <SoapBlock label="Subjective" content={obs.subjective} />}
        {obs.objective && <SoapBlock label="Objective" content={obs.objective} />}
        {obs.assessment && <SoapBlock label="Assessment" content={obs.assessment} />}
        {obs.plan && <SoapBlock label="Plan" content={obs.plan} />}
      </div>
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

function VitalRowItem({ vital, patientId }: { vital: VitalSign; patientId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  async function remove() {
    if (!confirm('Hapus data vital ini?')) return;
    try {
      await api.delete(`/vitals/${vital.id}`);
      queryClient.invalidateQueries({ queryKey: ['patient-vitals', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast.success('Data dihapus');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }
  return (
    <div className="grid grid-cols-[1fr_70px_90px_70px_70px_70px_40px] px-4 py-3 border-b border-stone-50 last:border-0 text-[13px] items-center">
      <div className="text-xs">{fmtDateTime(vital.date)}</div>
      <div className="font-mono">{vital.heartRate ?? '—'}</div>
      <div className="font-mono">{vital.systolicBP ? `${vital.systolicBP}/${vital.diastolicBP ?? '—'}` : '—'}</div>
      <div className="font-mono">{vital.temperature ?? '—'}</div>
      <div className="font-mono">{vital.oxygenSaturation ?? '—'}</div>
      <div>
        {vital.news2Score != null && <Badge tone={vital.news2Score >= 7 ? 'danger' : vital.news2Score >= 5 ? 'warning' : vital.news2Score >= 3 ? 'info' : 'success'}>{vital.news2Score}</Badge>}
      </div>
      <button onClick={remove} className="text-stone-400 hover:text-clinical-danger"><Icon name="trash" size={14} /></button>
    </div>
  );
}

// ============================================================
// Modals
// ============================================================

function ObservationModal({ open, onClose, patientId }: { open: boolean; onClose: () => void; patientId: string }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  async function submit() {
    if (!form.subjective && !form.objective && !form.assessment && !form.plan) {
      toast.error('Minimal satu field SOAP harus diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/observations', {
        patientId,
        subjective: form.subjective || null,
        objective: form.objective || null,
        assessment: form.assessment || null,
        plan: form.plan || null,
      });
      queryClient.invalidateQueries({ queryKey: ['patient-observations', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast.success('Catatan disimpan');
      setForm({});
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-xl text-ink">Catatan SOAP Baru</h2>
            <p className="text-[12.5px] text-stone-500 mt-0.5">Subjective · Objective · Assessment · Plan</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          <Field label="Subjective (keluhan pasien, anamnesis)">
            <textarea className="input resize-none" rows={3} value={form.subjective || ''} onChange={(e) => setForm((f) => ({ ...f, subjective: e.target.value }))} placeholder="Keluhan, riwayat, durasi..." />
          </Field>
          <Field label="Objective (pemeriksaan fisik, hasil lab)">
            <textarea className="input resize-none" rows={3} value={form.objective || ''} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} placeholder="Tanda vital, pemeriksaan fisik, hasil penunjang..." />
          </Field>
          <Field label="Assessment (diagnosis / diferensial)">
            <textarea className="input resize-none" rows={3} value={form.assessment || ''} onChange={(e) => setForm((f) => ({ ...f, assessment: e.target.value }))} placeholder="Penilaian klinis, diagnosis..." />
          </Field>
          <Field label="Plan (rencana terapi / tindak lanjut)">
            <textarea className="input resize-none" rows={3} value={form.plan || ''} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))} placeholder="Medikasi, edukasi, follow-up..." />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" loading={loading}>Simpan</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function VitalsModal({ open, onClose, patientId }: { open: boolean; onClose: () => void; patientId: string }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  function num(k: string): number | null {
    const v = form[k];
    if (!v) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  async function submit() {
    const payload: Record<string, unknown> = {
      patientId,
      heartRate: num('heartRate'),
      systolicBP: num('systolicBP'),
      diastolicBP: num('diastolicBP'),
      temperature: num('temperature'),
      oxygenSaturation: num('oxygenSaturation'),
      respirationRate: num('respirationRate'),
      bloodGlucose: num('bloodGlucose'),
      consciousness: form.consciousness || 'ALERT',
      notes: form.notes || null,
    };
    const hasValue = Object.entries(payload).some(([k, v]) => k !== 'patientId' && k !== 'consciousness' && k !== 'notes' && v != null);
    if (!hasValue) {
      toast.error('Minimal satu parameter vital harus diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/vitals', payload);
      queryClient.invalidateQueries({ queryKey: ['patient-vitals', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-analysis', patientId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] });
      toast.success('Vital signs dicatat. NEWS2 dihitung otomatis.');
      setForm({});
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-xl text-ink">Catat Vital Signs</h2>
            <p className="text-[12.5px] text-stone-500 mt-0.5">NEWS2 akan dihitung otomatis</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Nadi" hint="bpm">
              <Input type="number" min={20} max={300} value={form.heartRate || ''} onChange={(e) => setForm((f) => ({ ...f, heartRate: e.target.value }))} />
            </Field>
            <Field label="Sistolik" hint="mmHg">
              <Input type="number" min={40} max={300} value={form.systolicBP || ''} onChange={(e) => setForm((f) => ({ ...f, systolicBP: e.target.value }))} />
            </Field>
            <Field label="Diastolik" hint="mmHg">
              <Input type="number" min={20} max={200} value={form.diastolicBP || ''} onChange={(e) => setForm((f) => ({ ...f, diastolicBP: e.target.value }))} />
            </Field>
            <Field label="Suhu" hint="°C">
              <Input type="number" step="0.1" min={25} max={45} value={form.temperature || ''} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} />
            </Field>
            <Field label="SpO₂" hint="%">
              <Input type="number" min={50} max={100} value={form.oxygenSaturation || ''} onChange={(e) => setForm((f) => ({ ...f, oxygenSaturation: e.target.value }))} />
            </Field>
            <Field label="Respirasi" hint="/min">
              <Input type="number" min={4} max={80} value={form.respirationRate || ''} onChange={(e) => setForm((f) => ({ ...f, respirationRate: e.target.value }))} />
            </Field>
            <Field label="Gula darah" hint="mg/dL">
              <Input type="number" step="0.1" value={form.bloodGlucose || ''} onChange={(e) => setForm((f) => ({ ...f, bloodGlucose: e.target.value }))} />
            </Field>
            <Field label="Kesadaran">
              <select className="input" value={form.consciousness || 'ALERT'} onChange={(e) => setForm((f) => ({ ...f, consciousness: e.target.value }))}>
                <option value="ALERT">Alert</option>
                <option value="CONFUSION">Confusion</option>
                <option value="VOICE">Voice</option>
                <option value="PAIN">Pain</option>
                <option value="UNRESPONSIVE">Unresponsive</option>
              </select>
            </Field>
          </div>
          <Field label="Catatan">
            <textarea className="input resize-none" rows={2} value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Batal</Button>
            <Button type="submit" className="flex-1" loading={loading}>Simpan</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AIChatModal({ open, onClose, patientId, patientName }: { open: boolean; onClose: () => void; patientId: string; patientName: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const toast = useToast();

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post<{ reply: string; conversationId: string }>('/ai/chat', {
        message: userMsg,
        patientId,
        conversationId,
      });
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[80vh]">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="sparkles" size={18} className="text-sage-deep" />
            <div>
              <h2 className="font-display text-lg text-ink">AI Assistant</h2>
              <p className="text-[12px] text-stone-500">Konteks: {patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-50"><Icon name="x" /></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-3 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              <Icon name="sparkles" size={24} className="mx-auto mb-2 text-sage-deep" />
              Tanyakan tentang kondisi pasien, pola gejala, atau rekomendasi klinis.
              <div className="mt-4 space-y-1.5 text-left max-w-md mx-auto">
                <button onClick={() => setInput('Ringkas kondisi pasien saat ini')} className="w-full text-left p-2 rounded-lg text-[13px] text-stone-600 hover:bg-stone-50 border border-stone-100">
                  "Ringkas kondisi pasien saat ini"
                </button>
                <button onClick={() => setInput('Apa pertimbangan klinis untuk vital signs terakhir?')} className="w-full text-left p-2 rounded-lg text-[13px] text-stone-600 hover:bg-stone-50 border border-stone-100">
                  "Apa pertimbangan klinis untuk vital signs terakhir?"
                </button>
                <button onClick={() => setInput('Identifikasi pola gejala dari observasi terbaru')} className="w-full text-left p-2 rounded-lg text-[13px] text-stone-600 hover:bg-stone-50 border border-stone-100">
                  "Identifikasi pola gejala dari observasi terbaru"
                </button>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-ink text-cream' : 'ai-msg'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="ai-msg rounded-lg p-3 flex items-center gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-sage inline-block" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-100 flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ketik pertanyaan..."
            disabled={loading}
          />
          <Button onClick={send} disabled={!input.trim() || loading}>
            <Icon name="send" size={14} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
