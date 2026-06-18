import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { formatDate } from '@/lib/utils'
import * as authService from '@/services/endpoints/auth'
import type { UserListResponse } from '@/types'
import { Search, UserCheck, UserX } from 'lucide-react'

export function HospedesPage() {
  const [guests, setGuests] = useState<UserListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authService.listUsers()
        setGuests(data.filter(u => u.role === 'HO'))
      } catch {
        setGuests([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = guests.filter((u: UserListResponse) =>
    u.first_name.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hóspedes</h1>
        <p className="text-muted mt-1">Consulte os hóspedes cadastrados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-xl border-2 border-gray-200 pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
        />
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Nome</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Email</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Username</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-5 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">
                    Nenhum hóspede encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xs font-bold">
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted">@{u.username}</span>
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
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}
