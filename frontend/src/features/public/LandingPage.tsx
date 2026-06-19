import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as hotelService from '@/services/endpoints/hotel'
import type { HotelPublic } from '@/types/hotel'
import { Search, MapPin, Wifi, Car, Coffee, UtensilsCrossed, Waves, Star } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState<HotelPublic[]>([])
  const [dataEntrada, setDataEntrada] = useState('')
  const [dataSaida, setDataSaida] = useState('')
  const [numHospedes, setNumHospedes] = useState(2)

  useEffect(() => {
    hotelService.listHotelsPublic().then(setHotels).catch(() => setHotels([]))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataEntrada || !dataSaida) return
    const hotelId = hotels[0]?.id
    if (!hotelId) return
    navigate(`/disponibilidade?hotel=${hotelId}&entrada=${dataEntrada}&saida=${dataSaida}&hospedes=${numHospedes}`)
  }

  const today = new Date().toISOString().split('T')[0]

  const amenities = [
    { icon: Wifi, label: 'Wi-Fi Gratuito' },
    { icon: Car, label: 'Estacionamento' },
    { icon: Coffee, label: 'Café da Manhã' },
    { icon: UtensilsCrossed, label: 'Restaurante' },
    { icon: Waves, label: 'Piscina' },
    { icon: Star, label: 'Spa & Wellness' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/20" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Reserve sua estadia
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-primary-100"
          >
            Encontre o quarto perfeito para sua viagem com os melhores preços
          </motion.p>

          {/* Search form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 border-b border-gray-100 p-4 md:border-b-0 md:border-r">
                <label className="block text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Check-in
                </label>
                <input
                  type="date"
                  min={today}
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  className="mt-1 w-full text-gray-900 focus:outline-none"
                  required
                />
              </div>
              <div className="flex-1 border-b border-gray-100 p-4 md:border-b-0 md:border-r">
                <label className="block text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Check-out
                </label>
                <input
                  type="date"
                  min={dataEntrada || today}
                  value={dataSaida}
                  onChange={(e) => setDataSaida(e.target.value)}
                  className="mt-1 w-full text-gray-900 focus:outline-none"
                  required
                />
              </div>
              <div className="flex-1 border-b border-gray-100 p-4 md:border-b-0 md:border-r">
                <label className="block text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Hóspedes
                </label>
                <select
                  value={numHospedes}
                  onChange={(e) => setNumHospedes(Number(e.target.value))}
                  className="mt-1 w-full text-gray-900 focus:outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} hóspede{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center p-4">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-primary-700 md:w-auto"
                >
                  <Search className="h-5 w-5" />
                  Buscar
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Amenities */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {amenities.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <Icon className="h-6 w-6 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Hotels */}
      {hotels.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">Nossos Hotéis</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel, i) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{hotel.nome}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {hotel.cidade}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Institutional */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-900">SERRÔ Hotelaria</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Oferecemos uma experiência completa de hospedagem com quartos confortáveis,
              atendimento personalizado e infraestrutura de qualidade. Nossos hotéis são
              pensados para atender desde viajantes de negócios até famílias em busca de
              lazer e descanso.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Com localização privilegiada e equipes dedicadas, garantimos uma estadia
              agradável e segura. Reserve agora e descubra o que temos a oferecer.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '500+', label: 'Hóspedes atendidos' },
                { value: '4.8', label: 'Avaliação média' },
                { value: '24h', label: 'Recepção' },
                { value: '100%', label: 'Wi-Fi gratuito' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
                  <p className="text-2xl font-bold text-primary-600">{value}</p>
                  <p className="mt-1 text-sm text-muted">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
