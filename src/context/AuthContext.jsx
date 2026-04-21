import { createContext, useContext, useState, useEffect } from 'react'

/**
 * AuthContext — Curalyta
 *
 * ============================================================
 * CATATAN PENTING UNTUK DEVELOPER:
 * ============================================================
 * Saat ini autentikasi menggunakan POPUP role-selector (tanpa
 * email/password). Struktur API di bawah sudah dibuat agar
 * nanti tinggal diganti implementasinya menjadi email/password
 * atau OAuth tanpa perlu mengubah komponen lain.
 *
 * Method yang tersedia:
 *  - login(role, profileOverrides)
 *  - logout()
 *  - updateProfile(patch)
 *  - currentRole: 'patient' | 'doctor' | 'admin' | null
 *
 * Untuk mengganti ke email auth nanti, cukup ubah fungsi
 * login() di dalam provider untuk memanggil backend,
 * dan tambahkan register(). Selebihnya tidak perlu diubah.
 * ============================================================
 */

const AuthContext = createContext(null)

const MOCK_PROFILES = {
  patient: {
    id: 'pt-001',
    role: 'patient',
    name: 'Raka Wijaya',
    initials: 'RW',
    age: 29,
    gender: 'Laki-laki',
    phone: '+62 812-3456-7890',
    location: 'Jakarta Selatan',
    bloodType: 'O+',
    allergies: ['Amoksisilin'],
    chronicConditions: [],
  },
  doctor: {
    id: 'dr-001',
    role: 'doctor',
    name: 'dr. Ayu Pradipta, Sp.PD',
    initials: 'AP',
    specialty: 'Penyakit Dalam',
    strNumber: '1.1.1.1.1.23-1-2020-123456',
    sipNumber: '449.1/0012/SIP-DPMPTSP/II/2024',
    verified: true,
    experience: 11,
    rating: 4.9,
    reviewCount: 312,
    fee: 150000,
    hospital: 'RS Medika Citra',
    location: 'Jakarta Selatan',
  },
  admin: {
    id: 'adm-001',
    role: 'admin',
    name: 'Satya Nugraha',
    initials: 'SN',
    position: 'Clinical Operations Lead',
    department: 'Platform Trust & Safety',
  },
}

const STORAGE_KEY = 'curalyta.session.v1'

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setUser(JSON.parse(saved))
      } else if (initialUser) {
        setUser(initialUser)
        persist(initialUser)
      }
    } catch (e) {
      console.warn('Auth restore failed', e)
    }
    setLoading(false)
  }, [initialUser])

  const persist = (next) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const login = (role, overrides = {}) => {
    const base = MOCK_PROFILES[role]
    if (!base) throw new Error(`Unknown role: ${role}`)
    const next = { ...base, ...overrides, loggedInAt: Date.now() }
    setUser(next)
    persist(next)
    setLoginOpen(false)
    return next
  }

  const logout = () => {
    setUser(null)
    persist(null)
  }

  const updateProfile = (patch) => {
    setUser((u) => {
      if (!u) return u
      const next = { ...u, ...patch }
      persist(next)
      return next
    })
  }

  const openLogin = () => setLoginOpen(true)
  const closeLogin = () => setLoginOpen(false)

  const value = {
    user,
    loading,
    currentRole: user?.role ?? null,
    login,
    logout,
    updateProfile,
    loginOpen,
    openLogin,
    closeLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
