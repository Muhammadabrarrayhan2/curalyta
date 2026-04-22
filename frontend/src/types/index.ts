// ============================================================
// Shared TypeScript types mirroring backend API responses
// ============================================================

export type UserRole = 'DOCTOR' | 'PATIENT' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type Consciousness = 'ALERT' | 'CONFUSION' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
export type NotificationType = 'TASK' | 'APPOINTMENT' | 'VERIFICATION' | 'SYSTEM' | 'MESSAGE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  sipNumber: string | null;
  experience: number;
  institution: string;
  bio: string | null;
  schedule: string | null;
  photoUrl: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'email' | 'name' | 'phone' | 'lastLoginAt' | 'createdAt'>;
  stats?: { patientCount: number; appointmentCount: number; taskCount: number };
}

export interface PatientProfile {
  id: string;
  userId: string | null;
  name: string;
  dateOfBirth: string;
  gender: Gender;
  address: string | null;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  emergencyContact: string | null;
  emergencyContactName: string | null;
  doctorId: string | null;
  createdAt: string;
  latestVitals?: VitalSign | null;
  news2?: News2;
  priority?: number;
  doctor?: DoctorProfile | null;
  anomalies?: Anomaly[];
  observationCount?: number;
  consultationCount?: number;
}

export interface Observation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  notes: string | null;
  createdAt: string;
  doctor?: { user: { name: string } };
}

export interface VitalSign {
  id: string;
  patientId: string;
  date: string;
  heartRate: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  respirationRate: number | null;
  bloodGlucose: number | null;
  weight: number | null;
  height: number | null;
  consciousness: Consciousness | null;
  news2Score: number | null;
  notes: string | null;
  createdAt: string;
}

export interface News2 {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  breakdown: { label: string; points: number }[];
}

export interface Anomaly {
  metric: string;
  value: number;
  mean: number;
  zScore: number;
  direction: 'tinggi' | 'rendah';
}

export interface Trend {
  trend: 'stable' | 'rising' | 'falling';
  slope: number;
}

export interface Task {
  id: string;
  doctorId: string;
  patientId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  duration: number;
  reason: string | null;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  patient?: Pick<PatientProfile, 'id' | 'name' | 'dateOfBirth' | 'gender'>;
  doctor?: { user: { name: string } };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User & {
    doctor?: DoctorProfile | null;
    patient?: PatientProfile | null;
  };
}

export interface DoctorDashboard {
  stats: {
    totalPatients: number;
    appointmentsToday: number;
    pendingTasks: number;
    overdueTasks: number;
    highPriorityPatients: number;
  };
  appointmentsToday: Appointment[];
  tasks: Task[];
  criticalPatients: PatientProfile[];
  recentPatients: PatientProfile[];
  recentObservations: (Observation & { patient: { id: string; name: string } })[];
}

export interface PatientDashboard {
  patient: PatientProfile & { doctor: DoctorProfile | null };
  stats: {
    observationCount: number;
    upcomingAppointments: number;
  };
  latestVitals: VitalSign | null;
  upcomingAppointments: Appointment[];
  recentObservations: (Observation & { doctor: { user: { name: string } } })[];
}

export interface AdminStats {
  stats: {
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
    pendingVerifications: number;
    activeUsers: number;
    totalObservations: number;
    totalAppointments: number;
  };
  recentSignups: User[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
