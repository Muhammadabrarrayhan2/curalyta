# Curalyta Stability And Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the current patient, doctor, and admin prototype flows, then add an env-backed integration foundation for payment, push notification, storage, and AI without storing secrets in the UI.

**Architecture:** Add a shared `AppDataProvider` backed by pure store helpers seeded from the existing mock data and persisted to local storage. Refactor the visible patient, doctor, and admin actions to consume that shared store, then add a separate integration config module that parses browser-safe env values and renders status cards inside admin settings.

**Tech Stack:** React 18, React Router 6, Vite 5, Tailwind CSS 3, Vitest, Testing Library, jsdom

---

## Execution Preconditions

The current workspace is not a git repository, and a previous `npm install` failed because of local disk/cache issues. Fix those before executing the tasks below.

- Initialize version control once before Task 1:

```powershell
git init
git add .
git commit -m "chore: snapshot curalyta prototype"
```

- Free disk space and then refresh dependencies with the Windows-safe command:

```powershell
npm.cmd install
```

- Keep all real secret keys server-only. Only `VITE_` variables may be consumed by this browser app.

### Task 1: Add Front-End Test Harness

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `.gitignore`
- Create: `src/test/setup.js`
- Test: `src/context/__tests__/appDataStore.test.js`

- [ ] **Step 1: Add the test dependencies and scripts**

Update `package.json` so the scripts and dev dependencies include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "vite": "^5.3.5",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Configure Vitest and the test setup file**

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
```

Create `src/test/setup.js`:

```js
import '@testing-library/jest-dom'
```

Add these lines to `.gitignore` if they are not already present:

```gitignore
.env
.env.local
coverage
```

- [ ] **Step 3: Write the first failing store regression test**

Create `src/context/__tests__/appDataStore.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  createSeedState,
  createBooking,
  updateBookingStatus,
  selectDoctorIncomingBookings,
  selectPatientBookings,
} from '../appDataStore'

describe('appDataStore', () => {
  it('creates a booking that appears in both patient and doctor views', () => {
    const seed = createSeedState()

    const next = createBooking(seed, {
      patientId: 'pt-001',
      patientName: 'Raka Wijaya',
      doctorId: 'dr-003',
      doctorName: 'dr. Lestari Wahyuni, Sp.A',
      specialty: 'Anak',
      date: '2026-04-25',
      time: '09:00',
      mode: 'online',
      chief: 'Kontrol demam anak',
    })

    const patientBookings = selectPatientBookings(next, 'pt-001')
    const doctorBookings = selectDoctorIncomingBookings(next, 'dr-003')

    expect(patientBookings[0].doctorId).toBe('dr-003')
    expect(doctorBookings[0].patientId).toBe('pt-001')
    expect(doctorBookings[0].status).toBe('pending')
  })

  it('updates one canonical booking record when the doctor confirms it', () => {
    const seed = createSeedState()
    const created = createBooking(seed, {
      patientId: 'pt-001',
      patientName: 'Raka Wijaya',
      doctorId: 'dr-001',
      doctorName: 'dr. Ayu Pradipta, Sp.PD',
      specialty: 'Penyakit Dalam',
      date: '2026-04-26',
      time: '14:30',
      mode: 'online',
      chief: 'Kontrol lambung',
    })

    const bookingId = created.bookingIds[0]
    const confirmed = updateBookingStatus(created, bookingId, { status: 'confirmed' })

    expect(confirmed.bookingsById[bookingId].status).toBe('confirmed')
    expect(selectPatientBookings(confirmed, 'pt-001')[0].status).toBe('confirmed')
  })
})
```

- [ ] **Step 4: Run the test and verify the expected failure**

Run:

```powershell
npm.cmd test src/context/__tests__/appDataStore.test.js
```

Expected: FAIL with a module resolution error for `../appDataStore` because the store module does not exist yet.

- [ ] **Step 5: Commit**

```powershell
git add package.json vite.config.js .gitignore src/test/setup.js src/context/__tests__/appDataStore.test.js
git commit -m "test: add vitest harness for app data regressions"
```

### Task 2: Create The Shared App Data Store And Persistence Layer

**Files:**
- Create: `src/data/demoSeed.js`
- Create: `src/context/appDataStore.js`
- Create: `src/context/AppDataContext.jsx`
- Create: `src/lib/appDataStorage.js`
- Modify: `src/context/AuthContext.jsx`
- Test: `src/context/__tests__/appDataStore.test.js`

- [ ] **Step 1: Extend the failing tests to cover patient-scoped threads and audit events**

Append these test cases to `src/context/__tests__/appDataStore.test.js`:

```js
import {
  appendThreadMessage,
  updateAdminUserStatus,
  updateVerificationStatus,
  selectThreadByPatientId,
} from '../appDataStore'

it('isolates chat messages per patient thread', () => {
  const seed = createSeedState()

  const next = appendThreadMessage(seed, 'pt-001', {
    from: 'doctor',
    text: 'Silakan lanjutkan omeprazole selama 3 hari.',
    time: '15:00',
  })

  expect(selectThreadByPatientId(next, 'pt-001').messages.at(-1).text).toContain('omeprazole')
  expect(selectThreadByPatientId(next, 'pt-002').messages.at(-1).text).not.toContain('omeprazole')
})

it('records verification and user status changes in audit events', () => {
  const seed = createSeedState()
  const reviewed = updateVerificationStatus(seed, 'vr-101', {
    status: 'verified',
    actor: 'Satya Nugraha',
  })
  const suspended = updateAdminUserStatus(reviewed, 'u-6', {
    status: 'suspended',
    actor: 'Satya Nugraha',
  })

  expect(suspended.verificationQueue.find((item) => item.id === 'vr-101').status).toBe('verified')
  expect(suspended.adminUsers.find((item) => item.id === 'u-6').status).toBe('suspended')
  expect(suspended.auditEvents[0].action).toContain('status akun')
})
```

- [ ] **Step 2: Run the tests again and keep the expected failure red**

Run:

```powershell
npm.cmd test src/context/__tests__/appDataStore.test.js
```

Expected: FAIL because `src/context/appDataStore.js` still does not exist.

- [ ] **Step 3: Implement the seed data, pure store helpers, persistence utilities, and provider**

Create `src/data/demoSeed.js`:

```js
import { CONSULTATION_HISTORY, DOCTOR_PATIENTS, DOCTOR_VERIFICATIONS, DOCTORS, UPCOMING_BOOKINGS } from './mockData'

