import { Routes, Route, useLocation } from 'react-router-dom';
import { Shell, type NavItem } from '@/components/Shell';
import { AdminHome } from './AdminHome';
import { AdminVerifications } from './AdminVerifications';
import { AdminUsers } from './AdminUsers';
import { AdminAudit } from './AdminAudit';
import { AdminProfile } from './AdminProfile';

const navItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
  { to: '/admin/verifications', label: 'Verifikasi', icon: 'verified' },
  { to: '/admin/users', label: 'Pengguna', icon: 'users' },
  { to: '/admin/audit', label: 'Audit Log', icon: 'fileText' },
  { to: '/admin/profile', label: 'Profil', icon: 'user' },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Admin Dashboard', subtitle: 'System overview' },
  '/admin/verifications': { title: 'Verifikasi Dokter', subtitle: 'Review dan approve registrasi dokter' },
  '/admin/users': { title: 'Manajemen Pengguna', subtitle: 'Kelola semua akun' },
  '/admin/audit': { title: 'Audit Log', subtitle: 'Jejak aktivitas sistem' },
  '/admin/profile': { title: 'Profil Admin', subtitle: 'Pengaturan akun' },
};

export function AdminShell() {
  const location = useLocation();
  const meta = pageTitles[location.pathname] || { title: 'Admin', subtitle: 'Curalyta' };

  return (
    <Shell
      navItems={navItems}
      title={meta.title}
      subtitle={meta.subtitle}
      roleLabel="Administrator"
      roleIcon="shield"
    >
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="profile" element={<AdminProfile />} />
      </Routes>
    </Shell>
  );
}
