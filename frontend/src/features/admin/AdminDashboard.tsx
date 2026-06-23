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
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Quartos Ocupados</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">
                    {data.metricas.quartosOcupados}<span className="text-xl text-gray-400 font-medium">/{data.metricas.quartosTotal}</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <BedDouble className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 relative z-10">
                <p className="text-xs text-blue-700 font-bold bg-blue-50 inline-block px-2.5 py-1.5 rounded-lg border border-blue-100">
                  {data.metricas.quartosDisponiveis} Quartos Disponíveis
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-green-100 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Check-ins Hoje</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{data.metricas.checkinsPendentes}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <CalendarCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 relative z-10">
                <p className="text-xs text-green-700 font-bold bg-green-50 inline-block px-2.5 py-1.5 rounded-lg border border-green-100">
                  Aguardando Chegada
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-orange-100 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Check-outs Hoje</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{data.metricas.checkoutsPendentes}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 relative z-10">
                <p className="text-xs text-orange-700 font-bold bg-orange-50 inline-block px-2.5 py-1.5 rounded-lg border border-orange-100">
                  Previsão de Saída
                </p>
              </div>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 group bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Faturamento Hoje</p>
                  <p className="text-3xl font-extrabold text-white mt-2">
                    {formatCurrency(Number(data.metricas.faturamentoDoDia))}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-300 backdrop-blur-md">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 relative z-10">
                <p className="text-xs text-primary-300 font-bold bg-white/5 inline-block px-2.5 py-1.5 rounded-lg border border-white/10">
                  Receita acumulada do dia
                </p>
              </div>
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
