import { Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { getInitials, getRoleColor } from '@/lib/utils'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar onLogout={handleLogout} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
            <div className={`
              flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold shadow-lg
              ${getRoleColor(user?.role || '')}
            `}>
              {getInitials(`${user?.first_name} ${user?.last_name}`)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
