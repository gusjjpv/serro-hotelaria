import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { formatCurrency, formatDate } from '@/lib/utils'
import * as dashboardService from '@/services/endpoints/dashboard'
import type { RelatorioFaturamento } from '@/types/dashboard'
import {
  BarChart3,
  Search,
  DollarSign,
  CalendarDays,
  BedDouble,
  TrendingUp,
  Hotel,
} from 'lucide-react'

export function RelatorioFaturamentoPage() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [relatorio, setRelatorio] = useState<RelatorioFaturamento | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGerar = async () => {
    if (!dataInicio || !dataFim) {
      setError('Selecione o período para gerar o relatório.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await dashboardService.getRelatorioFaturamento(dataInicio, dataFim)
      setRelatorio(data)
    } catch {
      setError('Erro ao gerar relatório.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Faturamento</h1>
        <p className="text-muted mt-1">Acompanhe o desempenho financeiro do hotel</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input label="Data Início" type="date" value={dataInicio}
              onChange={e => setDataInicio(e.target.value)} />
          </div>
          <div className="flex-1">
            <Input label="Data Fim" type="date" value={dataFim}
              onChange={e => setDataFim(e.target.value)} />
          </div>
          <Button isLoading={loading} onClick={handleGerar} disabled={!dataInicio || !dataFim}>
            <Search className="h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </Card>

      {relatorio && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted">Total de Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.totalReservas}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BedDouble className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted">Total de Diárias</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.totalDiarias}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(Number(relatorio.resumo.receitaTotal))}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden !p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Reservas no Período</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Código</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Hóspede</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Quarto</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Período</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Diárias</th>
                    <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {relatorio.reservas.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">{r.codigo}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{r.hospedeNome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{r.quartoNumero || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(r.dataEntrada)} — {formatDate(r.dataSaida)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{r.numDias}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(r.valorTotal))}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  )
}
