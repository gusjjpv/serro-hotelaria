import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { formatDate } from '@/lib/utils'
import * as authService from '@/services/endpoints/auth'
import * as hotelService from '@/services/endpoints/hotel'
import type { UserListResponse } from '@/types'
import { Search, UserCheck, UserX, Building2 } from 'lucide-react'

export function HospedesPage() {
  const [guests, setGuests] = useState<UserListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hotelName, setHotelName] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authService.listHospedes()
        setGuests(data)
      } catch {
        setGuests([])
      } finally {
        setLoading(false)
      }
    }
    load()
    hotelService.getHotel().then(h => setHotelName(h.nome)).catch(() => {})
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
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary-500" />
          {hotelName || 'Hotel'}
        </h1>
        <p className="text-muted mt-1">Hóspedes — Consulte os hóspedes cadastrados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-2xl border-0 py-3.5 pl-12 pr-4 text-gray-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-all"
        />
      </div>

      <Card className="overflow-hidden !p-0 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-5"><div className="skeleton h-5 w-full rounded-md" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
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
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-sm font-bold uppercase tracking-wider shadow-inner">
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{u.first_name} {u.last_name}</p>
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
