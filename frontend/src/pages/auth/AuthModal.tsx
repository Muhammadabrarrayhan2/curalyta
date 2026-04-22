import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Field, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/ui/Toast';
import clsx from 'clsx';

export type AuthTab =
  | 'patient-login'
  | 'patient-register'
  | 'doctor-login'
  | 'doctor-register'
  | 'admin-login';

interface AuthModalProps {
  open: boolean;
  mode: AuthTab;
  onClose: () => void;
  onChangeMode: (mode: AuthTab) => void;
}

type FormState = Record<string, string | number | undefined>;
type FormErrors = Record<string, string | undefined>;

const THEMES: Record<
  AuthTab,
  { title: string; subtitle: string; accent: string; icon: 'user' | 'stethoscope' | 'shield' }
> = {
  'patient-login': {
    title: 'Masuk sebagai Pasien',
    subtitle: 'Akses profil kesehatan dan jadwal Anda',
    accent: 'from-blue-500 to-sky-600',
    icon: 'user',
  },
  'patient-register': {
    title: 'Daftar sebagai Pasien',
    subtitle: 'Mulai perjalanan kesehatan digital Anda',
    accent: 'from-blue-500 to-sky-600',
    icon: 'user',
  },
  'doctor-login': {
    title: 'Masuk sebagai Dokter',
    subtitle: 'Lanjutkan praktik klinis Anda',
    accent: 'from-sage-deep to-sage',
    icon: 'stethoscope',
  },
  'doctor-register': {
    title: 'Daftar sebagai Dokter',
    subtitle: 'Verifikasi profesi diperlukan',
    accent: 'from-sage-deep to-sage',
    icon: 'stethoscope',
  },
  'admin-login': {
    title: 'Login Administrator',
    subtitle: 'Akses khusus tim Curalyta',
    accent: 'from-ink to-ink-soft',
    icon: 'shield',
  },
};

