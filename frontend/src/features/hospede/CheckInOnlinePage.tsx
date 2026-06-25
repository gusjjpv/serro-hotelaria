import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Modal } from '@/features/shared/Modal'
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmReserva, setConfirmReserva] = useState<Reserva | null>(null)

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

  const handleCheckIn = async (r: Reserva) => {
    setConfirmReserva(r)
    setConfirmOpen(true)
  }

  const confirmCheckIn = async () => {
    if (!confirmReserva) return
    setCheckinId(confirmReserva.id)
    setConfirmOpen(false)
    setError('')
    setSuccess('')
    try {
      await reservaService.checkInOnline(confirmReserva.id)
      setSuccess('Check-in realizado com sucesso!')
      loadReservas()
    } catch {
      setError('Erro ao realizar check-in. Verifique se está dentro do prazo (24h antes da entrada).')
    } finally {
      setCheckinId(null)
      setConfirmReserva(null)
    }
  }

  const disponibles = reservas.filter(r => r.status === 'CONF')

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
              <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-0 overflow-hidden border-0 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-56 h-40 sm:h-auto shrink-0 relative">
                    <img src="/hotel-facade.png" alt="Hotel" className="absolute inset-0 w-full h-full object-cover" />
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
                          <CheckCircle className="h-3.5 w-3.5" />
                          {StatusReservaLabels[r.status]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-5">
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
                    </div>

                    <div className="flex justify-end border-t border-gray-50 pt-4">
                      <Button
                        isLoading={checkinId === r.id}
                        onClick={() => handleCheckIn(r)}
                        className="px-8 h-12 text-lg rounded-xl shadow-lg shadow-primary-500/30 font-bold"
                      >
                        <LogIn className="h-5 w-5" />
                        Fazer Check-in Agora
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar Check-in">
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Deseja realmente realizar o check-in para a reserva <strong className="text-gray-900">{confirmReserva?.codigo}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              isLoading={checkinId === confirmReserva?.id}
              onClick={confirmCheckIn}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <LogIn className="h-4 w-4" />
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
