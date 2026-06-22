import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { formatDate, formatCurrency } from '@/lib/utils'
import * as reservaService from '@/services/endpoints/reserva'
import type { Reserva } from '@/types/reserva'
import { StatusReservaColors, StatusReservaLabels } from '@/types/reserva'
import {
  BedDouble,
  CheckCircle,
  LogIn,
  Hotel,
  Calendar,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react'

export function CheckInOnlinePage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checkinId, setCheckinId] = useState<number | null>(null)

  const loadReservas = async () => {
    try {
      const data = await reservaService.listMinhasReservas()
      setReservas(data)
    } catch {
      setError('Erro ao carregar reservas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReservas() }, [])

  const handleCheckIn = async (id: number) => {
    if (!window.confirm('Realizar check-in online para esta reserva?')) return
    setCheckinId(id)
    setError('')
    setSuccess('')
    try {
      await reservaService.checkInOnline(id)
      setSuccess('Check-in realizado com sucesso!')
      loadReservas()
    } catch {
      setError('Erro ao realizar check-in. Verifique se está dentro do prazo (24h antes da entrada).')
    } finally {
      setCheckinId(null)
    }
  }

  const disponibles = reservas.filter(r => r.status === 'PEND' || r.status === 'CONF')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-in Online</h1>
        <p className="text-muted mt-1">Faça check-in antecipado e agilize sua chegada</p>
      </div>

      {success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {success}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <div className="skeleton h-6 w-48 mb-3" />
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-4 w-64 mt-2" />
            </Card>
          ))}
        </div>
      ) : disponibles.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <LogIn className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">Nenhuma reserva disponível</p>
            <p className="mt-1 text-sm text-muted">
              Você precisa de uma reserva confirmada para fazer check-in online.
              O check-in estará disponível até 24h antes da data de entrada.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {disponibles.map((r) => (
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
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
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${StatusReservaColors[r.status]}`}>
                      <CheckCircle className="h-3 w-3" />
                      {StatusReservaLabels[r.status]}
                    </span>
                    <Button
                      isLoading={checkinId === r.id}
                      onClick={() => handleCheckIn(r.id)}
                    >
                      <LogIn className="h-4 w-4" />
                      Fazer Check-in
                    </Button>
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
