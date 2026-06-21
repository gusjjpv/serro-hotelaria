import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { formatCurrency, cn } from '@/lib/utils'
import { parseFieldErrors, extractApiError } from '@/lib/api-errors'
import * as tarifaService from '@/services/endpoints/tarifa'
import * as categoriaService from '@/services/endpoints/categoria'
import type { Tarifa, TarifaCreateRequest, TipoTemporada } from '@/types/tarifa'
import type { CategoriaQuarto } from '@/types/quarto'
import { TipoTemporadaLabels, TipoTemporadaColors } from '@/types/tarifa'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  TrendingUp,
  Calendar,
} from 'lucide-react'

const temporadaOptions = [
  { value: 'ALTA', label: 'Alta Temporada' },
  { value: 'BAIXA', label: 'Baixa Temporada' },
]

const emptyForm: TarifaCreateRequest = {
  categoria: 0,
  valorDiaria: 0,
  dataInicio: '',
  dataFim: '',
  tipoTemporada: 'ALTA',
}

export function TarifasPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [categorias, setCategorias] = useState<CategoriaQuarto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TarifaCreateRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({})

  const loadData = async () => {
    try {
      const [t, c] = await Promise.all([
        tarifaService.listTarifas(),
        categoriaService.listCategorias(),
      ])
      setTarifas(t)
      setCategorias(c)
      setError('')
    } catch {
      setError('Erro ao carregar tarifas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = tarifas.filter(t =>
    t.categoria_nome?.toLowerCase().includes(search.toLowerCase()) ||
    t.tipoTemporada_display.toLowerCase().includes(search.toLowerCase())
  )

  const getCategoriaNome = (id: number) => {
    return categorias.find(c => c.id === id)?.nome || `Categoria #${id}`
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  const openEdit = (t: Tarifa) => {
    setForm({
      categoria: t.categoria,
      valorDiaria: t.valorDiaria,
      dataInicio: t.dataInicio,
      dataFim: t.dataFim,
      tipoTemporada: t.tipoTemporada,
    })
    setEditingId(t.id)
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.categoria) {
      setError('Selecione uma categoria.')
      return
    }
    if (!form.dataInicio || !form.dataFim) {
      setError('Preencha as datas de início e fim.')
      return
    }
    if (form.dataFim < form.dataInicio) {
      setError('A data fim deve ser igual ou posterior à data início.')
      return
    }
    if (form.valorDiaria <= 0) {
      setError('O valor da diária deve ser maior que zero.')
      return
    }
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (editingId) {
        await tarifaService.updateTarifa(editingId, form)
      } else {
        await tarifaService.createTarifa(form)
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response: Response }).response
        try {
          const body = await response.clone().json()
          const parsed = parseFieldErrors(body)
          setFieldErrors(parsed.fieldErrors)
          setError(parsed.apiMessage)
        } catch {
          setError('Erro ao conectar ao servidor.')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao conectar ao servidor.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, nome: string) => {
    if (!window.confirm(`Excluir a tarifa de "${nome}"?`)) return
    try {
      await tarifaService.deleteTarifa(id)
      loadData()
    } catch (err) {
      setError(await extractApiError(err))
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
          <h1 className="text-2xl font-bold text-gray-900">Tarifas</h1>
          <p className="text-muted mt-1">Gerencie as tarifas por categoria e temporada</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Tarifa
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por categoria ou temporada..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Categoria</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Diária</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Período</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Temporada</th>
                <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">
                    Nenhuma tarifa encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{t.categoria_nome || getCategoriaNome(t.categoria)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(t.valorDiaria)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(t.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(t.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
                        TipoTemporadaColors[t.tipoTemporada],
                      )}>
                        {TipoTemporadaLabels[t.tipoTemporada]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.categoria_nome || getCategoriaNome(t.categoria))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {}}>
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Editar Tarifa' : 'Nova Tarifa'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <Select
                    label="Categoria"
                    placeholder="Selecione a categoria"
                    options={categorias.map(c => ({ value: String(c.id), label: c.nome }))}
                    value={form.categoria ? String(form.categoria) : ''}
                    onChange={e => setForm({...form, categoria: Number(e.target.value)})}
                    error={fieldErrors?.categoria?.message}
                  />

                  <Input
                    label="Valor da Diária (R$)"
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="0.00"
                    value={form.valorDiaria || ''}
                    onChange={e => setForm({...form, valorDiaria: parseFloat(e.target.value) || 0})}
                    error={fieldErrors?.valorDiaria?.message}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Data Início"
                      type="date"
                      value={form.dataInicio}
                      onChange={e => setForm({...form, dataInicio: e.target.value})}
                      error={fieldErrors?.dataInicio?.message}
                    />
                    <Input
                      label="Data Fim"
                      type="date"
                      value={form.dataFim}
                      onChange={e => setForm({...form, dataFim: e.target.value})}
                      error={fieldErrors?.dataFim?.message}
                    />
                  </div>

                  <Select
                    label="Tipo de Temporada"
                    options={temporadaOptions}
                    value={form.tipoTemporada}
                    onChange={e => setForm({...form, tipoTemporada: e.target.value as TipoTemporada})}
                    error={fieldErrors?.tipoTemporada?.message}
                  />

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                  <Button onClick={handleSave} isLoading={saving}>
                    <Check className="h-4 w-4" />
                    {editingId ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
