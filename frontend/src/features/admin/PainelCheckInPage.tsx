import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { formatDate, formatCurrency } from '@/lib/utils'
import * as reservaService from '@/services/endpoints/reserva'
import type { PainelDoDia, PainelDoDiaItem } from '@/types/dashboard'
import type { Reserva } from '@/types/reserva'
import {
  CalendarCheck,
  LogIn,
  LogOut,
  Search,
  User,
  BedDouble,
  CheckCircle,
  X,
} from 'lucide-react'

export function PainelCheckInPage() {
  const [painel, setPainel] = useState<PainelDoDia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const loadPainel = async () => {
    try {
      const data = await reservaService.getPainelDoDia()
      setPainel(data)
      setError('')
    } catch {
      setError('Erro ao carregar painel do dia.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPainel() }, [])

  const handleCheckIn = async (id: number) => {
    if (!window.confirm('Realizar check-in presencial para esta reserva?')) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await reservaService.checkInPresencial(id, { identidadeVerificada: true })
      setSuccess('Check-in realizado com sucesso!')
      loadPainel()
    } catch {
      setError('Erro ao realizar check-in.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async (id: number) => {
    if (!window.confirm('Realizar check-out para esta reserva?')) return
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await reservaService.checkOut(id)
      setSuccess('Check-out realizado com sucesso!')
      loadPainel()
    } catch {
      setError('Erro ao realizar check-out.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check-in / Check-out</h1>
        <p className="text-muted mt-1">Painel do dia — gerencie entradas e saídas</p>
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
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <div className="skeleton h-6 w-32 mb-4" />
              <div className="space-y-3">
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Check-ins Previstos</h2>
            </div>
            {(!painel || painel.checkins_previstos.length === 0) ? (
              <p className="text-sm text-muted py-4 text-center">Nenhum check-in previsto para hoje</p>
            ) : (
              <div className="space-y-3">
                {painel.checkins_previstos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.hospede_nome}</p>
                      <p className="text-xs text-muted">{item.codigo} — {item.categoria}</p>
                      {item.quarto_numero && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-1">
                          <BedDouble className="h-3 w-3" /> Quarto {item.quarto_numero}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      isLoading={actionLoading}
                      onClick={() => handleCheckIn(item.id)}
                    >
                      <LogIn className="h-3 w-3" />
                      Check-in
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <LogOut className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Check-outs Previstos</h2>
            </div>
            {(!painel || painel.checkouts_previstos.length === 0) ? (
              <p className="text-sm text-muted py-4 text-center">Nenhum check-out previsto para hoje</p>
            ) : (
              <div className="space-y-3">
                {painel.checkouts_previstos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.hospede_nome}</p>
                      <p className="text-xs text-muted">{item.codigo} — {item.categoria}</p>
                      {item.quarto_numero && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-1">
                          <BedDouble className="h-3 w-3" /> Quarto {item.quarto_numero}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={actionLoading}
                      onClick={() => handleCheckOut(item.id)}
                    >
                      <LogOut className="h-3 w-3" />
                      Check-out
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </motion.div>
  )
}
