import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">SERRÔ</span>
            <span className="hidden text-xs font-medium text-muted sm:block">Hotelaria</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/para-hoteis"
              className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              Para Hotéis
            </Link>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-sm text-muted">
        <p>SERRÔ Hotelaria &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
