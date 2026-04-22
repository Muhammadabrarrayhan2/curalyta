import { Routes, Route, useLocation } from 'react-router-dom';
import { Shell, type NavItem } from '@/components/Shell';
import { PatientHome } from './PatientHome';
import { PatientProfile } from './PatientProfile';
import { PatientHistory } from './PatientHistory';
import { PatientAppointments } from './PatientAppointments';

const navItems: NavItem[] = [
  { to: '/patient', label: 'Dashboard', icon: 'home', end: true },
  { to: '/patient/history', label: 'Riwayat', icon: 'fileText' },
  { to: '/patient/appointments', label: 'Jadwal', icon: 'calendar' },
  { to: '/patient/profile', label: 'Profil', icon: 'user' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/patient': { title: 'Dashboard', subtitle: 'Ringkasan kesehatan Anda' },
  '/patient/history': { title: 'Riwayat Medis', subtitle: 'Catatan konsultasi dan observasi' },
  '/patient/appointments': { title: 'Jadwal', subtitle: 'Appointment Anda' },
  '/patient/profile': { title: 'Profil', subtitle: 'Data diri dan pengaturan' },
};

export function PatientShell() {
  const location = useLocation();
  const meta = pageTitles[location.pathname] || { title: 'Curalyta', subtitle: 'Patient portal' };

  return (
    <Shell
      navItems={navItems}
      title={meta.title}
      subtitle={meta.subtitle}
      roleLabel="Pasien"
      roleIcon="user"
    >
      <Routes>
        <Route index element={<PatientHome />} />
        <Route path="history" element={<PatientHistory />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="profile" element={<PatientProfile />} />
      </Routes>
    </Shell>
  );
}
