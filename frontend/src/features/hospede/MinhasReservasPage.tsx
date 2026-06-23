import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { StatusReservaLabels, StatusReservaColors } from '@/types/reserva'
import { formatDate, formatCurrency } from '@/lib/utils'
import * as reservaService from '@/services/endpoints/reserva'
import type { Reserva } from '@/types/reserva'
import {
  CalendarCheck,
  X,
  Hotel,
  BedDouble,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export function MinhasReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const loadReservas = async () => {
    try {
      const data = await reservaService.listMinhasReservas()
      setReservas(data)
      setError('')
    } catch {
      setError('Erro ao carregar reservas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReservas() }, [])

  const handleCancel = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva?')) return
    setCancellingId(id)
    setError('')
    try {
      await reservaService.cancelReserva(id)
      loadReservas()
    } catch {
      setError('Erro ao cancelar reserva. Tente novamente.')
    } finally {
      setCancellingId(null)
    }
  }

  const canCancel = (status: string) => status === 'PEND' || status === 'CONF'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Reservas</h1>
          <p className="text-muted mt-1">Acompanhe suas reservas ativas e anteriores</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="space-y-3">
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-64" />
              </div>
            </Card>
          ))}
        </div>
      ) : reservas.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <CalendarCheck className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">Nenhuma reserva encontrada</p>
            <p className="mt-1 text-sm text-muted">Você ainda não possui reservas conosco.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservas.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-0 overflow-hidden border-0 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-56 h-40 sm:h-auto shrink-0 relative">
                    <img src="/hotel-room.png" alt="Quarto" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent sm:hidden" />
                    <div className="absolute top-3 left-3 sm:hidden">
                      <span className="text-white font-mono bg-black/50 backdrop-blur-md px-2 py-1 rounded-md text-xs">{r.codigo}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between bg-white">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h3 className="font-extrabold text-xl text-gray-900">{r.hotel_nome}</h3>
                        <span className="hidden sm:inline-block text-sm text-primary-700 font-mono bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-md mt-1">{r.codigo}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm ${StatusReservaColors[r.status]}`}>
                          {r.status === 'CHIN' && <CheckCircle className="h-3.5 w-3.5" />}
                          {r.status === 'CANC' && <X className="h-3.5 w-3.5" />}
                          {r.status === 'PEND' && <Clock className="h-3.5 w-3.5" />}
                          {StatusReservaLabels[r.status]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                        <BedDouble className="h-5 w-5 text-primary-500" />
                        <span className="truncate">{r.categoria_nome}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                        <Calendar className="h-5 w-5 text-primary-500" />
                        <span className="truncate">{formatDate(r.dataEntrada)} - {formatDate(r.dataSaida)}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                        <Users className="h-5 w-5 text-primary-500" />
                        <span>{r.numHospedes} hóspede{r.numHospedes > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                        <DollarSign className="h-5 w-5 text-primary-500" />
                        <span>{formatCurrency(r.valorTotal)}</span>
                      </div>
                    </div>

                    {canCancel(r.status) && (
                      <div className="mt-5 flex justify-end border-t border-gray-50 pt-4">
                        <Button
                          variant="outline"
                          isLoading={cancellingId === r.id}
                          onClick={() => handleCancel(r.id)}
                          className="text-red-500 border-red-200 hover:bg-red-50 font-bold px-6"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Cancelar Reserva
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
