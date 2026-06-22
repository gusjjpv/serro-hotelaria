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
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <Hotel className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{r.hotel_nome}</h3>
                        <span className="text-sm text-muted font-mono">{r.codigo}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <BedDouble className="h-4 w-4 text-gray-400" />
                        {r.categoria_nome}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(r.dataEntrada)} - {formatDate(r.dataSaida)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        {r.numHospedes} hóspede{r.numHospedes > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {formatCurrency(r.valorTotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${StatusReservaColors[r.status]}`}>
                      {r.status === 'CHIN' && <CheckCircle className="h-3 w-3" />}
                      {r.status === 'CANC' && <X className="h-3 w-3" />}
                      {r.status === 'PEND' && <Clock className="h-3 w-3" />}
                      {StatusReservaLabels[r.status]}
                    </span>

                    {canCancel(r.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={cancellingId === r.id}
                        onClick={() => handleCancel(r.id)}
                        className="text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Cancelar
                      </Button>
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
