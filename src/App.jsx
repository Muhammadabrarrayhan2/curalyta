import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import LoginModal from './components/LoginModal'
import { useAuth } from './context/AuthContext'

import Landing from './pages/Landing'

// Patient
import PatientHome from './pages/patient/PatientHome'
import PatientDoctors from './pages/patient/PatientDoctors'
import PatientBookings from './pages/patient/PatientBookings'
import PatientChats from './pages/patient/PatientChats'
import PatientHistory from './pages/patient/PatientHistory'
import PatientRecords from './pages/patient/PatientRecords'
import PatientProfile from './pages/patient/PatientProfile'
import PatientNotifications from './pages/patient/PatientNotifications'

// Doctor
import DoctorHome from './pages/doctor/DoctorHome'
import DoctorConsult from './pages/doctor/DoctorConsult'
import DoctorTodo from './pages/doctor/DoctorTodo'
import DoctorBookings from './pages/doctor/DoctorBookings'
import DoctorPatients from './pages/doctor/DoctorPatients'
import DoctorSchedule from './pages/doctor/DoctorSchedule'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorNotes from './pages/doctor/DoctorNotes'
import DoctorChats from './pages/doctor/DoctorChats'

// Admin
import AdminHome from './pages/admin/AdminHome'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminPatients from './pages/admin/AdminPatients'
import AdminUsers from './pages/admin/AdminUsers'
import AdminServices from './pages/admin/AdminServices'
import AdminBookings from './pages/admin/AdminBookings'
import AdminConsultations from './pages/admin/AdminConsultations'
import AdminReports from './pages/admin/AdminReports'
import AdminSecurity from './pages/admin/AdminSecurity'
import AdminSettings from './pages/admin/AdminSettings'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-ink-mute">
          Memuat Curalyta…
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Landing />} />

        {/* Patient */}
        <Route element={<AppLayout requiredRole="patient" />}>
          <Route path="/patient" element={<PatientHome />} />
          <Route path="/patient/doctors" element={<PatientDoctors />} />
          <Route path="/patient/bookings" element={<PatientBookings />} />
          <Route path="/patient/chats" element={<PatientChats />} />
          <Route path="/patient/history" element={<PatientHistory />} />
          <Route path="/patient/records" element={<PatientRecords />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/notifications" element={<PatientNotifications />} />
        </Route>

        {/* Doctor */}
        <Route element={<AppLayout requiredRole="doctor" />}>
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/doctor/consult" element={<DoctorConsult />} />
          <Route path="/doctor/todo" element={<DoctorTodo />} />
          <Route path="/doctor/bookings" element={<DoctorBookings />} />
          <Route path="/doctor/chats" element={<DoctorChats />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/notes" element={<DoctorNotes />} />
          <Route path="/doctor/schedule" element={<DoctorSchedule />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
        </Route>

        {/* Admin */}
        <Route element={<AppLayout requiredRole="admin" />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/patients" element={<AdminPatients />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/consultations" element={<AdminConsultations />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global login popup */}
      <LoginModal />
    </>
  )
}
