import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as hotelService from '@/services/endpoints/hotel'
import type { HotelPublicDetail } from '@/types/hotel'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Phone, Mail, ArrowLeft, Users, BedDouble, DoorOpen } from 'lucide-react'

export function HotelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [hotel, setHotel] = useState<HotelPublicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    hotelService.getHotelPublic(Number(id))
      .then(setHotel)
      .catch(() => setError('Hotel não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="space-y-6">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-96" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="skeleton mb-3 h-6 w-1/2" />
                <div className="skeleton mb-2 h-4 w-full" />
                <div className="skeleton mb-4 h-4 w-3/4" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <p className="text-lg font-medium text-gray-900">{error || 'Hotel não encontrado'}</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:underline">
            &larr; Voltar para busca
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para busca
      </Link>

      {/* Hotel info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">{hotel.nome}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-gray-400" />
            {hotel.enderecoCompleto}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-gray-400" />
            {hotel.telefoneContato}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-gray-400" />
            {hotel.emailContato}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <DoorOpen className="h-3.5 w-3.5" />
            {hotel.totalQuartos} quarto{hotel.totalQuartos !== 1 ? 's' : ''} disponível{hotel.totalQuartos !== 1 ? 'is' : ''}
          </span>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Categorias Disponíveis</h2>
        {hotel.categorias.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-muted">Nenhuma categoria disponível neste hotel</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotel.categorias.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">{cat.nome}</h3>
                {cat.descricao && (
                  <p className="mt-1 text-sm text-muted">{cat.descricao}</p>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Capacidade</span>
                    <span className="flex items-center gap-1 font-medium text-gray-900">
                      <Users className="h-4 w-4 text-gray-400" />
                      {cat.capacidade} pessoa{cat.capacidade > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Preço base</span>
                    <span className="font-semibold text-primary-600">
                      {formatCurrency(cat.precoBase)}<span className="font-normal text-muted">/noite</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Disponíveis</span>
                    <span className="font-medium text-green-600">
                      {cat.quartosDisponiveis} quarto{cat.quartosDisponiveis !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="mt-4 block w-full rounded-xl bg-primary-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  {cat.quartosDisponiveis > 0 ? 'Cadastrar para reservar' : 'Indisponível'}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
