import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn, getRoleLabel } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  UserCircle,
  Users,
  Building2,
  ClipboardList,
  UtensilsCrossed,
  ShoppingCart,
  BarChart3,
  Wrench,
  Tag,
  Star,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface MenuItem {
  label: string
  icon: LucideIcon
  href: string
  roles: string[]
}

const menuItems: Record<string, MenuItem[]> = {
  general: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['HO', 'AT', 'SV', 'GE'] },
    { label: 'Meu Perfil', icon: UserCircle, href: '/me', roles: ['HO', 'AT', 'SV', 'GE'] },
  ],
  hospede: [
    { label: 'Minhas Reservas', icon: CalendarCheck, href: '/minhas-reservas', roles: ['HO'] },
    { label: 'Check-in Online', icon: BedDouble, href: '/checkin', roles: ['HO'] },
    { label: 'Extrato', icon: ClipboardList, href: '/extrato', roles: ['HO'] },
    { label: 'Serviços de Quarto', icon: ShoppingCart, href: '/servicos', roles: ['HO'] },
    { label: 'Fidelidade', icon: Star, href: '/fidelidade', roles: ['HO'] },
  ],
  admin: [
    { label: 'Quartos', icon: Building2, href: '/admin/quartos', roles: ['AT', 'SV', 'GE'] },
    { label: 'Check-in/out', icon: CalendarCheck, href: '/admin/checkin', roles: ['AT', 'SV', 'GE'] },
    { label: 'Hóspedes', icon: Users, href: '/admin/hospedes', roles: ['AT', 'SV', 'GE'] },
    { label: 'Cardápio', icon: UtensilsCrossed, href: '/admin/cardapio', roles: ['AT', 'SV', 'GE'] },
    { label: 'Lançar Consumo', icon: ShoppingCart, href: '/admin/consumo', roles: ['AT', 'SV', 'GE'] },
    { label: 'Categorias', icon: Tag, href: '/admin/categorias', roles: ['SV', 'GE'] },
    { label: 'Manutenção', icon: Wrench, href: '/admin/manutencao', roles: ['SV', 'GE'] },
    { label: 'Funcionários', icon: Users, href: '/admin/funcionarios', roles: ['GE'] },
    { label: 'Meu Hotel', icon: Building2, href: '/admin/hotel', roles: ['GE'] },
    { label: 'Tarifas', icon: BarChart3, href: '/admin/tarifas', roles: ['GE'] },
    { label: 'Relatórios', icon: BarChart3, href: '/admin/relatorios', roles: ['GE'] },
  ],
}

const BACKEND_READY = ['/admin/funcionarios', '/admin/hospedes', '/admin/hotel', '/admin/categorias', '/admin/quartos', '/admin/tarifas', '/me']

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const { role } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const filteredItems = [
    ...menuItems.general.filter(i => i.roles.includes(role || '')),
    ...(role === 'HO' ? menuItems.hospede : []),
    ...(role && ['AT', 'SV', 'GE'].includes(role) ? menuItems.admin.filter(i => i.roles.includes(role)) : []),
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/20">
          S
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">SERRÔ</span>
          <span className="block text-xs text-muted font-medium">Hotelaria</span>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
          <ChevronRight className="h-3 w-3" />
          {getRoleLabel(role || '')}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href
          const isAdminRoute = item.href.startsWith('/admin/') && item.href !== '/'
          const ready = !isAdminRoute || BACKEND_READY.includes(item.href)

          return (
            <Link
              key={item.href}
              to={ready ? item.href : '#'}
              onClick={(e) => {
                if (!ready) e.preventDefault()
              }}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                !ready && 'opacity-40 cursor-not-allowed',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {!ready && (
                <span className="text-[10px] font-medium text-muted bg-gray-100 px-1.5 py-0.5 rounded">EM BREVE</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
