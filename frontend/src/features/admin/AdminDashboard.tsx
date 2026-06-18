import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/features/shared/Card'
import { getRoleLabel } from '@/lib/utils'
import {
  BedDouble,
  Users,
  DollarSign,
  CalendarCheck,
  Building2,
  UtensilsCrossed,
  ShoppingCart,
  BarChart3,
  Tag,
  Wrench,
  UserCog,
  TrendingUp,
} from 'lucide-react'

const statsCards = [
  { label: 'Quartos Ocupados', value: '12/20', icon: BedDouble, color: 'bg-blue-500', change: '+2 hoje' },
  { label: 'Check-ins Hoje', value: '5', icon: CalendarCheck, color: 'bg-green-500', change: '3 pendentes' },
  { label: 'Check-outs Hoje', value: '3', icon: Users, color: 'bg-orange-500', change: 'Até 12h' },
  { label: 'Faturamento Hoje', value: 'R$ 4.520', icon: DollarSign, color: 'bg-purple-500', change: '+15% vs ontem' },
]

const menuGrid = [
  { label: 'Quartos', icon: Building2, href: '/admin/quartos', roles: ['AT', 'SV', 'GE'], ready: false },
  { label: 'Check-in/out', icon: CalendarCheck, href: '/admin/checkin', roles: ['AT', 'SV', 'GE'], ready: false },
  { label: 'Hóspedes', icon: Users, href: '/admin/hospedes', roles: ['AT', 'SV', 'GE'], ready: true },
  { label: 'Funcionários', icon: UserCog, href: '/admin/funcionarios', roles: ['GE'], ready: true },
  { label: 'Meu Hotel', icon: Building2, href: '/admin/hotel', roles: ['GE'], ready: true },
  { label: 'Cardápio', icon: UtensilsCrossed, href: '/admin/cardapio', roles: ['AT', 'SV', 'GE'], ready: false },
  { label: 'Lançar Consumo', icon: ShoppingCart, href: '/admin/consumo', roles: ['AT', 'SV', 'GE'], ready: false },
  { label: 'Categorias', icon: Tag, href: '/admin/categorias', roles: ['SV', 'GE'], ready: false },
  { label: 'Manutenção', icon: Wrench, href: '/admin/manutencao', roles: ['SV', 'GE'], ready: false },
  { label: 'Tarifas', icon: TrendingUp, href: '/admin/tarifas', roles: ['GE'], ready: false },
  { label: 'Relatórios', icon: BarChart3, href: '/admin/relatorios', roles: ['GE'], ready: false },
]

export function AdminDashboard() {
  const { role } = useAuth()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const filteredMenu = menuGrid.filter(m => m.roles.includes(role || ''))

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted mt-1">
            Visão geral do hotel · {getRoleLabel(role || '')}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color} text-white`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted mt-3">{stat.change}</p>
          </Card>
        ))}
      </motion.div>

      {/* Quick Menu */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredMenu.map((item) => (
            <button
              key={item.label}
              disabled={!item.ready}
              className="group relative flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-lg shadow-gray-200/50 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-900">{item.label}</span>
              {!item.ready && (
                <span className="text-[10px] font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                  EM BREVE
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Últimas Movimentações</h3>
          </div>
          <div className="space-y-3">
            {[
              { time: '14:30', text: 'Check-in realizado — Apt 204 — João Silva', type: 'checkin' },
              { time: '14:15', text: 'Despesa lançada — Apt 102 — R$ 89,00 — Frigobar', type: 'despesa' },
              { time: '12:00', text: 'Check-out realizado — Apt 301 — Maria Oliveira', type: 'checkout' },
              { time: '11:30', text: 'Reserva confirmada — Apt 105 — Pedro Santos', type: 'reserva' },
            ].map((mov, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`
                  h-2 w-2 rounded-full
                  ${mov.type === 'checkin' ? 'bg-green-500' : ''}
                  ${mov.type === 'despesa' ? 'bg-blue-500' : ''}
                  ${mov.type === 'checkout' ? 'bg-orange-500' : ''}
                  ${mov.type === 'reserva' ? 'bg-purple-500' : ''}
                `} />
                <span className="text-xs text-muted w-12 shrink-0">{mov.time}</span>
                <span className="text-sm text-gray-600">{mov.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
