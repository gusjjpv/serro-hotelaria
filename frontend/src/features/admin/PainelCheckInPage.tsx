import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Modal } from '@/features/shared/Modal'
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
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const [success, setSuccess] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<PainelDoDiaItem | null>(null)
  const [confirmType, setConfirmType] = useState<'checkin' | 'checkout'>('checkin')

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

  const handleCheckIn = async (item: PainelDoDiaItem) => {
    setConfirmItem(item)
    setConfirmType('checkin')
    setConfirmOpen(true)
  }

  const handleCheckOut = async (item: PainelDoDiaItem) => {
    setConfirmItem(item)
    setConfirmType('checkout')
    setConfirmOpen(true)
  }

  const confirmAction = async () => {
    if (!confirmItem) return
    setLoadingIds(prev => new Set(prev).add(confirmItem.id))
    setConfirmOpen(false)
    setError('')
    setSuccess('')
    try {
      if (confirmType === 'checkin') {
        await reservaService.checkInPresencial(confirmItem.id, { identidadeVerificada: true })
        setSuccess('Check-in realizado com sucesso!')
      } else {
        await reservaService.checkOut(confirmItem.id)
        setSuccess('Check-out realizado com sucesso!')
      }
      loadPainel()
    } catch {
      setError(confirmType === 'checkin' ? 'Erro ao realizar check-in.' : 'Erro ao realizar check-out.')
    } finally {
      setLoadingIds(prev => { const next = new Set(prev); next.delete(confirmItem.id); return next })
      setConfirmItem(null)
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
        <div className="grid xl:grid-cols-2 gap-8">
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-green-50/80 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-inner">
                <LogIn className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Check-ins Previstos</h2>
                <p className="text-sm text-green-700 font-semibold bg-green-50 inline-block px-2.5 py-0.5 rounded-md mt-1">
                  {painel?.checkins_previstos.length || 0} chegadas hoje
                </p>
              </div>
            </div>
            {(!painel || painel.checkins_previstos.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CalendarCheck className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">Nenhum check-in previsto para hoje.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {painel.checkins_previstos.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">{item.hospede_nome}</p>
                      <p className="text-sm text-primary-600 font-mono mt-0.5">{item.codigo}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5">
                          <BedDouble className="h-3 w-3" /> {item.categoria}
                        </span>
                        {item.quarto_numero && (
                          <span className="text-xs font-bold text-white bg-gray-900 px-2 py-1 rounded-md">
                            Q. {item.quarto_numero}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      isLoading={loadingIds.has(item.id)}
                      onClick={() => handleCheckIn(item)}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20 px-6 py-5 h-auto text-sm font-bold"
                    >
                      <LogIn className="h-4 w-4" />
                      Fazer Check-in
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-50/80 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110" />
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-inner">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Check-outs Previstos</h2>
                <p className="text-sm text-orange-700 font-semibold bg-orange-50 inline-block px-2.5 py-0.5 rounded-md mt-1">
                  {painel?.checkouts_previstos.length || 0} saídas hoje
                </p>
              </div>
            </div>
            {(!painel || painel.checkouts_previstos.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CalendarCheck className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">Nenhum check-out previsto para hoje.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {painel.checkouts_previstos.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">{item.hospede_nome}</p>
                      <p className="text-sm text-primary-600 font-mono mt-0.5">{item.codigo}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5">
                          <BedDouble className="h-3 w-3" /> {item.categoria}
                        </span>
                        {item.quarto_numero && (
                          <span className="text-xs font-bold text-white bg-gray-900 px-2 py-1 rounded-md">
                            Q. {item.quarto_numero}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={loadingIds.has(item.id)}
                      onClick={() => handleCheckOut(item)}
                      className="w-full sm:w-auto border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl px-6 py-5 h-auto text-sm font-bold"
                    >
                      <LogOut className="h-4 w-4" />
                      Fazer Check-out
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmType === 'checkin' ? 'Confirmar Check-in' : 'Confirmar Check-out'}
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Deseja realmente realizar o {confirmType === 'checkin' ? 'check-in' : 'check-out'} para a reserva <strong className="text-gray-900">{confirmItem?.codigo}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              isLoading={loadingIds.has(confirmItem?.id ?? -1)}
              onClick={confirmAction}
              className={confirmType === 'checkin' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}
            >
              {confirmType === 'checkin' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
