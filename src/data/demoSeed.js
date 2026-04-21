import {
  ADMIN_STATS,
  CONSULTATION_HISTORY,
  DOCTORS,
  DOCTOR_PATIENTS,
  DOCTOR_VERIFICATIONS,
  UPCOMING_BOOKINGS,
} from './mockData'

const DEMO_PATIENTS = [
  {
    id: 'pt-001',
    name: 'Raka Wijaya',
    initials: 'RW',
    age: 29,
    gender: 'Laki-laki',
    phone: '+62 812-3456-7890',
    location: 'Jakarta Selatan',
  },
  {
    id: 'pt-002',
    name: 'Siti Hartini',
    initials: 'SH',
    age: 58,
    gender: 'Perempuan',
    phone: '+62 812-9900-1122',
    location: 'Jakarta Barat',
  },
]

const DEMO_ADMIN_USERS = [
  { id: 'u-1', name: 'dr. Ayu Pradipta, Sp.PD', role: 'doctor', email: 'ayu.p@curalyta.id', lastLogin: '2 menit lalu', status: 'active' },
  { id: 'u-2', name: 'Raka Wijaya', role: 'patient', email: 'raka.w@curalyta.id', lastLogin: '1 jam lalu', status: 'active' },
  { id: 'u-3', name: 'dr. Hendra Sukarya, Sp.JP', role: 'doctor', email: 'hendra@curalyta.id', lastLogin: '3 jam lalu', status: 'active' },
  { id: 'u-4', name: 'Satya Nugraha', role: 'admin', email: 'satya@curalyta.id', lastLogin: 'Baru saja', status: 'active' },
  { id: 'u-5', name: 'Arif Ramli', role: 'patient', email: 'arif.r@curalyta.id', lastLogin: '14 hari lalu', status: 'inactive' },
  { id: 'u-6', name: 'dr. Tania Pranata', role: 'doctor', email: 'tania@curalyta.id', lastLogin: '-', status: 'suspended' },
]

const DEMO_THREADS = [
  {
    id: 'th-pt-001',
    patientId: 'pt-001',
    patientName: 'Raka Wijaya',
    doctorId: 'dr-001',
    doctorName: 'dr. Ayu Pradipta, Sp.PD',
    unread: 2,
    time: '14:22',
    messages: [
      {
        id: 'msg-001',
        from: 'doctor',
        text: 'Halo Raka. Saya dr. Ayu. Saya sudah baca keluhan nyeri ulu hati Anda.',
        time: '14:15',
      },
      {
        id: 'msg-002',
        from: 'doctor',
        text: 'Boleh saya tanyakan, apakah nyerinya memburuk saat perut kosong, atau setelah makan?',
        time: '14:16',
      },
      {
        id: 'msg-003',
        from: 'patient',
        text: 'Setelah makan, Dok. Terutama makanan pedas.',
        time: '14:20',
      },
      {
        id: 'msg-004',
        from: 'doctor',
        text: 'Baik. Apakah ada mual atau muntah? Sudah coba obat apa saja?',
        time: '14:22',
      },
    ],
  },
  {
    id: 'th-pt-002',
    patientId: 'pt-002',
    patientName: 'Siti Hartini',
    doctorId: 'dr-002',
    doctorName: 'dr. Hendra Sukarya, Sp.JP',
    unread: 0,
    time: 'Kemarin',
    messages: [
      {
        id: 'msg-005',
        from: 'doctor',
        text: 'Ibu Siti, apakah sesaknya membaik setelah istirahat tadi malam?',
        time: '19:05',
      },
      {
        id: 'msg-006',
        from: 'patient',
        text: 'Sudah lebih baik, Dok. Dada masih terasa agak berat.',
        time: '19:10',
      },
    ],
  },
]

const DEMO_BOOKINGS = [
  ...UPCOMING_BOOKINGS.map((booking) => ({
    ...booking,
    patientId: 'pt-001',
    patientName: 'Raka Wijaya',
  })),
  {
    id: 'bk-222',
    patientId: 'pt-002',
    patientName: 'Siti Hartini',
    doctorId: 'dr-002',
    doctorName: 'dr. Hendra Sukarya, Sp.JP',
    specialty: 'Jantung & Pembuluh Darah',
    date: '2026-04-24',
    time: '09:00',
    mode: 'offline',
    chief: 'Kontrol sesak napas ringan',
    status: 'pending',
  },
]

export const DEMO_SEED = {
  patients: DEMO_PATIENTS,
  doctors: DOCTORS,
  bookings: DEMO_BOOKINGS,
  threads: DEMO_THREADS,
  verifications: DOCTOR_VERIFICATIONS,
  adminUsers: DEMO_ADMIN_USERS,
  doctorPatients: DOCTOR_PATIENTS,
  consultationHistory: CONSULTATION_HISTORY,
  adminStats: ADMIN_STATS,
  auditEvents: [],
}
