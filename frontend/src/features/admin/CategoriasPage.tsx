import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { formatCurrency, cn } from '@/lib/utils'
import { parseFieldErrors } from '@/lib/api-errors'
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

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaQuarto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoriaQuartoCreateRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({})

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
    setFieldErrors({})
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
    setFieldErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) {
      setError('Nome é obrigatório.')
      return
    }
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      if (editingId) {
        await categoriaService.updateCategoria(editingId, form)
      } else {
        await categoriaService.createCategoria(form)
      }
      setShowModal(false)
      loadCategorias()
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
    if (!window.confirm(`Excluir a categoria "${nome}"?`)) return
    try {
      await categoriaService.deleteCategoria(id)
      loadCategorias()
    } catch (err) {
      let msg = 'Erro ao excluir categoria.'
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response: Response }).response
        try {
          const body = await response.clone().json() as Record<string, string[]>
          msg = Object.values(body).flat().join(' ')
        } catch {}
      }
      setError(msg)
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-2xl border-0 py-3.5 pl-12 pr-4 text-gray-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      <Card className="overflow-hidden !p-0 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacidade</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Preço Base</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-5"><div className="skeleton h-5 w-full rounded-md" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
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
                    className="hover:bg-gray-50/80 transition-colors group"
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
                  <Input
                    label="Nome"
                    placeholder="Ex: Standard, Luxo, Suíte"
                    value={form.nome}
                    onChange={e => setForm({...form, nome: e.target.value})}
                    error={fieldErrors?.nome?.message}
                  />

                  <Input
                    label="Descrição"
                    placeholder="Descrição da categoria (opcional)"
                    value={form.descricao}
                    onChange={e => setForm({...form, descricao: e.target.value})}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Capacidade"
                      type="number"
                      min={1}
                      placeholder="2"
                      value={form.capacidade}
                      onChange={e => setForm({...form, capacidade: parseInt(e.target.value) || 1})}
                      error={fieldErrors?.capacidade?.message}
                    />
                    <Input
                      label="Preço Base (R$)"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={form.precoBase}
                      onChange={e => setForm({...form, precoBase: parseFloat(e.target.value) || 0})}
                      error={fieldErrors?.precoBase?.message}
                    />
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
