import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/features/shared/Card'
import { getRoleLabel, formatCurrency, formatDate } from '@/lib/utils'
import * as dashboardService from '@/services/endpoints/dashboard'
import type { DashboardData } from '@/types/dashboard'
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
  Loader2,
} from 'lucide-react'

const menuGrid = [
  { label: 'Quartos', icon: Building2, href: '/app/admin/quartos', roles: ['AT', 'SV', 'GE'], ready: true },
  { label: 'Check-in/out', icon: CalendarCheck, href: '/app/admin/checkin', roles: ['AT', 'SV', 'GE'], ready: true },
  { label: 'Hóspedes', icon: Users, href: '/app/admin/hospedes', roles: ['AT', 'SV', 'GE'], ready: true },
  { label: 'Funcionários', icon: UserCog, href: '/app/admin/funcionarios', roles: ['GE'], ready: true },
  { label: 'Meu Hotel', icon: Building2, href: '/app/admin/hotel', roles: ['GE'], ready: true },
  { label: 'Cardápio', icon: UtensilsCrossed, href: '/app/admin/cardapio', roles: ['AT', 'SV', 'GE'], ready: false },
  { label: 'Lançar Consumo', icon: ShoppingCart, href: '/app/admin/consumo', roles: ['AT', 'SV', 'GE'], ready: true },
  { label: 'Categorias', icon: Tag, href: '/app/admin/categorias', roles: ['SV', 'GE'], ready: true },
  { label: 'Manutenção', icon: Wrench, href: '/app/admin/manutencao', roles: ['SV', 'GE'], ready: true },
  { label: 'Tarifas', icon: TrendingUp, href: '/app/admin/tarifas', roles: ['GE'], ready: true },
  { label: 'Relatórios', icon: BarChart3, href: '/app/admin/relatorios', roles: ['GE'], ready: true },
]

export function AdminDashboard() {
  const { role } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
      <motion.div variants={item}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted mt-1">
            Visão geral do hotel · {getRoleLabel(role || '')}
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : data ? (
        <>
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Quartos Ocupados</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {data.metricas.quartosOcupados}/{data.metricas.quartosTotal}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                  <BedDouble className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted mt-3">
                {data.metricas.quartosDisponiveis} disponíveis
              </p>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Check-ins Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.metricas.checkinsPendentes}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white">
                  <CalendarCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted mt-3">Pendentes</p>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Check-outs Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.metricas.checkoutsPendentes}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted mt-3">Até 12h</p>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Faturamento Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(Number(data.metricas.faturamentoDoDia))}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 text-white">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted mt-3">Receita do dia</p>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Rápido</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredMenu.map((item) => (
                <a
                  key={item.label}
                  href={item.ready ? item.href : '#'}
                  className={`group relative flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-lg shadow-gray-200/50 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${!item.ready ? 'opacity-40 cursor-not-allowed' : ''}`}
                  onClick={e => { if (!item.ready) e.preventDefault() }}
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
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Reservas Ativas</h3>
              </div>
              {data.reservasAtivas.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">Nenhuma reserva ativa no momento</p>
              ) : (
                <div className="space-y-3">
                  {data.reservasAtivas.slice(0, 10).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className={`h-2 w-2 rounded-full ${r.status === 'CHIN' ? 'bg-green-500' : 'bg-blue-500'}`} />
                      <span className="text-xs text-muted w-20 shrink-0 font-mono">{r.codigo}</span>
                      <span className="text-sm text-gray-600 flex-1 truncate">{r.hospedeNome}</span>
                      <span className="text-xs text-muted">{r.quartoNumero ? `Qto ${r.quartoNumero}` : '—'}</span>
                      <span className="text-xs text-muted">{formatDate(r.dataEntrada)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === 'CHIN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{r.statusDisplay}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </>
      ) : (
        <motion.div variants={item}>
          <Card>
            <p className="text-sm text-muted py-8 text-center">Não foi possível carregar os dados do dashboard.</p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
