import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { formatCurrency, formatDate } from '@/lib/utils'
import * as reservaService from '@/services/endpoints/reserva'
import * as contaService from '@/services/endpoints/conta'
import type { Reserva } from '@/types/reserva'
import type { Despesa, CategoriaDespesa, Conta } from '@/types/conta'
import { CategoriaDespesaLabels } from '@/types/conta'
import {
  ShoppingCart,
  Plus,
  Search,
  X,
  Check,
  Receipt,
  BedDouble,
  User,
} from 'lucide-react'

const categoriaOptions = Object.entries(CategoriaDespesaLabels).map(([value, label]) => ({
  value, label,
}))

export function ContaPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null)
  const [extrato, setExtrato] = useState<{ conta: Conta; despesas: Despesa[] } | null>(null)
  const [extratoLoading, setExtratoLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [contaId, setContaId] = useState('')
  const [despesaDescricao, setDespesaDescricao] = useState('')
  const [despesaValor, setDespesaValor] = useState('')
  const [despesaCategoria, setDespesaCategoria] = useState<CategoriaDespesa>('OUTR')
  const [saving, setSaving] = useState(false)

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

  const filtered = reservas.filter(r =>
    r.codigo.toLowerCase().includes(search.toLowerCase()) ||
    r.hotel_nome.toLowerCase().includes(search.toLowerCase())
  )

  const handleViewExtrato = async (r: Reserva) => {
    setSelectedReserva(r)
    setExtratoLoading(true)
    setError('')
    const id = prompt('Informe o ID da conta para ver o extrato:')
    if (!id) { setExtratoLoading(false); return }
    try {
      const data = await contaService.getExtrato(Number(id))
      setExtrato(data)
      setContaId(id)
    } catch {
      setError('Erro ao carregar extrato da conta.')
    } finally {
      setExtratoLoading(false)
    }
  }

  const handleAddDespesa = async () => {
    if (!contaId || !despesaDescricao.trim() || !despesaValor) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await contaService.addDespesa({
        conta: Number(contaId),
        descricao: despesaDescricao,
        valor: Number(despesaValor),
        categoria: despesaCategoria,
      })
      setSuccess('Despesa lançada com sucesso!')
      setDespesaDescricao('')
      setDespesaValor('')
      if (extrato) {
        const data = await contaService.getExtrato(Number(contaId))
        setExtrato(data)
      }
    } catch {
      setError('Erro ao lançar despesa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lançar Consumo</h1>
          <p className="text-muted mt-1">Gerencie as despesas das contas dos hóspedes</p>
        </div>
      </div>

      {success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{success}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código da reserva ou hotel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">Nenhuma reserva encontrada</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900">{r.codigo}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === 'CHIN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {r.status_display}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {r.hotel_nome} — {r.categoria_nome} — {formatDate(r.dataEntrada)} a {formatDate(r.dataSaida)}
                      </p>
                    </div>
                    {r.status === 'CHIN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={extratoLoading && selectedReserva?.id === r.id}
                        onClick={() => handleViewExtrato(r)}
                      >
                        <Receipt className="h-3 w-3" />
                        Conta
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Lançar Despesa</h3>

            <div className="space-y-4">
              <Input
                label="ID da Conta"
                placeholder="Informe o ID da conta"
                value={contaId}
                onChange={e => setContaId(e.target.value)}
              />

              <Input
                label="Descrição"
                placeholder="Ex: 2 águas, 1 coca-cola"
                value={despesaDescricao}
                onChange={e => setDespesaDescricao(e.target.value)}
              />

              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                value={despesaValor}
                onChange={e => setDespesaValor(e.target.value)}
              />

              <Select
                label="Categoria"
                options={categoriaOptions}
                value={despesaCategoria}
                onChange={e => setDespesaCategoria(e.target.value as CategoriaDespesa)}
              />

              <Button
                className="w-full"
                isLoading={saving}
                onClick={handleAddDespesa}
                disabled={!contaId || !despesaDescricao.trim() || !despesaValor}
              >
                <Plus className="h-4 w-4" />
                Lançar Despesa
              </Button>
            </div>
          </Card>

          {extrato && (
            <Card className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-4">Extrato da Conta</h3>
              <div className="space-y-2">
                {extrato.despesas.length === 0 ? (
                  <p className="text-sm text-muted">Nenhuma despesa registrada</p>
                ) : (
                  extrato.despesas.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.descricao}</p>
                        <p className="text-xs text-muted">{d.categoria_display}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(d.valor)}</span>
                    </div>
                  ))
                )}
                <hr className="border-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-primary-600">{formatCurrency(extrato.conta.totalAcumulado)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
