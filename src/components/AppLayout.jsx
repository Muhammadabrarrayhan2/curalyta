import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'

export default function AppLayout({ requiredRole }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/', { replace: true })
      return
    }
    if (requiredRole && user.role !== requiredRole) {
      navigate(`/${user.role}`, { replace: true })
    }
  }, [user, loading, requiredRole, navigate])

  if (loading || !user) return null

  return (
    <div className="min-h-screen relative z-10">
      <TopBar />
      <div className="max-w-[1440px] mx-auto flex">
        <Sidebar role={user.role} />
        <main className="flex-1 min-w-0 px-6 md:px-10 py-8 pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
