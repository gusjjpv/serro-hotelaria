import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { getRoleLabel, getRoleColor, formatDate, cn } from '@/lib/utils'
import { generoOptions, estadoOptions } from '@/lib/constants'
import * as authService from '@/services/endpoints/auth'
import * as hotelService from '@/services/endpoints/hotel'
import type { UserListResponse, UserCreateRequest, Role } from '@/types'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  UserCog,
  Shield,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Building2,
} from 'lucide-react'

const roleOptions = [
  { value: 'AT', label: 'Atendente' },
  { value: 'SV', label: 'Supervisor' },
]

const emptyForm: UserCreateRequest = {
  first_name: '', last_name: '', email: '', username: '',
  telefone: '', dataNascimento: '', genero: '', cpf: '',
  role: 'AT', senha: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseFieldErrors(
  body: unknown,
  prefix = '',
): { fieldErrors: Record<string, any>; apiMessage: string } {
  if (Array.isArray(body)) {
    return { fieldErrors: {}, apiMessage: body.filter(Boolean).join('. ') || 'Erro ao salvar.' }
  }
  if (!isRecord(body)) {
    return { fieldErrors: {}, apiMessage: 'Erro ao salvar.' }
  }
  if ('detail' in body && typeof body.detail === 'string') {
    return { fieldErrors: {}, apiMessage: body.detail }
  }

  const fieldErrors: Record<string, any> = {}
  const topLevelMessages: string[] = []

  for (const [key, value] of Object.entries(body)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key

    if (Array.isArray(value)) {
      const msg = value.filter(Boolean).join('. ')
      if (msg) {
        if (prefix) {
          fieldErrors[prefix] ??= {}
          fieldErrors[prefix][key] = { message: msg }
        } else {
          fieldErrors[key] = { message: msg }
        }
      }
    } else if (isRecord(value)) {
      const nested = parseFieldErrors(value, fieldPath)
      Object.assign(fieldErrors, nested.fieldErrors)
      topLevelMessages.push(...nested.apiMessage.split('. ').filter(Boolean))
    } else {
      topLevelMessages.push(String(value))
    }
  }

  return { fieldErrors, apiMessage: topLevelMessages.join('. ') || 'Erro ao salvar.' }
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

export function FuncionariosPage() {
  const [users, setUsers] = useState<UserListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<UserCreateRequest>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({})
  const [error, setError] = useState('')
  const [hotelName, setHotelName] = useState('')

  const loadUsers = async () => {
    try {
      const data = await authService.listFuncionarios()
      setUsers(data)
      setError('')
    } catch {
      setError('Erro ao carregar lista de funcionários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    hotelService.getHotel().then(h => setHotelName(h.nome)).catch(() => {})
  }, [])

  const filteredUsers = users.filter((u: UserListResponse) =>
    u.first_name.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setFieldErrors({})
    setShowModal(true)
  }

  const openEdit = async (id: number) => {
    setError('')
    setFieldErrors({})
    try {
      const user = await authService.getUser(id)
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        telefone: user.telefone,
        dataNascimento: user.dataNascimento,
        genero: user.genero,
        cpf: user.cpf,
        role: user.role === 'HO' ? 'AT' : user.role,
        senha: '',
        endereco: { ...user.endereco },
        is_active: user.is_active,
      })
      setEditingId(id)
      setShowModal(true)
    } catch {
      setError('Erro ao carregar dados do usuário.')
    }
  }

  const handleSave = async () => {
    setFieldErrors({})
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const { senha, ...payload } = form
        if (senha) {
          await authService.updateUser(editingId, { ...payload, senha })
        } else {
          await authService.updateUser(editingId, payload)
        }
      } else {
        await authService.createUser(form)
      }
      setShowModal(false)
      loadUsers()
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

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Inativar ${name}? O usuário não poderá mais fazer login.`)) return
    try {
      await authService.deleteUser(id)
      loadUsers()
    } catch {
      setError('Erro ao inativar usuário.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-500" />
            {hotelName || 'Hotel'}
          </h1>
          <p className="text-muted mt-1">Funcionários — Gerencie os perfis da equipe</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Table */}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Nome</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Email</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Cargo</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Cadastro</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    Nenhum funcionário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold
                          ${getRoleColor(u.role)}
                        `}>
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-muted">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                        getRoleColor(u.role),
                      )}>
                        <Shield className="h-3 w-3" />
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <UserCheck className="h-3.5 w-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                          <UserX className="h-3.5 w-3.5" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted">{formatDate(u.date_joined)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(u.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.first_name)}
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

      {/* Modal */}
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
              <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserCog className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
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
                    <Input label="Nome" placeholder="Nome" value={form.first_name}
                      error={fieldErrors.first_name?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, first_name: undefined}); setForm({...form, first_name: e.target.value}) }} />
                    <Input label="Sobrenome" placeholder="Sobrenome" value={form.last_name}
                      error={fieldErrors.last_name?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, last_name: undefined}); setForm({...form, last_name: e.target.value}) }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="E-mail" type="email" placeholder="email@exemplo.com" value={form.email}
                      error={fieldErrors.email?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, email: undefined}); setForm({...form, email: e.target.value}) }} />
                    <Input label="Username" placeholder="username" value={form.username}
                      error={fieldErrors.username?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, username: undefined}); setForm({...form, username: e.target.value}) }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="CPF" placeholder="000.000.000-00" value={form.cpf}
                      error={fieldErrors.cpf?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, cpf: undefined}); setForm({...form, cpf: e.target.value}) }} />
                    <Input label="Telefone" placeholder="(00) 00000-0000" value={form.telefone}
                      error={fieldErrors.telefone?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, telefone: undefined}); setForm({...form, telefone: e.target.value}) }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Data de Nascimento" type="date" value={form.dataNascimento}
                      error={fieldErrors.dataNascimento?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, dataNascimento: undefined}); setForm({...form, dataNascimento: e.target.value}) }} />
                    <Select label="Gênero" placeholder="Selecione" options={generoOptions} value={form.genero}
                      error={fieldErrors.genero?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, genero: undefined}); setForm({...form, genero: e.target.value}) }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Cargo" options={roleOptions} value={form.role}
                      error={fieldErrors.role?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, role: undefined}); setForm({...form, role: e.target.value as Role}) }} />
                    <Input label="Senha" type="password" placeholder={editingId ? "Deixe em branco para manter" : "Mínimo 8 caracteres"} value={form.senha}
                      error={fieldErrors.senha?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, senha: undefined}); setForm({...form, senha: e.target.value}) }} />
                  </div>

                  {editingId && (
                    <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <p className="text-xs text-muted">
                          {form.is_active !== false ? 'Funcionário ativo no sistema' : 'Funcionário inativo — não faz login'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({...form, is_active: form.is_active === false})}
                        className={cn(
                          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          form.is_active !== false ? 'bg-green-500' : 'bg-gray-300',
                        )}
                      >
                        <span className={cn(
                          'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          form.is_active !== false ? 'translate-x-5' : 'translate-x-0',
                        )} />
                      </button>
                    </div>
                  )}

                  <hr className="border-gray-100" />
                  <h3 className="font-medium text-gray-900">Endereço</h3>

                  <div className="grid grid-cols-[1fr_80px] gap-4">
                    <Input label="Rua" placeholder="Nome da rua" value={form.endereco.rua}
                      error={fieldErrors.endereco?.rua?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, rua: undefined}}); setForm({...form, endereco: {...form.endereco, rua: e.target.value}}) }} />
                    <Input label="Nº" placeholder="000" value={form.endereco.numero}
                      error={fieldErrors.endereco?.numero?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, numero: undefined}}); setForm({...form, endereco: {...form.endereco, numero: e.target.value}}) }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Complemento" placeholder="Apto, Bloco (opcional)" value={form.endereco.complemento}
                      error={fieldErrors.endereco?.complemento?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, complemento: undefined}}); setForm({...form, endereco: {...form.endereco, complemento: e.target.value}}) }} />
                    <Input label="Bairro" placeholder="Seu bairro" value={form.endereco.bairro}
                      error={fieldErrors.endereco?.bairro?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, bairro: undefined}}); setForm({...form, endereco: {...form.endereco, bairro: e.target.value}}) }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Cidade" placeholder="Sua cidade" value={form.endereco.cidade}
                      error={fieldErrors.endereco?.cidade?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, cidade: undefined}}); setForm({...form, endereco: {...form.endereco, cidade: e.target.value}}) }} />
                    <Select label="Estado" placeholder="Selecione" options={estadoOptions} value={form.endereco.estado}
                      error={fieldErrors.endereco?.estado?.message}
                      onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, estado: undefined}}); setForm({...form, endereco: {...form.endereco, estado: e.target.value}}) }} />
                  </div>

                  <Input label="CEP" placeholder="00000-000" value={form.endereco.cep}
                    error={fieldErrors.endereco?.cep?.message}
                    onChange={e => { setFieldErrors({...fieldErrors, endereco: {...fieldErrors.endereco, cep: undefined}}); setForm({...form, endereco: {...form.endereco, cep: e.target.value}}) }} />

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
