import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import * as reservaService from '@/services/endpoints/reserva'
import * as contaService from '@/services/endpoints/conta'
import type { Reserva } from '@/types/reserva'
import type { Conta, Despesa } from '@/types/conta'
import {
  ClipboardList,
  Search,
  Receipt,
  Hotel,
  BedDouble,
  Calendar,
  AlertCircle,
} from 'lucide-react'

export function ExtratoPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contaData, setContaData] = useState<{ conta: Conta; despesas: Despesa[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [contaIdInput, setContaIdInput] = useState('')

  const loadReservas = async () => {
    try {
      const data = await reservaService.listMinhasReservas()
      setReservas(data)
    } catch {
      setError('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReservas() }, [])

  const handleViewExtrato = async () => {
    if (!contaIdInput.trim()) return
    setBusy(true)
    setError('')
    try {
      const data = await contaService.getExtrato(Number(contaIdInput))
      setContaData(data)
    } catch {
      setError('Erro ao carregar extrato. Verifique o ID da conta.')
    } finally {
      setBusy(false)
    }
  }

  const ativa = reservas.find(r => r.status === 'CHIN')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Extrato da Conta</h1>
        <p className="text-muted mt-1">Acompanhe suas despesas em tempo real</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {loading ? (
        <Card>
          <div className="space-y-3">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-20 w-full" />
          </div>
        </Card>
      ) : (
        <>
          {ativa && (
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  <Hotel className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Estadia Ativa</p>
                  <p className="text-xs text-muted">{ativa.hotel_nome} — {ativa.codigo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <BedDouble className="h-4 w-4 text-gray-400" />
                  {ativa.categoria_nome}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(ativa.dataEntrada)} - {formatDate(ativa.dataSaida)}
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Consultar Extrato</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Digite o ID da sua conta"
                  value={contaIdInput}
                  onChange={e => setContaIdInput(e.target.value)}
                />
              </div>
              <Button
                isLoading={busy}
                onClick={handleViewExtrato}
                disabled={!contaIdInput.trim()}
              >
                <Search className="h-4 w-4" />
                Consultar
              </Button>
            </div>
          </Card>

          {contaData && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Despesas</h3>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  contaData.conta.status === 'ABER' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {contaData.conta.status_display}
                </span>
              </div>

              {contaData.despesas.length === 0 ? (
                <div className="py-8 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-muted">Nenhuma despesa registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contaData.despesas.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.descricao}</p>
                        <p className="text-xs text-muted">{d.categoria_display} · {formatDate(d.dataHora)}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(d.valor)}</span>
                    </div>
                  ))}
                </div>
              )}

              <hr className="border-gray-100 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(contaData.conta.totalAcumulado)}</span>
              </div>
            </Card>
          )}
        </>
      )}
    </motion.div>
  )
}
