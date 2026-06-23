import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/features/shared/Card'
import {
  CalendarCheck,
  BedDouble,
  ClipboardList,
  ShoppingCart,
  Star,
  Hotel,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react'

const quickActions = [
  { label: 'Nova Reserva', icon: CalendarCheck, color: 'bg-blue-500', href: '#', comingSoon: true },
  { label: 'Check-in Online', icon: BedDouble, color: 'bg-green-500', href: '/app/checkin', comingSoon: false },
  { label: 'Ver Extrato', icon: ClipboardList, color: 'bg-purple-500', href: '#', comingSoon: true },
  { label: 'Serviços', icon: ShoppingCart, color: 'bg-orange-500', href: '#', comingSoon: true },
]

export function HospedeDashboard() {
  const { user } = useAuth()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Welcome */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden bg-gray-900 text-white min-h-[240px] flex items-center rounded-3xl shadow-2xl">
          <img src="/hotel-pool.png" alt="Relax" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-transparent" />
          <div className="relative z-10 px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
              Bem-vindo(a), {user?.first_name}!
            </h1>
            <p className="text-gray-100 mt-3 max-w-xl font-medium text-lg drop-shadow-sm">
              Gerencie sua estadia, faça check-in online, solicite serviços premium e acompanhe suas despesas em tempo real.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              disabled={action.comingSoon}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg shadow-gray-200/50 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${action.color} text-white shadow-lg`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900">{action.label}</h3>
              <p className="text-sm text-muted mt-1">Clique para acessar</p>
              {action.comingSoon && (
                <span className="absolute top-3 right-3 text-[10px] font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                  EM BREVE
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted">Programa de Fidelidade</p>
              <p className="text-xl font-bold text-gray-900">150 pontos</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-gold-400 to-gold-500 rounded-full" />
          </div>
          <p className="text-xs text-muted mt-2">Mais 300 pontos para próxima categoria</p>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted">Estadia Atual</p>
              <p className="text-xl font-bold text-gray-900">Nenhuma</p>
            </div>
          </div>
          <p className="text-sm text-muted mt-4">Faça uma reserva para começar</p>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted">Conta</p>
              <p className="text-xl font-bold text-gray-900">R$ 0,00</p>
            </div>
          </div>
          <p className="text-sm text-muted mt-4">Nenhuma despesa no momento</p>
        </Card>
      </motion.div>

      {/* Hotel Info */}
      <motion.div variants={item}>
        <Card variant="bordered">
          <div className="flex items-center gap-3 mb-4">
            <Hotel className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Sobre o Hotel</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted">
              <MapPin className="h-4 w-4" />
              <span>Endereço do hotel</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Phone className="h-4 w-4" />
              <span>(00) 0000-0000</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Mail className="h-4 w-4" />
              <span>contato@hotel.com</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
