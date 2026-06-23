import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as hotelService from '@/services/endpoints/hotel'
import * as reservaService from '@/services/endpoints/reserva'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/features/auth/AuthModal'
import { Button } from '@/features/shared/Button'
import { formatCurrency } from '@/lib/utils'
import { extractApiError } from '@/lib/api-errors'
import type { HotelPublicDetail, CategoriaDisponivel } from '@/types/hotel'
import {
  ArrowLeft, Calendar, Users, BedDouble,
  Clock, AlertTriangle, CheckCircle, CreditCard,
} from 'lucide-react'

export function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const hotelId = Number(searchParams.get('hotel'))
  const categoriaId = Number(searchParams.get('categoria'))
  const dataEntrada = searchParams.get('entrada') || ''
  const dataSaida = searchParams.get('saida') || ''
  const numHospedes = Number(searchParams.get('hospedes') || 2)

  const [hotel, setHotel] = useState<HotelPublicDetail | null>(null)
  const [categoria, setCategoria] = useState<CategoriaDisponivel | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hotelId) return
    Promise.all([
      hotelService.getHotelPublic(hotelId),
      hotelService.getDisponibilidade(hotelId, { dataEntrada, dataSaida, numHospedes }),
    ])
      .then(([h, cats]) => {
        setHotel(h)
        setCategoria(cats.find(c => c.id === categoriaId) || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [hotelId, categoriaId, dataEntrada, dataSaida, numHospedes])

  const formatDateBR = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    setConfirming(true)
    setError('')
    try {
      const reserva = await reservaService.createReserva({
        hotel: hotelId,
        categoria: categoriaId,
        dataEntrada,
        dataSaida,
        numHospedes,
      })
      navigate(`/reserva-sucesso?codigo=${reserva.codigo}`)
    } catch (err) {
      setError(await extractApiError(err))
    } finally {
      setConfirming(false)
    }
  }

  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    setConfirming(true)
    setError('')
    try {
      const reserva = await reservaService.createReserva({
        hotel: hotelId,
        categoria: categoriaId,
        dataEntrada,
        dataSaida,
        numHospedes,
      })
      navigate(`/reserva-sucesso?codigo=${reserva.codigo}`)
    } catch (err) {
      setError(await extractApiError(err))
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-8 w-64" />
            <div className="skeleton h-40 w-full rounded-2xl" />
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!hotel || !categoria) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <p className="text-lg font-medium text-gray-900">Dados não encontrados</p>
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
        to={`/disponibilidade?hotel=${hotelId}&entrada=${dataEntrada}&saida=${dataSaida}&hospedes=${numHospedes}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos resultados
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="space-y-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-gray-900">{hotel.nome}</h1>
            <p className="mt-1 text-muted">{hotel.enderecoCompleto}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <BedDouble className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{categoria.nome}</h2>
                <p className="text-sm text-muted">{categoria.descricao}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-gray-400" />
                Até {categoria.capacidade} pessoa{categoria.capacidade > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BedDouble className="h-4 w-4 text-gray-400" />
                {categoria.quartosDisponiveis} quarto{categoria.quartosDisponiveis > 1 ? 's' : ''} disponível{categoria.quartosDisponiveis > 1 ? 'is' : ''}
              </div>
            </div>
          </motion.div>

          {/* Rules */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Regras da estadia</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>Check-in a partir das <strong>14:00</strong> / Check-out até às <strong>12:00</strong></span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                <span>Cancelamento gratuito até 24 horas antes do check-in</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Wi-Fi, estacionamento e café da manhã inclusos</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Summary */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Resumo da Reserva</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Check-in</span>
                <span className="font-medium text-gray-900">{formatDateBR(dataEntrada)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Check-out</span>
                <span className="font-medium text-gray-900">{formatDateBR(dataSaida)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Hóspedes</span>
                <span className="font-medium text-gray-900">{numHospedes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Categoria</span>
                <span className="font-medium text-gray-900">{categoria.nome}</span>
              </div>

              <hr className="border-gray-100" />

              <div className="flex justify-between">
                <span className="text-muted">{formatCurrency(categoria.precoBase)} x {categoria.dias} diária{categoria.dias > 1 ? 's' : ''}</span>
                <span className="font-medium text-gray-900">{formatCurrency(categoria.precoBase * categoria.dias)}</span>
              </div>

              <hr className="border-gray-100" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(categoria.valorTotal)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <Button
              onClick={handleConfirm}
              isLoading={confirming}
              className="mt-6 w-full"
              size="lg"
            >
              <CreditCard className="h-4 w-4" />
              {isAuthenticated ? 'Confirmar Reserva' : 'Entrar e Confirmar'}
            </Button>

            {!isAuthenticated && (
              <p className="mt-3 text-center text-xs text-muted">
                Você precisará fazer login ou criar uma conta para confirmar
              </p>
            )}
          </motion.div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