export const ADMIN_USERS_SEED = [
  { id: 'u-1', name: 'dr. Ayu Pradipta, Sp.PD', role: 'doctor', email: 'ayu.p@curalyta.id', lastLogin: '2 menit lalu', status: 'active' },
  { id: 'u-2', name: 'Raka Wijaya', role: 'patient', email: 'raka.w@curalyta.id', lastLogin: '1 jam lalu', status: 'active' },
  { id: 'u-3', name: 'dr. Hendra Sukarya, Sp.JP', role: 'doctor', email: 'hendra@curalyta.id', lastLogin: '3 jam lalu', status: 'active' },
  { id: 'u-4', name: 'Satya Nugraha', role: 'admin', email: 'satya@curalyta.id', lastLogin: 'Baru saja', status: 'active' },
  { id: 'u-5', name: 'Arif Ramli', role: 'patient', email: 'arif.r@curalyta.id', lastLogin: '14 hari lalu', status: 'inactive' },
  { id: 'u-6', name: 'dr. Tania Pranata', role: 'doctor', email: 'tania@curalyta.id', lastLogin: '—', status: 'suspended' },
]

export const THREADS_SEED = {
  'pt-001': {
    patientId: 'pt-001',
    doctorId: 'dr-001',
    unread: 2,
    time: '14:22',
    messages: [
      { from: 'doctor', text: 'Halo Raka. Saya dr. Ayu. Saya sudah baca keluhan nyeri ulu hati Anda.', time: '14:15' },
      { from: 'doctor', text: 'Boleh saya tanyakan, apakah nyerinya memburuk saat perut kosong, atau setelah makan?', time: '14:16' },
      { from: 'patient', text: 'Setelah makan, Dok. Terutama makanan pedas.', time: '14:20' },
      { from: 'doctor', text: 'Baik. Apakah ada mual atau muntah? Sudah coba obat apa saja?', time: '14:22' },
    ],
  },
  'pt-002': {
    patientId: 'pt-002',
    doctorId: 'dr-001',
    unread: 0,
    time: 'Kemarin',
    messages: [
      { from: 'patient', text: 'Dok, saya masih sesak sejak tadi malam.', time: '19:02' },
      { from: 'doctor', text: 'Baik, Bu. Apakah ada riwayat darah tinggi atau diabetes?', time: '19:05' },
    ],
  },
}

export function buildSeedBookings() {
  const seededUpcoming = UPCOMING_BOOKINGS.map((item) => ({
    ...item,
    patientId: 'pt-001',
    patientName: 'Raka Wijaya',
    source: 'seed',
  }))

  const seededFromDoctorQueue = DOCTOR_PATIENTS.map((patient, index) => ({
    id: `bk-seed-${index + 1}`,
    patientId: patient.id,
    patientName: patient.name,
    doctorId: 'dr-001',
    doctorName: 'dr. Ayu Pradipta, Sp.PD',
    specialty: 'Penyakit Dalam',
    date: patient.status === 'upcoming' ? '2026-04-22' : '2026-04-21',
    time: patient.bookingTime.split('·').at(-1)?.trim() ?? '09:00',
    mode: patient.mode,
    chief: patient.chief,
    status: patient.status === 'upcoming' ? 'pending' : 'confirmed',
    source: 'doctor-seed',
  }))

  return [...seededUpcoming, ...seededFromDoctorQueue]
}

export const DOCTORS_BY_ID = Object.fromEntries(DOCTORS.map((doctor) => [doctor.id, doctor]))
export const HISTORY_BY_ID = Object.fromEntries(CONSULTATION_HISTORY.map((item) => [item.id, item]))
export { DOCTOR_VERIFICATIONS }
```

Create `src/context/appDataStore.js`:

```js
import { DOCTOR_VERIFICATIONS, ADMIN_USERS_SEED, THREADS_SEED, buildSeedBookings } from '../data/demoSeed'

function buildNotifications(bookings) {
  return {
    patient: bookings.slice(0, 2).map((booking) => ({
      id: `ntf-p-${booking.id}`,
      title: 'Booking aktif',
      description: `${booking.doctorName} · ${booking.date} ${booking.time}`,
      createdAt: `${booking.date}T${booking.time}:00`,
      kind: 'booking',
    })),
    doctor: [],
    admin: [],
  }
}

export function createSeedState() {
  const bookings = buildSeedBookings()
  const bookingsById = Object.fromEntries(bookings.map((booking) => [booking.id, booking]))

  return {
    bookingsById,
    bookingIds: bookings.map((booking) => booking.id),
    threadsByPatientId: structuredClone(THREADS_SEED),
    notesByPatientId: {},
    notificationsByRole: buildNotifications(bookings),
    verificationQueue: structuredClone(DOCTOR_VERIFICATIONS),
    adminUsers: structuredClone(ADMIN_USERS_SEED),
    auditEvents: [],
  }
}

function withAudit(state, action, actor) {
  return {
    ...state,
    auditEvents: [
      {
        id: `audit-${Date.now()}`,
        time: 'Baru saja',
        actor,
        action,
        severity: 'info',
      },
      ...state.auditEvents,
    ],
  }
}

export function createBooking(state, payload) {
  const id = `bk-${state.bookingIds.length + 300}`
  const booking = { ...payload, id, status: 'pending', source: 'runtime' }

  return {
    ...state,
    bookingsById: { [id]: booking, ...state.bookingsById },
    bookingIds: [id, ...state.bookingIds],
    notificationsByRole: {
      ...state.notificationsByRole,
      patient: [
        {
          id: `ntf-p-${id}`,
          title: 'Booking dibuat',
          description: `${booking.doctorName} · ${booking.date} ${booking.time}`,
          createdAt: `${booking.date}T${booking.time}:00`,
          kind: 'booking',
        },
        ...state.notificationsByRole.patient,
      ],
      doctor: [
        {
          id: `ntf-d-${id}`,
          title: 'Booking baru masuk',
          description: `${booking.patientName} · ${booking.date} ${booking.time}`,
          createdAt: `${booking.date}T${booking.time}:00`,
          kind: 'booking',
        },
        ...state.notificationsByRole.doctor,
      ],
    },
  }
}

