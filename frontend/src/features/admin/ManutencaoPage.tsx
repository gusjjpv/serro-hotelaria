import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { formatDate } from '@/lib/utils'
import * as manutencaoService from '@/services/endpoints/manutencao'
import * as quartoService from '@/services/endpoints/quarto'
import * as hotelService from '@/services/endpoints/hotel'
import type { Manutencao, ManutencaoCreateRequest, MotivoManutencao } from '@/types/manutencao'
import { MotivoManutencaoLabels, StatusManutencaoLabels } from '@/types/manutencao'
import type { Quarto } from '@/types/quarto'
import {
  Wrench,
  Plus,
  X,
  Check,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'

const motivoOptions = Object.entries(MotivoManutencaoLabels).map(([v, l]) => ({ value: v, label: l }))

const statusColors: Record<string, string> = {
  AGEN: 'bg-yellow-100 text-yellow-700',
  EMAN: 'bg-blue-100 text-blue-700',
  CONC: 'bg-green-100 text-green-700',
  CANC: 'bg-red-100 text-red-700',
}

export function ManutencaoPage() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([])
  const [hotelId, setHotelId] = useState(0)
  const [quartos, setQuartos] = useState<Quarto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ManutencaoCreateRequest>({
    quarto: 0, hotel: 0, dataInicio: '', dataFim: '', motivo: 'PREV', descricao: '',
  })
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const loadData = async () => {
    try {
      const [m, q, h] = await Promise.all([
        manutencaoService.listManutencoes(),
        quartoService.listQuartos(),
        hotelService.getHotel().catch(() => null),
      ])
      setManutencoes(m)
      setQuartos(q)
      if (h) setHotelId(h.id)
      setError('')
    } catch {
      setError('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = manutencoes.filter(m => {
    const matchSearch = m.quarto_numero.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || m.status === filterStatus
    return matchSearch && matchStatus
  })

  const openCreate = () => {
    setForm({ quarto: 0, hotel: hotelId, dataInicio: '', dataFim: '', motivo: 'PREV', descricao: '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.quarto || !form.dataInicio || !form.dataFim) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await manutencaoService.createManutencao(form)
      setShowModal(false)
      setSuccess('Manutenção agendada com sucesso!')
      loadData()
    } catch {
      setError('Erro ao criar manutenção.')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalizar = async (id: number) => {
    if (!window.confirm('Finalizar esta manutenção?')) return
    setActionId(id)
    setError('')
    try {
      await manutencaoService.finalizarManutencao(id)
      setSuccess('Manutenção finalizada com sucesso!')
      loadData()
    } catch {
      setError('Erro ao finalizar manutenção.')
    } finally {
      setActionId(null)
    }
  }

  const handleCancelar = async (id: number) => {
    if (!window.confirm('Cancelar esta manutenção?')) return
    setActionId(id)
    setError('')
    try {
      await manutencaoService.cancelarManutencao(id)
      setSuccess('Manutenção cancelada.')
      loadData()
    } catch {
      setError('Erro ao cancelar manutenção.')
    } finally {
      setActionId(null)
    }
  }

  const quartoOptions = quartos.map(q => ({
    value: String(q.id),
    label: `Quarto ${q.numero} — ${q.categoria_nome} (${q.status_display})`,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutenção</h1>
          <p className="text-muted mt-1">Gerencie bloqueios e manutenções de quartos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Manutenção
        </Button>
      </div>

      {success && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{success}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por quarto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="block w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {Object.entries(StatusManutencaoLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-muted">Nenhuma manutenção encontrada</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Quarto</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Motivo</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Período</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">Quarto {m.quarto_numero}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{m.motivo_display}</span>
                      {m.descricao && (
                        <p className="text-xs text-muted mt-0.5">{m.descricao}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(m.dataInicio)} — {formatDate(m.dataFim)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusColors[m.status]}`}>
                        {m.status === 'EMAN' && <Clock className="h-3 w-3" />}
                        {m.status === 'CONC' && <CheckCircle className="h-3 w-3" />}
                        {m.status === 'CANC' && <X className="h-3 w-3" />}
                        {m.status === 'AGEN' && <AlertTriangle className="h-3 w-3" />}
                        {m.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === 'EMAN' && (
                          <>
                            <button
                              onClick={() => handleFinalizar(m.id)}
                              disabled={actionId === m.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
                              title="Finalizar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelar(m.id)}
                              disabled={actionId === m.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {m.status === 'AGEN' && (
                          <button
                            onClick={() => handleCancelar(m.id)}
                            disabled={actionId === m.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal Nova Manutenção */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Nova Manutenção</h2>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <Select
                  label="Quarto"
                  placeholder="Selecione um quarto"
                  options={quartoOptions}
                  value={form.quarto ? String(form.quarto) : ''}
                  onChange={e => setForm({...form, quarto: parseInt(e.target.value) || 0})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Data Início" type="date" value={form.dataInicio}
                    onChange={e => setForm({...form, dataInicio: e.target.value})} />
                  <Input label="Data Fim" type="date" value={form.dataFim}
                    onChange={e => setForm({...form, dataFim: e.target.value})} />
                </div>
                <Select
                  label="Motivo"
                  options={motivoOptions}
                  value={form.motivo}
                  onChange={e => setForm({...form, motivo: e.target.value as MotivoManutencao})}
                />
                <Input label="Descrição (opcional)" placeholder="Descreva o problema..." value={form.descricao}
                  onChange={e => setForm({...form, descricao: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={handleSave} isLoading={saving}>
                  <Check className="h-4 w-4" />
                  Criar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
