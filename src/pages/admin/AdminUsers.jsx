import PageHeader from '../../components/PageHeader'
import { Card, Chip } from '../../components/UI'
import { Search, ShieldAlert, RotateCw, Power } from 'lucide-react'
import { useState } from 'react'

const USERS = [
  { id: 'u-1', name: 'dr. Ayu Pradipta, Sp.PD', role: 'doctor', email: 'ayu.p@curalyta.id', lastLogin: '2 menit lalu', status: 'active' },
  { id: 'u-2', name: 'Raka Wijaya', role: 'patient', email: 'raka.w@curalyta.id', lastLogin: '1 jam lalu', status: 'active' },
  { id: 'u-3', name: 'dr. Hendra Sukarya, Sp.JP', role: 'doctor', email: 'hendra@curalyta.id', lastLogin: '3 jam lalu', status: 'active' },
  { id: 'u-4', name: 'Satya Nugraha', role: 'admin', email: 'satya@curalyta.id', lastLogin: 'Baru saja', status: 'active' },
  { id: 'u-5', name: 'Arif Ramli', role: 'patient', email: 'arif.r@curalyta.id', lastLogin: '14 hari lalu', status: 'inactive' },
  { id: 'u-6', name: 'dr. Tania Pranata', role: 'doctor', email: 'tania@curalyta.id', lastLogin: '—', status: 'suspended' },
]

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const filtered = USERS.filter(
    (u) => (role === 'all' || u.role === role) && u.name.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <PageHeader
        eyebrow="Trust & Safety"
        title="Manajemen"
        titleAccent="User"
        subtitle="Kelola akses, status akun, dan reset keamanan. Semua aksi tercatat di audit log."
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-ivory-paper border border-line-soft rounded-[14px] p-1.5 shadow-soft">
          <Search size={15} className="text-ink-mute ml-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau email…"
            className="flex-1 bg-transparent outline-none text-[13.5px] py-2 pr-2"
          />
        </div>
        {['all', 'doctor', 'patient', 'admin'].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={
              'px-4 py-2 rounded-full text-[12.5px] font-medium border transition-all capitalize ' +
              (role === r
                ? 'bg-teal-900 text-ivory border-teal-900'
                : 'bg-ivory-paper border-line text-ink-soft hover:border-teal-500')
            }
          >
            {r === 'all' ? 'Semua Role' : r}
          </button>
        ))}
      </div>

      <Card padding={false}>
        <div className="divide-y divide-line-soft">
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-ink-mute bg-ivory-deep/40">
            <div className="col-span-4">Nama</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Login Terakhir</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-ivory transition-colors group">
              <div className="col-span-4 text-[13px] font-medium truncate">{u.name}</div>
              <div className="col-span-3 text-[11.5px] font-mono text-ink-mute truncate">{u.email}</div>
              <div className="col-span-2">
                <Chip variant={u.role === 'admin' ? 'ai' : u.role === 'doctor' ? 'verified' : 'neutral'}>{u.role}</Chip>
              </div>
              <div className="col-span-2 text-[11.5px] font-mono text-ink-mute">{u.lastLogin}</div>
              <div className="col-span-1 text-right flex items-center justify-end gap-1">
                <Chip variant={u.status === 'active' ? 'verified' : u.status === 'inactive' ? 'neutral' : 'urgent'}>
                  {u.status}
                </Chip>
              </div>
              <div className="col-span-12 flex gap-1 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[11px] px-2 py-1 rounded hover:bg-ivory-deep text-ink-mute flex items-center gap-1">
                  <RotateCw size={10} /> Reset Password
                </button>
                <button className="text-[11px] px-2 py-1 rounded hover:bg-ivory-deep text-ink-mute flex items-center gap-1">
                  <Power size={10} /> {u.status === 'active' ? 'Suspend' : 'Reaktivasi'}
                </button>
                <button className="text-[11px] px-2 py-1 rounded hover:bg-rose-soft text-rose-medical flex items-center gap-1">
                  <ShieldAlert size={10} /> Force Logout
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
