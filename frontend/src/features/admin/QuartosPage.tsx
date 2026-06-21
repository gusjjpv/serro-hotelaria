import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { cn, formatDate } from '@/lib/utils'
import { parseFieldErrors, extractApiError } from '@/lib/api-errors'
import { useAuth } from '@/hooks/useAuth'
import * as quartoService from '@/services/endpoints/quarto'
import * as categoriaService from '@/services/endpoints/categoria'
import type { Quarto, QuartoCreateRequest, CategoriaQuarto, StatusQuarto } from '@/types/quarto'
import { StatusQuartoLabels, StatusQuartoColors } from '@/types/quarto'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Building2,
  User,
  Clock,
} from 'lucide-react'

const statusOptions = [
  { value: 'DISP', label: 'Disponível' },
  { value: 'OCUP', label: 'Ocupado' },
  { value: 'LIMP', label: 'Em Limpeza' },
  { value: 'MANU', label: 'Manutenção' },
]

const ATENDENTE_TRANSITIONS: Record<StatusQuarto, StatusQuarto[]> = {
  DISP: ['OCUP', 'LIMP'],
  OCUP: [],
  LIMP: ['DISP'],
  MANU: [],
}

const ALL_TRANSITIONS: Record<StatusQuarto, StatusQuarto[]> = {
  DISP: ['OCUP', 'LIMP', 'MANU'],
  OCUP: ['LIMP'],
  LIMP: ['DISP', 'MANU'],
  MANU: ['DISP'],
}

const emptyForm: QuartoCreateRequest = {
  numero: '',
  andar: 1,
  categoria: 0,
  status: 'DISP',
}

export function QuartosPage() {
  const { role } = useAuth()
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [categorias, setCategorias] = useState<CategoriaQuarto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<QuartoCreateRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({})
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({})

  const allowedTransitions = role === 'AT' ? ATENDENTE_TRANSITIONS : ALL_TRANSITIONS

  const loadData = async () => {
    try {
      const [q, c] = await Promise.all([
        quartoService.listQuartos(),
        categoriaService.listCategorias(),
      ])
      setQuartos(q)
      setCategorias(c)
      setError('')
    } catch {
      setError('Erro ao carregar quartos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = quartos.filter(q => {
    const matchSearch = q.numero.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || q.status === filterStatus
    return matchSearch && matchStatus
  })

  const getCategoriaNome = (id: number) => {
    return categorias.find(c => c.id === id)?.nome || '—'
  }

  const handleStatusChange = async (quartoId: number, newStatus: StatusQuarto) => {
    setUpdatingStatus(prev => ({ ...prev, [quartoId]: true }))
    setError('')
    try {
      await quartoService.updateQuartoStatus(quartoId, newStatus)
      setQuartos(prev => prev.map(q =>
        q.id === quartoId ? { ...q, status: newStatus, status_display: StatusQuartoLabels[newStatus] } : q
      ))
    } catch (err) {
      const msg = await extractApiError(err)
      setError(msg)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [quartoId]: false }))
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setFieldErrors({})
    setShowModal(true)
  }

  const openEdit = (q: Quarto) => {
    setForm({
      numero: q.numero,
      andar: q.andar,
      categoria: q.categoria,
      status: q.status,
    })
    setEditingId(q.id)
    setError('')
    setFieldErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    setFieldErrors({})
    if (!form.numero.trim()) {
      setFieldErrors({ numero: { message: 'Número é obrigatório.' } })
      return
    }
    if (!form.categoria) {
      setFieldErrors({ categoria: { message: 'Selecione uma categoria.' } })
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await quartoService.updateQuarto(editingId, form)
      } else {
        await quartoService.createQuarto(form)
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response: Response }).response
        try {
          const body = await response.clone().json()
          const { fieldErrors, apiMessage } = parseFieldErrors(body)
          setFieldErrors(fieldErrors)
          setError(apiMessage)
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

  const handleDelete = async (id: number, numero: string) => {
    if (!window.confirm(`Excluir o quarto ${numero}?`)) return
    try {
      await quartoService.deleteQuarto(id)
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
          <h1 className="text-2xl font-bold text-gray-900">Quartos</h1>
          <p className="text-muted mt-1">Gerencie os quartos do hotel</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Quarto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {statusOptions.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Quarto</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Andar</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Categoria</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Última alteração</th>
                <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    Nenhum quarto encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((q, i) => (
                  <motion.tr
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{q.numero}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{q.andar}º</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{getCategoriaNome(q.categoria)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={q.status}
                        onChange={e => handleStatusChange(q.id, e.target.value as StatusQuarto)}
                        disabled={updatingStatus[q.id]}
                        className={cn(
                          'cursor-pointer rounded-lg border-0 px-2.5 py-1 text-xs font-semibold focus:ring-2 focus:ring-primary-500/40 focus:outline-none',
                          updatingStatus[q.id] && 'opacity-50',
                          StatusQuartoColors[q.status],
                        )}
                      >
                        {statusOptions
                          .filter(s => allowedTransitions[q.status]?.includes(s.value as StatusQuarto))
                          .map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        {q.status_changed_by_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {q.status_changed_by_name}
                          </span>
                        )}
                        {q.status_changed_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(q.status_changed_at)}
                          </span>
                        )}
                        {!q.status_changed_by_name && !q.status_changed_at && '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(q)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.numero)}
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
                    <Building2 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Editar Quarto' : 'Novo Quarto'}
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
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Número" placeholder="Ex: 101" value={form.numero}
                      error={fieldErrors.numero?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, numero: undefined}); setForm({...form, numero: e.target.value}) }} />
                    <Input label="Andar" type="number" min={0} placeholder="1" value={form.andar}
                      error={fieldErrors.andar?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, andar: undefined}); setForm({...form, andar: parseInt(e.target.value) || 0}) }} />
                  </div>

                  <Select
                    label="Categoria"
                    placeholder="Selecione uma categoria"
                    options={categorias.map(c => ({ value: String(c.id), label: `${c.nome} (${c.capacidade} pessoa${c.capacidade > 1 ? 's' : ''})` }))}
                    value={form.categoria ? String(form.categoria) : ''}
                    error={fieldErrors.categoria?.message}
                    onChange={e => { setFieldErrors({...fieldErrors, categoria: undefined}); setForm({...form, categoria: parseInt(e.target.value) || 0}) }}
                  />

                  {editingId && (
                    <Select
                      label="Status"
                      options={statusOptions}
                      value={form.status || 'DISP'}
                      error={fieldErrors.status?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, status: undefined}); setForm({...form, status: e.target.value as StatusQuarto}) }}
                    />
                  )}

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
