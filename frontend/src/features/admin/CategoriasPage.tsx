import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { formatCurrency, cn } from '@/lib/utils'
import * as categoriaService from '@/services/endpoints/categoria'
import type { CategoriaQuarto, CategoriaQuartoCreateRequest } from '@/types/quarto'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Tag,
} from 'lucide-react'

const emptyForm: CategoriaQuartoCreateRequest = {
  nome: '',
  descricao: '',
  capacidade: 2,
  precoBase: 0,
}

async function extractApiError(err: unknown): Promise<string> {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response: Response }).response
    try {
      const body = await response.clone().json() as Record<string, string[]>
      return Object.values(body).flat().join(' ')
    } catch {
      return 'Erro ao conectar ao servidor.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Erro ao conectar ao servidor.'
}

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaQuarto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoriaQuartoCreateRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCategorias = async () => {
    try {
      const data = await categoriaService.listCategorias()
      setCategorias(data)
      setError('')
    } catch {
      setError('Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategorias() }, [])

  const filtered = categorias.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.descricao.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowModal(true)
  }

  const openEdit = (cat: CategoriaQuarto) => {
    setForm({
      nome: cat.nome,
      descricao: cat.descricao,
      capacidade: cat.capacidade,
      precoBase: cat.precoBase,
    })
    setEditingId(cat.id)
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      setError('Nome é obrigatório.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await categoriaService.updateCategoria(editingId, form)
      } else {
        await categoriaService.createCategoria(form)
      }
      setShowModal(false)
      loadCategorias()
    } catch (err) {
      setError(await extractApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, nome: string) => {
    if (!window.confirm(`Excluir a categoria "${nome}"?`)) return
    try {
      await categoriaService.deleteCategoria(id)
      loadCategorias()
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias de Quarto</h1>
          <p className="text-muted mt-1">Gerencie as categorias e preços base</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome..."
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
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Nome</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Descrição</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Capacidade</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Preço Base</th>
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
                    Nenhuma categoria encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((cat, i) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                          <Tag className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{cat.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{cat.descricao || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{cat.capacidade} pessoa{cat.capacidade > 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(cat.precoBase)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.nome)}
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
                    <Tag className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Editar Categoria' : 'Nova Categoria'}
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
                  <Input label="Nome" placeholder="Ex: Standard, Luxo, Suíte" value={form.nome}
                    onChange={e => setForm({...form, nome: e.target.value})} />

                  <Input label="Descrição" placeholder="Descrição da categoria (opcional)" value={form.descricao}
                    onChange={e => setForm({...form, descricao: e.target.value})} />

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Capacidade" type="number" min={1} placeholder="2" value={form.capacidade}
                      onChange={e => setForm({...form, capacidade: parseInt(e.target.value) || 1})} />
                    <Input label="Preço Base (R$)" type="number" min={0} step={0.01} placeholder="0.00" value={form.precoBase}
                      onChange={e => setForm({...form, precoBase: parseFloat(e.target.value) || 0})} />
                  </div>

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
