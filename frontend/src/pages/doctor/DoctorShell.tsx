import { Routes, Route, useLocation } from 'react-router-dom';
import { Shell, type NavItem } from '@/components/Shell';
import { useAuth } from '@/store/auth';
import { DoctorHome } from './DoctorHome';
import { DoctorPatients } from './DoctorPatients';
import { PatientDetail } from './PatientDetail';
import { DoctorTasks } from './DoctorTasks';
import { DoctorAppointments } from './DoctorAppointments';
import { DoctorAI } from './DoctorAI';
import { DoctorProfile } from './DoctorProfile';

const navItems: NavItem[] = [
  { to: '/doctor', label: 'Dashboard', icon: 'home', end: true },
  { to: '/doctor/patients', label: 'Pasien', icon: 'users' },
  { to: '/doctor/tasks', label: 'Tugas', icon: 'list' },
  { to: '/doctor/appointments', label: 'Jadwal', icon: 'calendar' },
  { to: '/doctor/ai', label: 'AI Assistant', icon: 'sparkles' },
  { to: '/doctor/profile', label: 'Profil', icon: 'user' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/doctor': { title: 'Dashboard', subtitle: 'Ringkasan hari ini' },
  '/doctor/patients': { title: 'Daftar Pasien', subtitle: 'Manajemen pasien' },
  '/doctor/tasks': { title: 'Tugas Harian', subtitle: 'To-do klinis' },
  '/doctor/appointments': { title: 'Jadwal Praktik', subtitle: 'Appointments' },
  '/doctor/ai': { title: 'AI Assistant', subtitle: 'Clinical intelligence' },
  '/doctor/profile': { title: 'Profil Dokter', subtitle: 'Pengaturan akun' },
};

export function DoctorShell() {
  const location = useLocation();
  const { doctor } = useAuth();

  let headerMeta = pageTitles[location.pathname];
  if (!headerMeta) {
    if (location.pathname.startsWith('/doctor/patients/')) {
      headerMeta = { title: 'Detail Pasien', subtitle: 'Rekam medis' };
    } else {
      headerMeta = { title: 'Dashboard', subtitle: 'Doctor workspace' };
    }
  }

  return (
    <Shell
      navItems={navItems}
      title={headerMeta.title}
      subtitle={headerMeta.subtitle}
      roleLabel="Dokter"
      roleIcon="stethoscope"
    >
      {doctor && doctor.verificationStatus !== 'APPROVED' && location.pathname !== '/doctor/profile' ? (
        <UnverifiedBanner status={doctor.verificationStatus} reason={doctor.rejectionReason} />
      ) : (
        <Routes>
          <Route index element={<DoctorHome />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="tasks" element={<DoctorTasks />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="ai" element={<DoctorAI />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Routes>
      )}
    </Shell>
  );
}

function UnverifiedBanner({ status, reason }: { status: string; reason: string | null }) {
  const isRejected = status === 'REJECTED';
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="card p-8 text-center">
        <div
          className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
            isRejected ? 'bg-red-50' : 'bg-amber-50'
          }`}
        >
          <div className={isRejected ? 'text-clinical-danger' : 'text-clinical-warning'}>
            {isRejected ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            )}
          </div>
        </div>
        <h2 className="font-display text-2xl text-ink mb-2">
          {isRejected ? 'Verifikasi ditolak' : 'Menunggu verifikasi'}
        </h2>
        <p className="text-stone-500 mb-6 max-w-md mx-auto">
          {isRejected
            ? 'Pendaftaran Anda tidak disetujui oleh administrator. Silakan periksa alasan di bawah dan hubungi admin untuk pendaftaran ulang.'
            : 'Akun dokter Anda sedang direview oleh tim administrator Curalyta. Proses verifikasi mencakup pengecekan STR/SIP.'}
        </p>
        {reason && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-left text-sm text-clinical-danger max-w-md mx-auto mb-4">
            <div className="font-medium mb-1">Alasan penolakan:</div>
            {reason}
          </div>
        )}
        <a href="/doctor/profile" className="text-sage-deep text-sm hover:underline">
          Lihat profil saya →
        </a>
      </div>
    </div>
  );
}