export function AuthModal({ open, mode, onClose, onChangeMode }: AuthModalProps) {
  const [form, setForm] = useState<FormState>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login, registerPatient, registerDoctor } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setForm({});
      setErrors({});
      setStep(1);
      setShowPw(false);
    }
  }, [open, mode]);

  const theme = THEMES[mode];
  const isLogin = mode.endsWith('-login');
  const isRegister = mode.endsWith('-register');
  const isDoctor = mode.startsWith('doctor-');
  const isPatient = mode.startsWith('patient-');
  const isAdmin = mode === 'admin-login';

  function set(key: string, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateLogin(): boolean {
    const e: FormErrors = {};
    if (!form.email) e.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email)))
      e.email = 'Format email tidak valid';
    if (!form.password) e.password = 'Password wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateRegisterStep1(): boolean {
    const e: FormErrors = {};
    if (!form.name || String(form.name).length < 3) e.name = 'Nama minimal 3 karakter';
    if (!form.email) e.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email)))
      e.email = 'Format email tidak valid';
    if (!form.phone) e.phone = 'Nomor HP wajib diisi';
    else if (!/^[+\d\s\-()]{8,20}$/.test(String(form.phone)))
      e.phone = 'Format nomor HP tidak valid';
    if (!form.password) e.password = 'Password wajib diisi';
    else if (String(form.password).length < 8)
      e.password = 'Password minimal 8 karakter';
    if (!form.confirmPassword) e.confirmPassword = 'Konfirmasi password';
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Password tidak cocok';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validatePatientStep2(): boolean {
    const e: FormErrors = {};
    if (!form.dateOfBirth) e.dateOfBirth = 'Tanggal lahir wajib';
    if (!form.gender) e.gender = 'Pilih jenis kelamin';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateDoctorStep2(): boolean {
    const e: FormErrors = {};
    if (!form.specialization) e.specialization = 'Spesialisasi wajib';
    if (!form.licenseNumber) e.licenseNumber = 'Nomor STR wajib';
    if (form.experience === undefined || form.experience === '')
      e.experience = 'Pengalaman wajib';
    if (!form.institution) e.institution = 'Institusi wajib';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const expectedRole = isDoctor ? 'DOCTOR' : isAdmin ? 'ADMIN' : 'PATIENT';
      const user = await login(String(form.email), String(form.password), expectedRole);
      toast.success(`Selamat datang, ${user.name}`);
      onClose();
      const dest = user.role === 'DOCTOR' ? '/doctor' : user.role === 'ADMIN' ? '/admin' : '/patient';
      navigate(dest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (step === 1) {
      if (!validateRegisterStep1()) return;
      setStep(2);
      return;
    }

    if (isPatient) {
      if (!validatePatientStep2()) return;
      setLoading(true);
      try {
        const user = await registerPatient({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          address: form.address || '',
          bloodType: form.bloodType || '',
          allergies: form.allergies || '',
          chronicConditions: form.chronicConditions || '',
          emergencyContact: form.emergencyContact || '',
        });
        toast.success(`Akun pasien berhasil dibuat. Selamat datang, ${user.name}`);
        onClose();
        navigate('/patient');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Registrasi gagal');
      } finally {
        setLoading(false);
      }
    } else if (isDoctor) {
      if (!validateDoctorStep2()) return;
      setLoading(true);
      try {
        await registerDoctor({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          sipNumber: form.sipNumber || '',
          experience: Number(form.experience) || 0,
          institution: form.institution,
          bio: form.bio || '',
          schedule: form.schedule || '',
        });
        toast.success('Registrasi dokter berhasil — menunggu verifikasi admin.');
        onChangeMode('doctor-login');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Registrasi gagal');
      } finally {
        setLoading(false);
      }
    }
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size={isRegister ? 'lg' : 'md'}>
      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT — branded panel */}
        <div
          className={clsx(
            'hidden md:flex flex-col justify-between p-8 text-white relative overflow-hidden',
            'bg-gradient-to-br',
            theme.accent
          )}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-8">
              <Icon name="logo" size={26} />
              <span className="font-display font-semibold text-lg tracking-tight">Curalyta</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
              <Icon name={theme.icon} size={22} />
            </div>
            <h3 className="font-display text-2xl leading-tight mb-2">{theme.title}</h3>
            <p className="text-sm text-white/80 leading-relaxed">{theme.subtitle}</p>
          </div>

          <div className="relative space-y-3 pt-8 border-t border-white/15 text-sm">
            {isPatient && (
              <>
                <BenefitLine icon="messageSquare" text="Chat dengan dokter kapan saja" />
                <BenefitLine icon="calendar" text="Jadwal appointment terpusat" />
                <BenefitLine icon="clipboard" text="Rekam medis digital" />
              </>
            )}
            {isDoctor && (
              <>
                <BenefitLine icon="users" text="Manajemen pasien terstruktur" />
                <BenefitLine icon="sparkles" text="AI clinical assistant" />
                <BenefitLine icon="activity" text="NEWS2 auto-scoring" />
              </>
            )}
            {isAdmin && (
              <>
                <BenefitLine icon="verified" text="Verifikasi dokter" />
                <BenefitLine icon="users" text="Manajemen pengguna" />
                <BenefitLine icon="fileText" text="Audit log lengkap" />
              </>
            )}
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="p-6 md:p-8 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="md:hidden flex items-center gap-2">
              <Icon name="logo" size={22} className="text-sage-deep" />
              <span className="font-display font-semibold text-ink">Curalyta</span>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-1.5 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-ink"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* MD-only title (hidden on desktop because left panel shows it) */}
          <div className="md:hidden mb-5">
            <h2 className="font-display text-xl text-ink">{theme.title}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{theme.subtitle}</p>
          </div>

          {/* Mode switcher pills */}
          <div className="flex items-center gap-1 p-1 bg-stone-50 rounded-lg mb-6">
            {!isAdmin && (
              <>
                <PillButton
                  active={mode === 'patient-login' || mode === 'patient-register'}
                  onClick={() =>
                    onChangeMode(isLogin ? 'patient-login' : 'patient-register')
                  }
                >
                  <Icon name="user" size={14} /> Pasien
                </PillButton>
                <PillButton
                  active={mode === 'doctor-login' || mode === 'doctor-register'}
                  onClick={() =>
                    onChangeMode(isLogin ? 'doctor-login' : 'doctor-register')
                  }
                >
                  <Icon name="stethoscope" size={14} /> Dokter
                </PillButton>
              </>
            )}
            {isAdmin && (
              <PillButton active={true} onClick={() => {}}>
                <Icon name="shield" size={14} /> Administrator
              </PillButton>
            )}
          </div>

          {/* Login/Register toggle (for non-admin) */}
          {!isAdmin && (
            <div className="flex border-b border-stone-100 mb-5 -mx-1">
              <TabButton
                active={isLogin}
                onClick={() => onChangeMode(isDoctor ? 'doctor-login' : 'patient-login')}
              >
                Masuk
              </TabButton>
              <TabButton
                active={isRegister}
                onClick={() =>
                  onChangeMode(isDoctor ? 'doctor-register' : 'patient-register')
                }
              >
                Daftar
              </TabButton>
            </div>
          )}

          {/* LOGIN FORM */}
          {isLogin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <Field label="Email" required error={errors.email}>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={String(form.email || '')}
                  onChange={(e) => set('email', e.target.value)}
                  error={!!errors.email}
                  autoFocus
                />
              </Field>
              <Field label="Password" required error={errors.password}>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={String(form.password || '')}
                    onChange={(e) => set('password', e.target.value)}
                    error={!!errors.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink"
                  >
                    <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </Field>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Masuk
              </Button>
            </form>
          )}

          {/* REGISTER FORM */}
          {isRegister && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
              className="space-y-4"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className={clsx(
                      'h-1 flex-1 rounded-full transition-colors',
                      step >= n ? 'bg-ink' : 'bg-stone-100'
                    )}
                  />
                ))}
              </div>
              <p className="text-[11.5px] text-stone-500 -mt-2">
                Langkah {step} dari 2 — {step === 1 ? 'Informasi akun' : isDoctor ? 'Data profesi' : 'Data kesehatan'}
              </p>

              {step === 1 && (
                <>
                  <Field label="Nama lengkap" required error={errors.name}>
                    <Input
                      placeholder={isDoctor ? 'dr. Budi Santoso, Sp.PD' : 'Nama sesuai KTP'}
                      value={String(form.name || '')}
                      onChange={(e) => set('name', e.target.value)}
                      error={!!errors.name}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email" required error={errors.email}>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={String(form.email || '')}
                        onChange={(e) => set('email', e.target.value)}
                        error={!!errors.email}
                      />
                    </Field>
                    <Field label="Nomor HP" required error={errors.phone}>
                      <Input
                        type="tel"
                        placeholder="+62 812..."
                        value={String(form.phone || '')}
                        onChange={(e) => set('phone', e.target.value)}
                        error={!!errors.phone}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Password" required error={errors.password} hint="Min. 8 karakter">
                      <div className="relative">
                        <Input
                          type={showPw ? 'text' : 'password'}
                          value={String(form.password || '')}
                          onChange={(e) => set('password', e.target.value)}
                          error={!!errors.password}
                          className="pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                        >
                          <Icon name={showPw ? 'eyeOff' : 'eye'} size={14} />
                        </button>
                      </div>
                    </Field>
                    <Field label="Konfirmasi" required error={errors.confirmPassword}>
                      <Input
                        type={showPw ? 'text' : 'password'}
                        value={String(form.confirmPassword || '')}
                        onChange={(e) => set('confirmPassword', e.target.value)}
                        error={!!errors.confirmPassword}
                      />
                    </Field>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Lanjut <Icon name="arrowRight" size={16} />
                  </Button>
                </>
              )}

              {step === 2 && isPatient && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tanggal lahir" required error={errors.dateOfBirth}>
                      <Input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={String(form.dateOfBirth || '')}
                        onChange={(e) => set('dateOfBirth', e.target.value)}
                        error={!!errors.dateOfBirth}
                      />
                    </Field>
                    <Field label="Jenis kelamin" required error={errors.gender}>
                      <select
                        className={clsx('input', errors.gender && 'error')}
                        value={String(form.gender || '')}
                        onChange={(e) => set('gender', e.target.value)}
                      >
                        <option value="">Pilih</option>
                        <option value="MALE">Laki-laki</option>
                        <option value="FEMALE">Perempuan</option>
                        <option value="OTHER">Lainnya</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Gol. darah">
                      <select
                        className="input"
                        value={String(form.bloodType || '')}
                        onChange={(e) => set('bloodType', e.target.value)}
                      >
                        <option value="">—</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </Field>
                    <Field label="Kontak darurat">
                      <Input
                        type="tel"
                        placeholder="No. HP keluarga"
                        value={String(form.emergencyContact || '')}
                        onChange={(e) => set('emergencyContact', e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Alamat">
                    <Input
                      placeholder="Kota, provinsi"
                      value={String(form.address || '')}
                      onChange={(e) => set('address', e.target.value)}
                    />
                  </Field>
                  <Field label="Alergi (opsional)">
                    <Input
                      placeholder="Penisilin, seafood..."
                      value={String(form.allergies || '')}
                      onChange={(e) => set('allergies', e.target.value)}
                    />
                  </Field>
                  <Field label="Kondisi kronis (opsional)">
                    <Input
                      placeholder="Hipertensi, diabetes..."
                      value={String(form.chronicConditions || '')}
                      onChange={(e) => set('chronicConditions', e.target.value)}
                    />
                  </Field>

                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                      <Icon name="arrowLeft" size={14} /> Kembali
                    </Button>
                    <Button type="submit" className="flex-1" loading={loading}>
                      Buat akun pasien
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && isDoctor && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Spesialisasi" required error={errors.specialization}>
                      <Input
                        placeholder="Penyakit Dalam, Umum..."
                        value={String(form.specialization || '')}
                        onChange={(e) => set('specialization', e.target.value)}
                        error={!!errors.specialization}
                      />
                    </Field>
                    <Field label="Pengalaman (tahun)" required error={errors.experience}>
                      <Input
                        type="number"
                        min={0}
                        max={70}
                        value={form.experience ?? ''}
                        onChange={(e) => set('experience', e.target.value)}
                        error={!!errors.experience}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nomor STR" required error={errors.licenseNumber} hint="Surat Tanda Registrasi">
                      <Input
                        value={String(form.licenseNumber || '')}
                        onChange={(e) => set('licenseNumber', e.target.value)}
                        error={!!errors.licenseNumber}
                      />
                    </Field>
                    <Field label="Nomor SIP">
                      <Input
                        value={String(form.sipNumber || '')}
                        onChange={(e) => set('sipNumber', e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Institusi / Klinik / RS" required error={errors.institution}>
                    <Input
                      placeholder="Nama tempat praktik utama"
                      value={String(form.institution || '')}
                      onChange={(e) => set('institution', e.target.value)}
                      error={!!errors.institution}
                    />
                  </Field>
                  <Field label="Jadwal praktik (opsional)">
                    <Input
                      placeholder="Senin–Jumat 09:00–15:00"
                      value={String(form.schedule || '')}
                      onChange={(e) => set('schedule', e.target.value)}
                    />
                  </Field>
                  <Field label="Bio singkat (opsional)">
                    <textarea
                      className="input resize-none"
                      rows={3}
                      placeholder="Ceritakan keahlian dan pengalaman Anda..."
                      value={String(form.bio || '')}
                      onChange={(e) => set('bio', e.target.value)}
                    />
                  </Field>

                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11.5px] text-stone-600 leading-relaxed flex items-start gap-2">
                    <Icon name="info" size={14} className="text-clinical-warning shrink-0 mt-0.5" />
                    <div>
                      Akun dokter memerlukan <strong>verifikasi oleh administrator</strong>. Data STR/SIP akan diperiksa sesuai regulasi KKI sebelum akun aktif.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                      <Icon name="arrowLeft" size={14} /> Kembali
                    </Button>
                    <Button type="submit" className="flex-1" loading={loading}>
                      Buat akun dokter
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}

// =============================================================
// Sub-components
// =============================================================

function PillButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] font-medium transition-all',
        active ? 'bg-white shadow-sm text-ink' : 'text-stone-500 hover:text-stone-700'
      )}
    >
      {children}
    </button>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-1 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
        active ? 'border-ink text-ink' : 'border-transparent text-stone-400 hover:text-ink'
      )}
    >
      {children}
    </button>
  );
}

function BenefitLine({ icon, text }: { icon: Parameters<typeof Icon>[0]['name']; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={14} className="text-white/80 shrink-0" />
      <span className="text-white/90">{text}</span>
    </div>
  );
}