export function updateBookingStatus(state, bookingId, patch) {
  const current = state.bookingsById[bookingId]
  if (!current) return state

  return {
    ...state,
    bookingsById: {
      ...state.bookingsById,
      [bookingId]: {
        ...current,
        ...patch,
      },
    },
  }
}

export function appendThreadMessage(state, patientId, message) {
  const current = state.threadsByPatientId[patientId] ?? { patientId, doctorId: 'dr-001', unread: 0, time: message.time, messages: [] }

  return {
    ...state,
    threadsByPatientId: {
      ...state.threadsByPatientId,
      [patientId]: {
        ...current,
        time: message.time,
        messages: [...current.messages, message],
      },
    },
  }
}

export function updateVerificationStatus(state, verificationId, { status, actor, revisionNote = '' }) {
  const next = {
    ...state,
    verificationQueue: state.verificationQueue.map((item) =>
      item.id === verificationId ? { ...item, status, revisionNote } : item
    ),
  }

  return withAudit(next, `Status verifikasi ${verificationId} diubah menjadi ${status}`, actor)
}

export function updateAdminUserStatus(state, userId, { status, actor }) {
  const next = {
    ...state,
    adminUsers: state.adminUsers.map((item) =>
      item.id === userId ? { ...item, status } : item
    ),
  }

  return withAudit(next, `Status akun ${userId} diubah menjadi ${status}`, actor)
}

export function selectPatientBookings(state, patientId) {
  return state.bookingIds.map((id) => state.bookingsById[id]).filter((booking) => booking.patientId === patientId)
}

export function selectDoctorIncomingBookings(state, doctorId) {
  return state.bookingIds
    .map((id) => state.bookingsById[id])
    .filter((booking) => booking.doctorId === doctorId && ['pending', 'confirmed', 'rescheduled'].includes(booking.status))
}

export function selectThreadByPatientId(state, patientId) {
  return state.threadsByPatientId[patientId]
}
```

Create `src/lib/appDataStorage.js`:

```js
const STORAGE_KEY = 'curalyta.app-data.v1'

export function loadStoredAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('App data restore failed', error)
    return null
  }
}

export function persistAppData(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    console.warn('App data persist failed', error)
  }
}
```

Create `src/context/AppDataContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import {
  appendThreadMessage,
  createBooking,
  createSeedState,
  selectDoctorIncomingBookings,
  selectPatientBookings,
  selectThreadByPatientId,
  updateAdminUserStatus,
  updateBookingStatus,
  updateVerificationStatus,
} from './appDataStore'
import { loadStoredAppData, persistAppData } from '../lib/appDataStorage'

const AppDataContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'booking/create':
      return createBooking(state, action.payload)
    case 'booking/update-status':
      return updateBookingStatus(state, action.bookingId, action.patch)
    case 'thread/append-message':
      return appendThreadMessage(state, action.patientId, action.message)
    case 'verification/update-status':
      return updateVerificationStatus(state, action.verificationId, action.payload)
    case 'admin-user/update-status':
      return updateAdminUserStatus(state, action.userId, action.payload)
    default:
      return state
  }
}

export function AppDataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadStoredAppData() ?? createSeedState())

  useEffect(() => {
    persistAppData(state)
  }, [state])

  const value = useMemo(() => ({
    state,
    createBooking: (payload) => dispatch({ type: 'booking/create', payload }),
    updateBookingStatus: (bookingId, patch) => dispatch({ type: 'booking/update-status', bookingId, patch }),
    appendThreadMessage: (patientId, message) => dispatch({ type: 'thread/append-message', patientId, message }),
    updateVerificationStatus: (verificationId, payload) => dispatch({ type: 'verification/update-status', verificationId, payload }),
    updateAdminUserStatus: (userId, payload) => dispatch({ type: 'admin-user/update-status', userId, payload }),
    selectPatientBookings: (patientId) => selectPatientBookings(state, patientId),
    selectDoctorIncomingBookings: (doctorId) => selectDoctorIncomingBookings(state, doctorId),
    selectThreadByPatientId: (patientId) => selectThreadByPatientId(state, patientId),
  }), [state])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>')
  return ctx
}
```

Modify `src/context/AuthContext.jsx` so the provider becomes test-friendly:

```jsx
export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loading, setLoading] = useState(initialUser == null)

  useEffect(() => {
    if (initialUser) {
      setLoading(false)
      return
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setUser(JSON.parse(saved))
    } catch (e) {
      console.warn('Auth restore failed', e)
    }
    setLoading(false)
  }, [initialUser])
```

- [ ] **Step 4: Run the store tests and verify green**

Run:

```powershell
npm.cmd test src/context/__tests__/appDataStore.test.js
```

Expected: PASS with all four store tests green.

- [ ] **Step 5: Commit**

```powershell
git add src/data/demoSeed.js src/context/appDataStore.js src/context/AppDataContext.jsx src/lib/appDataStorage.js src/context/AuthContext.jsx src/context/__tests__/appDataStore.test.js
git commit -m "feat: add shared app data provider"
```

### Task 3: Wire The Shared Store Into Patient Booking, Bookings, Home, And Notifications

**Files:**
- Modify: `src/main.jsx`
- Create: `src/test/renderWithProviders.jsx`
- Modify: `src/pages/patient/PatientDoctors.jsx`
- Modify: `src/pages/patient/PatientBookings.jsx`
- Modify: `src/pages/patient/PatientHome.jsx`
- Modify: `src/pages/patient/PatientNotifications.jsx`
- Test: `src/pages/patient/__tests__/PatientBookingFlow.test.jsx`

- [ ] **Step 1: Write the failing patient booking integration test**

Create `src/test/renderWithProviders.jsx`:

```jsx
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { AppDataProvider } from '../context/AppDataContext'

