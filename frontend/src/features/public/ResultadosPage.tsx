import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as hotelService from '@/services/endpoints/hotel'
import type { CategoriaDisponivel } from '@/types/hotel'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Calendar, Users, BedDouble, Check } from 'lucide-react'

export function ResultadosPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const hotelId = Number(searchParams.get('hotel'))
  const dataEntrada = searchParams.get('entrada') || ''
  const dataSaida = searchParams.get('saida') || ''
  const numHospedes = Number(searchParams.get('hospedes') || 2)

  const [categorias, setCategorias] = useState<CategoriaDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hotelId || !dataEntrada || !dataSaida) return
    hotelService.getDisponibilidade(hotelId, { dataEntrada, dataSaida, numHospedes })
      .then(setCategories => {
        setCategorias(setCategories)
        setError('')
      })
      .catch(() => setError('Erro ao buscar disponibilidade.'))
      .finally(() => setLoading(false))
  }, [hotelId, dataEntrada, dataSaida, numHospedes])

  const formatDateBR = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'short',
    })
  }

  const dias = dataEntrada && dataSaida
    ? Math.max(1, Math.ceil((new Date(dataSaida).getTime() - new Date(dataEntrada).getTime()) / 86400000))
    : 0

  const handleSelect = (cat: CategoriaDisponivel) => {
    navigate(`/reservar?hotel=${hotelId}&categoria=${cat.id}&entrada=${dataEntrada}&saida=${dataSaida}&hospedes=${numHospedes}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Nova busca
      </Link>

      {/* Search summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="h-4 w-4 text-primary-600" />
          <span className="font-medium">{formatDateBR(dataEntrada)}</span>
          <span className="text-muted">a</span>
          <span className="font-medium">{formatDateBR(dataSaida)}</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Users className="h-4 w-4 text-primary-600" />
          <span className="font-medium">{numHospedes} hóspede{numHospedes > 1 ? 's' : ''}</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm text-muted">{dias} diária{dias > 1 ? 's' : ''}</span>
      </motion.div>

      <h2 className="mb-6 text-xl font-bold text-gray-900">Categorias Disponíveis</h2>

      {loading ? (
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
      ) : error ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Link to="/" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">
            &larr; Voltar
          </Link>
        </div>
      ) : categorias.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
          <BedDouble className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-900">Nenhuma categoria disponível</p>
          <p className="mt-1 text-sm text-muted">Tente outras datas ou número de hóspedes</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:underline">
            &larr; Refazer busca
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-200"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <BedDouble className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{cat.nome}</h3>
              {cat.descricao && (
                <p className="mt-1 text-sm text-muted line-clamp-2">{cat.descricao}</p>
              )}

              <div className="mt-4 flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Capacidade</span>
                  <span className="font-medium text-gray-900">{cat.capacidade} pessoa{cat.capacidade > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Diária</span>
                  <span className="font-medium text-gray-900">{formatCurrency(cat.precoBase)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Disponíveis</span>
                  <span className="font-medium text-green-600">{cat.quartosDisponiveis} quarto{cat.quartosDisponiveis > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-primary-50 p-3 text-center">
                <p className="text-xs text-muted">Total da estadia</p>
                <p className="text-xl font-bold text-primary-600">{formatCurrency(cat.valorTotal)}</p>
                <p className="text-xs text-muted">{cat.dias} diária{cat.dias > 1 ? 's' : ''}</p>
              </div>

              <button
                onClick={() => handleSelect(cat)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <Check className="h-4 w-4" />
                Selecionar
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
