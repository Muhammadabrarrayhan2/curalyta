import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { LoadingScreen } from '@/components/ui';
import { Landing } from '@/pages/Landing';
import { DoctorShell } from '@/pages/doctor/DoctorShell';
import { PatientShell } from '@/pages/patient/PatientShell';
import { AdminShell } from '@/pages/admin/AdminShell';
import type { UserRole } from '@/types';

function RoleGate({ allow, children }: { allow: UserRole; children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const loc = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={allow === 'ADMIN' ? { from: loc.pathname, authMode: 'admin-login' } : { from: loc.pathname }}
      />
    );
  }
  if (user.role !== allow) {
    const dest =
      user.role === 'DOCTOR' ? '/doctor' : user.role === 'PATIENT' ? '/patient' : '/admin';
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
}

export function App() {
  const { initialize, initialized, user } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === 'DOCTOR'
                  ? '/doctor'
                  : user.role === 'PATIENT'
                  ? '/patient'
                  : '/admin'
              }
              replace
            />
          ) : (
            <Landing />
          )
        }
      />

      <Route
        path="/doctor/*"
        element={
          <RoleGate allow="DOCTOR">
            <DoctorShell />
          </RoleGate>
        }
      />
      <Route
        path="/patient/*"
        element={
          <RoleGate allow="PATIENT">
            <PatientShell />
          </RoleGate>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RoleGate allow="ADMIN">
            <AdminShell />
          </RoleGate>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