export function renderWithProviders(ui, { user } = {}) {
  return render(
    <BrowserRouter>
      <AuthProvider initialUser={user}>
        <AppDataProvider>{ui}</AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

Create `src/pages/patient/__tests__/PatientBookingFlow.test.jsx`:

```jsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import PatientDoctors from '../PatientDoctors'
import PatientBookings from '../PatientBookings'

const patientUser = {
  id: 'pt-001',
  role: 'patient',
  name: 'Raka Wijaya',
  initials: 'RW',
}

test('completed patient booking appears in the bookings page', async () => {
  const user = userEvent.setup()

  renderWithProviders(
    <>
      <PatientDoctors />
      <PatientBookings />
    </>,
    { user: patientUser }
  )

  await user.click(screen.getByRole('button', { name: /dr. Lestari Wahyuni/i }))
  await user.click(screen.getByRole('button', { name: /Pilih Jadwal/i }))
  await user.click(screen.getAllByRole('button', { name: /Hari ini/i })[0])
  await user.click(screen.getByRole('button', { name: /Lanjut ke Keluhan/i }))
  await user.type(screen.getByPlaceholderText(/nyeri ulu hati/i), 'Anak saya demam tiga hari dan perlu kontrol.')
  await user.click(screen.getByRole('button', { name: /Konfirmasi Booking/i }))

  expect(await screen.findByText(/dr. Lestari Wahyuni, Sp.A/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the integration test and keep it red**

Run:

```powershell
npm.cmd test src/pages/patient/__tests__/PatientBookingFlow.test.jsx
```

Expected: FAIL because `PatientDoctors` still writes booking data only to local component state.

- [ ] **Step 3: Implement the patient-side store wiring**

Modify `src/main.jsx`:

```jsx
import { AppDataProvider } from './context/AppDataContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

Update the booking confirmation branch in `src/pages/patient/PatientDoctors.jsx`:

```jsx
import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'

function DoctorModal({ doctor, onClose }) {
  const { user } = useAuth()
  const { createBooking } = useAppData()

  const confirmBooking = () => {
    createBooking({
      patientId: user.id,
      patientName: user.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: selectedSlot.date === 'Hari ini' ? '2026-04-21' : selectedSlot.date === 'Besok' ? '2026-04-22' : '2026-04-23',
      time: selectedSlot.time,
      mode: selectedMode,
      chief,
    })
    setStep(4)
  }
```

And change the button handler:

```jsx
<button
  onClick={confirmBooking}
  disabled={chief.trim().length < 10}
  className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
>
  Konfirmasi Booking <ArrowRight size={14} />
</button>
```

Update `src/pages/patient/PatientBookings.jsx`:

```jsx
import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'

export default function PatientBookings() {
  const { user } = useAuth()
  const { selectPatientBookings } = useAppData()
  const [tab, setTab] = useState('upcoming')

  const bookings = selectPatientBookings(user.id)
  const upcoming = bookings.filter((item) => ['pending', 'confirmed', 'rescheduled'].includes(item.status))
  const past = bookings.filter((item) => ['completed', 'cancelled', 'rejected'].includes(item.status))
```

Update `src/pages/patient/PatientHome.jsx` and `src/pages/patient/PatientNotifications.jsx` to read `selectPatientBookings(user.id)` and `state.notificationsByRole.patient` from `useAppData()` rather than the static mock arrays.

- [ ] **Step 4: Run the patient booking integration test and verify green**

Run:

```powershell
npm.cmd test src/pages/patient/__tests__/PatientBookingFlow.test.jsx
```

Expected: PASS, and the new booking remains visible in `PatientBookings`.

- [ ] **Step 5: Commit**

```powershell
git add src/main.jsx src/test/renderWithProviders.jsx src/pages/patient/PatientDoctors.jsx src/pages/patient/PatientBookings.jsx src/pages/patient/PatientHome.jsx src/pages/patient/PatientNotifications.jsx src/pages/patient/__tests__/PatientBookingFlow.test.jsx
git commit -m "feat: connect patient booking flows to shared store"
```

### Task 4: Scope Doctor Chats, Consultations, And Incoming Bookings To Shared State

**Files:**
- Modify: `src/pages/doctor/DoctorChats.jsx`
- Modify: `src/pages/doctor/DoctorConsult.jsx`
- Modify: `src/pages/doctor/DoctorBookings.jsx`
- Modify: `src/pages/doctor/DoctorHome.jsx`
- Test: `src/pages/doctor/__tests__/DoctorConsultFlow.test.jsx`

- [ ] **Step 1: Write the failing doctor flow regression test**

Create `src/pages/doctor/__tests__/DoctorConsultFlow.test.jsx`:

```jsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import DoctorConsult from '../DoctorConsult'
import DoctorBookings from '../DoctorBookings'

const doctorUser = {
  id: 'dr-001',
  role: 'doctor',
  name: 'dr. Ayu Pradipta, Sp.PD',
  initials: 'AP',
}

test('doctor messages stay on the selected patient thread', async () => {
  const user = userEvent.setup()

  renderWithProviders(<DoctorConsult />, { user: doctorUser })

  await user.click(screen.getByRole('button', { name: /Raka Wijaya/i }))
  await user.type(screen.getByPlaceholderText(/Tulis pertanyaan atau respons/i), 'Mohon hindari makanan pedas dulu.')
  await user.keyboard('{Enter}')
  await user.click(screen.getByRole('button', { name: /Siti Hartini/i }))

  expect(screen.queryByText(/Mohon hindari makanan pedas dulu/i)).not.toBeInTheDocument()
})

test('doctor booking accept updates the shared booking status', async () => {
  const user = userEvent.setup()

  renderWithProviders(<DoctorBookings />, { user: doctorUser })

  await user.click(screen.getAllByRole('button', { name: /Terima/i })[0])

  expect(await screen.findByText(/confirmed/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the doctor regression test and verify the expected failure**

Run:

```powershell
npm.cmd test src/pages/doctor/__tests__/DoctorConsultFlow.test.jsx
```

Expected: FAIL because `DoctorConsult` still uses one message array and `DoctorBookings` buttons do not mutate shared state.

- [ ] **Step 3: Implement patient-scoped doctor behavior**

Update `src/pages/doctor/DoctorChats.jsx`:

```jsx
import { useAppData } from '../../context/AppDataContext'

export default function DoctorChats() {
  const { state } = useAppData()

  return (
    <Card padding={false}>
      <div className="divide-y divide-line-soft">
        {Object.values(state.threadsByPatientId).map((thread) => (
          <Link
            key={thread.patientId}
            to={`/doctor/consult?patientId=${thread.patientId}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-ivory transition-colors stagger-item"
          >
```

Update `src/pages/doctor/DoctorConsult.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'

export default function DoctorConsult() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectThreadByPatientId, appendThreadMessage } = useAppData()
  const [activeId, setActiveId] = useState(searchParams.get('patientId') || 'pt-002')

  useEffect(() => {
    const incoming = searchParams.get('patientId')
    if (incoming && incoming !== activeId) setActiveId(incoming)
  }, [activeId, searchParams])

  const thread = selectThreadByPatientId(activeId)

  const send = () => {
    if (!chatInput.trim()) return
    appendThreadMessage(activeId, { from: 'doctor', text: chatInput, time: 'Baru saja' })
    setChatInput('')
  }

  const choosePatient = (patientId) => {
    setActiveId(patientId)
    setSearchParams({ patientId })
  }
```

Replace the queue button handler:

```jsx
<button
  key={p.id}
  onClick={() => choosePatient(p.id)}
  className={classNames(
    'w-full text-left p-4 border-b border-line-soft transition-colors',
    activeId === p.id ? 'bg-ivory-deep' : 'hover:bg-ivory'
  )}
>
```

Update `src/pages/doctor/DoctorBookings.jsx`:

```jsx
import { useAppData } from '../../context/AppDataContext'
import { useAuth } from '../../context/AuthContext'

export default function DoctorBookings() {
  const { user } = useAuth()
  const { selectDoctorIncomingBookings, updateBookingStatus } = useAppData()
  const incoming = selectDoctorIncomingBookings(user.id)

  const reschedule = (booking) =>
    updateBookingStatus(booking.id, {
      status: 'rescheduled',
      date: '2026-04-27',
      time: '10:00',
    })
```

And bind the action buttons:

```jsx
<button
  onClick={() => updateBookingStatus(p.id, { status: 'confirmed' })}
  className="btn-primary text-[12px] px-3 py-1.5"
>
  <Check size={12} /> Terima
</button>
<button
  onClick={() => updateBookingStatus(p.id, { status: 'rejected' })}
  className="btn-ghost text-[12px] px-3 py-1.5 text-rose-medical border-rose-medical/30"
>
  <X size={12} /> Tolak
</button>
<button
  onClick={() => reschedule(p)}
  className="btn-ghost text-[12px] px-3 py-1.5"
>
  <Clock size={12} /> Reschedule
</button>
```

Update `src/pages/doctor/DoctorHome.jsx` so the counts and priority cards use `selectDoctorIncomingBookings(user.id)` instead of static `DOCTOR_PATIENTS`.

- [ ] **Step 4: Run the doctor regression test and verify green**

Run:

```powershell
npm.cmd test src/pages/doctor/__tests__/DoctorConsultFlow.test.jsx
```

Expected: PASS with patient-scoped messages and shared booking status changes.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/doctor/DoctorChats.jsx src/pages/doctor/DoctorConsult.jsx src/pages/doctor/DoctorBookings.jsx src/pages/doctor/DoctorHome.jsx src/pages/doctor/__tests__/DoctorConsultFlow.test.jsx
git commit -m "feat: scope doctor flows to shared booking and thread state"
```

### Task 5: Make Admin Verification, User Actions, And Audit Log Stateful

**Files:**
- Modify: `src/pages/admin/AdminVerifications.jsx`
- Modify: `src/pages/admin/AdminUsers.jsx`
- Modify: `src/pages/admin/AdminSecurity.jsx`
- Modify: `src/pages/admin/AdminHome.jsx`
- Test: `src/pages/admin/__tests__/AdminActions.test.jsx`

- [ ] **Step 1: Write the failing admin state regression test**

Create `src/pages/admin/__tests__/AdminActions.test.jsx`:

```jsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import AdminUsers from '../AdminUsers'
import AdminSecurity from '../AdminSecurity'
import AdminVerifications from '../AdminVerifications'

const adminUser = {
  id: 'adm-001',
  role: 'admin',
  name: 'Satya Nugraha',
  initials: 'SN',
}

test('suspending a user updates the user table and audit log', async () => {
  const user = userEvent.setup()

  renderWithProviders(
    <>
      <AdminUsers />
      <AdminSecurity />
    </>,
    { user: adminUser }
  )

  await user.click(screen.getByRole('button', { name: /Suspend/i }))

  expect(await screen.findByText(/suspended/i)).toBeInTheDocument()
  expect(await screen.findByText(/Status akun u-1 diubah menjadi suspended/i)).toBeInTheDocument()
})

test('approving a verification updates the queue', async () => {
  const user = userEvent.setup()

  renderWithProviders(<AdminVerifications />, { user: adminUser })

  await user.click(screen.getAllByRole('button', { name: /Setujui/i })[0])

  expect(await screen.findByText(/verified/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the admin regression test and keep it red**

Run:

```powershell
npm.cmd test src/pages/admin/__tests__/AdminActions.test.jsx
```

Expected: FAIL because the admin pages still own their own local arrays and the audit page never reads shared state.

- [ ] **Step 3: Implement shared admin actions and audit rendering**

Update `src/pages/admin/AdminVerifications.jsx`:

```jsx
import { useAppData } from '../../context/AppDataContext'

export default function AdminVerifications() {
  const { state, updateVerificationStatus } = useAppData()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const verifications = state.verificationQueue
  const filtered = verifications.filter((item) => filter === 'all' || item.status === filter)

  const review = (id, status, revisionNote = '') =>
    updateVerificationStatus(id, {
      status,
      revisionNote,
      actor: 'Satya Nugraha',
    })
```

Bind the action buttons:

```jsx
<button onClick={() => review(v.id, 'verified')} className="btn-ghost text-[12px] px-3 py-1.5 text-teal-900 border-teal-500/40">
  <Check size={12} /> Setujui
</button>
```

Update `src/pages/admin/AdminUsers.jsx`:

```jsx
import { useAppData } from '../../context/AppDataContext'

export default function AdminUsers() {
  const { state, updateAdminUserStatus } = useAppData()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')

  const filtered = state.adminUsers.filter(
    (u) =>
      (role === 'all' || u.role === role) &&
      [u.name, u.email].join(' ').toLowerCase().includes(q.toLowerCase())
  )
```

Bind the action buttons:

```jsx
<button
  onClick={() => updateAdminUserStatus(u.id, { status: u.status === 'active' ? 'suspended' : 'active', actor: 'Satya Nugraha' })}
  className="text-[11px] px-2 py-1 rounded hover:bg-ivory-deep text-ink-mute flex items-center gap-1"
>
  <Power size={10} /> {u.status === 'active' ? 'Suspend' : 'Reaktivasi'}
</button>
```

Update `src/pages/admin/AdminSecurity.jsx`:

```jsx
import { useAppData } from '../../context/AppDataContext'

export default function AdminSecurity() {
  const { state } = useAppData()
  const auditEvents = state.auditEvents.length > 0 ? state.auditEvents : AUDIT
```

Update `src/pages/admin/AdminHome.jsx` to derive pending verification count and active states from `state.verificationQueue` and `state.adminUsers`.

- [ ] **Step 4: Run the admin regression test and verify green**

Run:

```powershell
npm.cmd test src/pages/admin/__tests__/AdminActions.test.jsx
```

Expected: PASS, with shared verification state and audit entries now visible.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/admin/AdminVerifications.jsx src/pages/admin/AdminUsers.jsx src/pages/admin/AdminSecurity.jsx src/pages/admin/AdminHome.jsx src/pages/admin/__tests__/AdminActions.test.jsx
git commit -m "feat: make admin actions stateful across screens"
```

### Task 6: Add Env Parsing And Integration Status Cards

**Files:**
- Create: `.env.example`
- Create: `src/integrations/config.js`
- Create: `src/components/admin/IntegrationStatusCard.jsx`
- Modify: `src/pages/admin/AdminSettings.jsx`
- Modify: `README.md`
- Test: `src/integrations/__tests__/config.test.js`

- [ ] **Step 1: Write the failing env parser unit test**

Create `src/integrations/__tests__/config.test.js`:

```js
import { describe, expect, it } from 'vitest'
import { parseIntegrationConfig } from '../config'

describe('parseIntegrationConfig', () => {
  it('marks Midtrans as configured when browser-safe values are present', () => {
    const config = parseIntegrationConfig({
      VITE_PAYMENT_PROVIDER: 'midtrans',
      VITE_MIDTRANS_MODE: 'sandbox',
      VITE_MIDTRANS_CLIENT_KEY: 'mid-client-key',
      VITE_MIDTRANS_MERCHANT_ID: 'G123',
      VITE_MIDTRANS_SNAP_BASE_URL: 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    })

    expect(config.payment.status).toBe('configured')
    expect(config.payment.provider).toBe('Midtrans')
  })

  it('marks AI as partial when the model is missing', () => {
    const config = parseIntegrationConfig({
      VITE_AI_PROVIDER: 'openai-compatible',
      VITE_AI_BASE_URL: 'https://api.example.com/v1',
    })

    expect(config.ai.status).toBe('partial')
    expect(config.ai.messages).toContain('Missing VITE_AI_MODEL')
  })
})
```

- [ ] **Step 2: Run the env parser test and keep it red**

Run:

```powershell
npm.cmd test src/integrations/__tests__/config.test.js
```

Expected: FAIL because `src/integrations/config.js` does not exist yet.

- [ ] **Step 3: Implement the config parser, status card UI, and admin settings integration**

Create `.env.example`:

```env
# Browser-safe public config read by Vite
VITE_PAYMENT_PROVIDER=midtrans
VITE_MIDTRANS_MODE=sandbox
VITE_MIDTRANS_CLIENT_KEY=
VITE_MIDTRANS_MERCHANT_ID=
VITE_MIDTRANS_SNAP_BASE_URL=
VITE_MIDTRANS_WEBHOOK_URL=

VITE_PUSH_PROVIDER=fcm
VITE_FCM_PROJECT_ID=
VITE_FCM_APP_ID=
VITE_FCM_VAPID_KEY=
VITE_FCM_SENDER_ID=

VITE_STORAGE_PROVIDER=s3
VITE_S3_BUCKET=
VITE_S3_REGION=
VITE_S3_ENDPOINT=
VITE_S3_PUBLIC_BASE_URL=

VITE_AI_PROVIDER=openai-compatible
VITE_AI_BASE_URL=
VITE_AI_MODEL=
VITE_AI_PROJECT_LABEL=
VITE_AI_FEATURES=triage,note-draft,patient-education

# Server-only placeholders for the future backend
MIDTRANS_SERVER_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
AI_API_KEY=
```

Create `src/integrations/config.js`:

```js
function buildStatus(required, env) {
  const missing = required.filter((key) => !env[key])
  return {
    status: missing.length === 0 ? 'configured' : 'partial',
    messages: missing.map((key) => `Missing ${key}`),
  }
}

export function parseIntegrationConfig(env = import.meta.env) {
  const payment = env.VITE_PAYMENT_PROVIDER === 'midtrans'
    ? {
        provider: 'Midtrans',
        mode: env.VITE_MIDTRANS_MODE || 'sandbox',
        displayFields: [
          ['Client key', env.VITE_MIDTRANS_CLIENT_KEY ? 'configured' : 'missing'],
          ['Merchant ID', env.VITE_MIDTRANS_MERCHANT_ID || 'missing'],
          ['Snap URL', env.VITE_MIDTRANS_SNAP_BASE_URL || 'missing'],
        ],
        ...buildStatus(
          ['VITE_MIDTRANS_CLIENT_KEY', 'VITE_MIDTRANS_MERCHANT_ID', 'VITE_MIDTRANS_SNAP_BASE_URL'],
          env
        ),
        serverNotes: ['MIDTRANS_SERVER_KEY must stay in backend/server runtime'],
      }
    : { provider: 'Disabled', mode: 'off', displayFields: [], status: 'disabled', messages: [], serverNotes: [] }

  const push = env.VITE_PUSH_PROVIDER === 'fcm'
    ? {
        provider: 'Firebase Cloud Messaging',
        mode: 'web',
        displayFields: [
          ['Project ID', env.VITE_FCM_PROJECT_ID || 'missing'],
          ['App ID', env.VITE_FCM_APP_ID || 'missing'],
          ['Sender ID', env.VITE_FCM_SENDER_ID || 'missing'],
        ],
        ...buildStatus(['VITE_FCM_PROJECT_ID', 'VITE_FCM_APP_ID', 'VITE_FCM_SENDER_ID'], env),
        serverNotes: ['Firebase service account credentials must stay server-side'],
      }
    : { provider: 'Disabled', mode: 'off', displayFields: [], status: 'disabled', messages: [], serverNotes: [] }

  const storage = env.VITE_STORAGE_PROVIDER === 's3'
    ? {
        provider: 'S3-compatible storage',
        mode: 'client metadata',
        displayFields: [
          ['Bucket', env.VITE_S3_BUCKET || 'missing'],
          ['Region', env.VITE_S3_REGION || 'missing'],
          ['Endpoint', env.VITE_S3_ENDPOINT || 'missing'],
        ],
        ...buildStatus(['VITE_S3_BUCKET', 'VITE_S3_REGION', 'VITE_S3_ENDPOINT'], env),
        serverNotes: ['S3 secret credentials must stay in backend/server runtime'],
      }
    : { provider: 'Disabled', mode: 'off', displayFields: [], status: 'disabled', messages: [], serverNotes: [] }

  const ai = env.VITE_AI_PROVIDER === 'openai-compatible'
    ? {
        provider: 'OpenAI-compatible API',
        mode: 'client metadata',
        displayFields: [
          ['Base URL', env.VITE_AI_BASE_URL || 'missing'],
          ['Model', env.VITE_AI_MODEL || 'missing'],
          ['Features', env.VITE_AI_FEATURES || 'missing'],
        ],
        ...buildStatus(['VITE_AI_BASE_URL', 'VITE_AI_MODEL'], env),
        serverNotes: ['AI_API_KEY must stay in backend/server runtime'],
      }
    : { provider: 'Disabled', mode: 'off', displayFields: [], status: 'disabled', messages: [], serverNotes: [] }

  return { payment, push, storage, ai }
}
```

Create `src/components/admin/IntegrationStatusCard.jsx`:

```jsx
import { Card, Chip } from '../UI'

const STATUS_VARIANT = {
  configured: 'verified',
  partial: 'pending',
  invalid: 'urgent',
  disabled: 'neutral',
}

export default function IntegrationStatusCard({ title, config, envKeys }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-serif-display text-[18px]">{title}</div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-mute mt-1">
            {config.provider} · {config.mode}
          </div>
        </div>
        <Chip variant={STATUS_VARIANT[config.status]}>{config.status}</Chip>
      </div>

      <div className="space-y-2 text-[12.5px]">
        {config.displayFields.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-ink-mute">{label}</span>
            <span className="text-right">{value}</span>
          </div>
        ))}
      </div>

      {config.messages.length > 0 && (
        <div className="mt-4 rounded-lg border border-[#6B4E0C]/20 bg-[#F7E8C8]/50 p-3 text-[12px] text-[#6B4E0C]">
          {config.messages.join(' · ')}
        </div>
      )}

      <div className="mt-4 text-[11px] text-ink-mute leading-relaxed">
        Env keys: {envKeys.join(', ')}
      </div>

      <div className="mt-2 text-[11px] text-ink-mute leading-relaxed">
        {config.serverNotes.join(' · ')}
      </div>
    </Card>
  )
}
```

Update `src/pages/admin/AdminSettings.jsx`:

```jsx
import { parseIntegrationConfig } from '../../integrations/config'
import IntegrationStatusCard from '../../components/admin/IntegrationStatusCard'

export default function AdminSettings() {
  const integrations = parseIntegrationConfig()
```

Add a new section below the existing settings cards:

```jsx
<div className="mt-6">
  <PageHeader
    eyebrow="Integrations"
    title="API"
    titleAccent="Readiness"
    subtitle="Konfigurasi di bawah dibaca dari environment variable. Secret server-side tidak ditampilkan di browser."
  />

  <div className="grid md:grid-cols-2 gap-5">
    <IntegrationStatusCard
      title="Payment Gateway"
      config={integrations.payment}
      envKeys={['VITE_PAYMENT_PROVIDER', 'VITE_MIDTRANS_MODE', 'VITE_MIDTRANS_CLIENT_KEY', 'VITE_MIDTRANS_MERCHANT_ID', 'VITE_MIDTRANS_SNAP_BASE_URL']}
    />
    <IntegrationStatusCard
      title="Push Notification"
      config={integrations.push}
      envKeys={['VITE_PUSH_PROVIDER', 'VITE_FCM_PROJECT_ID', 'VITE_FCM_APP_ID', 'VITE_FCM_SENDER_ID']}
    />
    <IntegrationStatusCard
      title="Storage"
      config={integrations.storage}
      envKeys={['VITE_STORAGE_PROVIDER', 'VITE_S3_BUCKET', 'VITE_S3_REGION', 'VITE_S3_ENDPOINT']}
    />
    <IntegrationStatusCard
      title="AI API"
      config={integrations.ai}
      envKeys={['VITE_AI_PROVIDER', 'VITE_AI_BASE_URL', 'VITE_AI_MODEL', 'VITE_AI_FEATURES']}
    />
  </div>
</div>
```

Update the configuration copy in `README.md`:

```md
## Environment Configuration

Salin `.env.example` menjadi `.env` untuk browser-safe config Vite.

- Variabel `VITE_*` dipakai untuk metadata publik yang memang aman dibaca browser.
- Secret seperti `MIDTRANS_SERVER_KEY`, `S3_SECRET_ACCESS_KEY`, dan `AI_API_KEY` hanya placeholder untuk backend di masa lanjut dan tidak boleh dipakai langsung di client-side Vite app.
```

- [ ] **Step 4: Run the env parser tests and verify green**

Run:

```powershell
npm.cmd test src/integrations/__tests__/config.test.js
```

Expected: PASS with configured and partial statuses asserted correctly.

- [ ] **Step 5: Commit**

```powershell
git add .env.example src/integrations/config.js src/components/admin/IntegrationStatusCard.jsx src/pages/admin/AdminSettings.jsx README.md src/integrations/__tests__/config.test.js
git commit -m "feat: add env-backed integration readiness surface"
```

### Task 7: Add Mobile Navigation, Mobile Chat Fallback, And Final Verification

**Files:**
- Create: `src/lib/navigationItems.js`
- Create: `src/components/MobileNav.jsx`
- Modify: `src/components/AppLayout.jsx`
- Modify: `src/pages/patient/PatientChats.jsx`
- Test: `src/components/__tests__/MobileNav.test.jsx`
- Test: `src/pages/patient/__tests__/PatientChatsMobile.test.jsx`

- [ ] **Step 1: Write the failing mobile navigation and chat tests**

Create `src/components/__tests__/MobileNav.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MobileNav from '../MobileNav'

test('renders role-aware mobile navigation items', () => {
  render(
    <MemoryRouter>
      <MobileNav role="patient" />
    </MemoryRouter>
  )

  expect(screen.getByRole('link', { name: /Beranda/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Cari Dokter/i })).toBeInTheDocument()
})
```

Create `src/pages/patient/__tests__/PatientChatsMobile.test.jsx`:

```jsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderWithProviders'
import PatientChats from '../PatientChats'

const patientUser = {
  id: 'pt-001',
  role: 'patient',
  name: 'Raka Wijaya',
  initials: 'RW',
}

test('mobile chat can open a thread and go back to the list', async () => {
  const user = userEvent.setup()

  renderWithProviders(<PatientChats />, { user: patientUser })

  await user.click(screen.getByRole('button', { name: /dr. Ayu/i }))

  expect(await screen.findByRole('button', { name: /Kembali ke percakapan/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the mobile tests and keep them red**

Run:

```powershell
npm.cmd test src/components/__tests__/MobileNav.test.jsx src/pages/patient/__tests__/PatientChatsMobile.test.jsx
```

Expected: FAIL because there is no `MobileNav` component and `PatientChats` has no mobile thread state.

- [ ] **Step 3: Implement the mobile navigation and chat fallback**

Create `src/lib/navigationItems.js`:

```js
export const MOBILE_MENUS = {
  patient: [
    { to: '/patient', label: 'Beranda' },
    { to: '/patient/doctors', label: 'Cari Dokter' },
    { to: '/patient/bookings', label: 'Jadwal' },
    { to: '/patient/chats', label: 'Chat' },
  ],
  doctor: [
    { to: '/doctor', label: 'Beranda' },
    { to: '/doctor/bookings', label: 'Booking' },
    { to: '/doctor/consult', label: 'Konsultasi' },
    { to: '/doctor/chats', label: 'Chat' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/verifications', label: 'Verifikasi' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/settings', label: 'Settings' },
  ],
}
```

Create `src/components/MobileNav.jsx`:

```jsx
import { NavLink } from 'react-router-dom'
import { MOBILE_MENUS } from '../lib/navigationItems'

export default function MobileNav({ role }) {
  const items = MOBILE_MENUS[role] ?? []

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line-soft bg-ivory-paper/95 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-xl px-2 py-2 text-center text-[11px] font-medium ${isActive ? 'bg-teal-900 text-ivory' : 'text-ink-mute'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

Update `src/components/AppLayout.jsx`:

```jsx
import MobileNav from './MobileNav'

export default function AppLayout({ requiredRole }) {
  const { user, loading } = useAuth()

  if (loading || !user) return null

  return (
    <div className="min-h-screen relative z-10 pb-20 md:pb-0">
      <TopBar />
      <div className="max-w-[1440px] mx-auto flex">
        <Sidebar role={user.role} />
        <main className="flex-1 min-w-0 px-4 md:px-10 py-6 md:py-8 pb-24">
          <Outlet />
        </main>
      </div>
      <MobileNav role={user.role} />
    </div>
  )
}
```

Update `src/pages/patient/PatientChats.jsx`:

```jsx
const [chats, setChats] = useState(INITIAL_CHATS)
const [active, setActive] = useState(INITIAL_CHATS[0].id)
const [mobileThreadOpen, setMobileThreadOpen] = useState(false)

const openThread = (id) => {
  setActive(id)
  setMobileThreadOpen(true)
}
```

Change the thread list button:

```jsx
<button
  key={c.id}
  onClick={() => openThread(c.id)}
  className={classNames(
    'w-full text-left px-4 py-3.5 border-b border-line-soft flex gap-3 transition-colors',
    active === c.id ? 'bg-ivory-deep' : 'hover:bg-ivory'
  )}
>
```

Wrap the thread panes with mobile-friendly conditional classes:

```jsx
<div className={classNames('col-span-12 md:col-span-4 border-r border-line-soft flex flex-col', mobileThreadOpen ? 'hidden md:flex' : 'flex')}>
```

```jsx
<div className={classNames('col-span-12 md:col-span-8 flex-col', mobileThreadOpen ? 'flex' : 'hidden md:flex')}>
  <div className="px-5 py-3.5 border-b border-line-soft flex items-center justify-between">
    <div className="flex items-center gap-3">
      <button onClick={() => setMobileThreadOpen(false)} className="md:hidden text-[12px] text-teal-700">
        Kembali ke percakapan
      </button>
```

- [ ] **Step 4: Run the targeted mobile tests, the full suite, and the build**

Run:

```powershell
npm.cmd test
npm.cmd run build
```

Expected:
- `npm.cmd test` => PASS with all regression suites green
- `npm.cmd run build` => PASS and Vite emits a production bundle without errors

- [ ] **Step 5: Commit**

```powershell
git add src/lib/navigationItems.js src/components/MobileNav.jsx src/components/AppLayout.jsx src/pages/patient/PatientChats.jsx src/components/__tests__/MobileNav.test.jsx src/pages/patient/__tests__/PatientChatsMobile.test.jsx
git commit -m "feat: add mobile navigation and chat fallback"
```
