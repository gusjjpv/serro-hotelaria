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
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <div className="space-y-6">
              {ativa && (
                <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0 shadow-xl overflow-hidden relative">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                        <Hotel className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300 uppercase tracking-widest">Estadia Ativa</p>
                        <p className="text-xl font-bold text-white">{ativa.hotel_nome}</p>
                      </div>
                      <span className="ml-auto text-sm font-mono bg-black/30 px-3 py-1 rounded-lg border border-white/10">{ativa.codigo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <BedDouble className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{ativa.categoria_nome}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{formatDate(ativa.dataEntrada)} - {formatDate(ativa.dataSaida)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="shadow-lg shadow-gray-200/50 border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 mb-5">Consultar Outro Extrato</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Digite o ID da conta (ex: 123)"
                      value={contaIdInput}
                      onChange={e => setContaIdInput(e.target.value)}
                    />
                  </div>
                  <Button
                    isLoading={busy}
                    onClick={handleViewExtrato}
                    disabled={!contaIdInput.trim()}
                    className="h-[42px] px-6"
                  >
                    <Search className="h-4 w-4" />
                    Consultar
                  </Button>
                </div>
              </Card>
            </div>

            {contaData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="bg-[#fdfdfd] border border-gray-200 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
                  {/* Receipt Header */}
                  <div className="bg-gray-50 border-b border-gray-200 p-6 text-center border-dashed">
                    <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-mono text-xl font-bold text-gray-900 tracking-wider">EXTRATO CONTA #{contaData.conta.id}</h3>
                    <p className="text-sm font-mono text-gray-500 mt-1">{new Date().toLocaleString('pt-BR')}</p>
                    <div className="mt-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                        contaData.conta.status === 'ABER' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {contaData.conta.status_display}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Items */}
                  <div className="p-6">
                    {contaData.despesas.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="font-mono text-sm text-gray-400">Nenhum consumo registrado.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contaData.despesas.map((d) => (
                          <div key={d.id} className="flex items-start justify-between text-sm font-mono">
                            <div className="pr-4">
                              <p className="font-bold text-gray-800">{d.descricao}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(d.dataHora)}</p>
                            </div>
                            <span className="font-medium text-gray-900 shrink-0">{formatCurrency(d.valor)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Receipt Footer */}
                    <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-lg text-gray-900">TOTAL</span>
                        <span className="font-mono font-extrabold text-2xl text-gray-900">{formatCurrency(contaData.conta.totalAcumulado)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Receipt zig-zag bottom edge decoration */}
                  <div className="h-3 w-full bg-[radial-gradient(circle,transparent_4px,#fdfdfd_4px)] bg-[length:12px_12px] absolute bottom-[-6px] transform rotate-180 drop-shadow-sm border-t border-gray-200/50"></div>
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
