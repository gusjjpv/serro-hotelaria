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
    <div className="bg-white">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-gray-900 py-24 text-white">
        <div className="absolute inset-0">
          <img src="/hero-bg.png" alt="Luxury Hotel" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl drop-shadow-lg"
          >
            Sua jornada começa <span className="text-primary-400">aqui</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mx-auto mt-6 max-w-2xl text-xl text-gray-200 drop-shadow-md font-medium"
          >
            Experiências inesquecíveis, luxo e conforto nos melhores destinos.
          </motion.p>

          {/* Search form */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            onSubmit={handleSearch}
            className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 p-2"
          >
            <div className="flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-inner">
              <div className="flex-1 border-b border-gray-100 p-5 md:border-b-0 md:border-r hover:bg-gray-50 transition-colors">
                <label className="block text-left text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                  Check-in
                </label>
                <input
                  type="date"
                  min={today}
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  className="w-full text-gray-900 focus:outline-none bg-transparent font-medium"
                  required
                />
              </div>
              <div className="flex-1 border-b border-gray-100 p-5 md:border-b-0 md:border-r hover:bg-gray-50 transition-colors">
                <label className="block text-left text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                  Check-out
                </label>
                <input
                  type="date"
                  min={dataEntrada || today}
                  value={dataSaida}
                  onChange={(e) => setDataSaida(e.target.value)}
                  className="w-full text-gray-900 focus:outline-none bg-transparent font-medium"
                  required
                />
              </div>
              <div className="flex-1 border-b border-gray-100 p-5 md:border-b-0 md:border-r hover:bg-gray-50 transition-colors">
                <label className="block text-left text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
                  Hóspedes
                </label>
                <select
                  value={numHospedes}
                  onChange={(e) => setNumHospedes(Number(e.target.value))}
                  className="w-full text-gray-900 focus:outline-none bg-transparent font-medium cursor-pointer"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} hóspede{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center p-3 bg-white">
                <button
                  type="submit"
                  className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 font-bold text-white transition-all hover:scale-105 hover:shadow-lg hover:from-primary-700 hover:to-primary-600 md:w-auto"
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
      <section className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Comodidades Premium</h2>
          <div className="mt-4 mx-auto h-1 w-24 rounded bg-primary-600"></div>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">Tudo o que você precisa para uma estadia inesquecível, pensado em cada detalhe para o seu conforto.</p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6"
        >
          {amenities.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="group flex flex-col items-center gap-4 rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                <Icon className="h-8 w-8" />
              </div>
              <span className="text-sm font-bold text-gray-800">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Hotels */}
      {hotels.length > 0 && (
        <section className="bg-gray-50 py-24 border-y border-gray-100">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Nossos Destinos</h2>
                <div className="mt-4 h-1 w-24 rounded bg-primary-600"></div>
                <p className="mt-6 text-lg text-gray-600">Conheça nossos hotéis exclusivos e escolha o seu próximo destino.</p>
              </div>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel, i) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-72 overflow-hidden">
                    <img src="/hotel-room.png" alt={hotel.nome} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-md">{hotel.nome}</h3>
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-200">
                        <MapPin className="h-4 w-4 text-primary-400" />
                        {hotel.cidade}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-6">
                    <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed mb-6">
                      Aproveite nossa estrutura completa em {hotel.cidade}. Quartos confortáveis, atendimento premium e localização privilegiada para garantir que sua experiência seja a melhor possível.
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Ver detalhes</span>
                      <button 
                        onClick={() => navigate(`/hoteis/${hotel.id}`)}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm"
                      >
                        <Search className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Institutional */}
      <section className="relative overflow-hidden bg-white py-32">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Experiência Única em Hospedagem</h2>
              <div className="mt-6 h-1 w-20 rounded bg-primary-600"></div>
              <p className="mt-8 text-lg text-gray-600 leading-relaxed font-medium">
                Oferecemos uma experiência completa de hospedagem com quartos luxuosos,
                atendimento altamente personalizado e infraestrutura de excelência. Nossos hotéis são
                cuidadosamente pensados para proporcionar conforto inigualável.
              </p>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed font-medium">
                Com localizações privilegiadas, gastronomia de alto padrão e equipes dedicadas a cada detalhe, 
                garantimos uma estadia agradável e segura. Reserve agora e descubra o padrão SERRÔ de hospitalidade.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative lg:ml-10"
            >
              <div className="absolute -inset-4 bg-primary-50/50 rounded-[3rem] transform rotate-3 scale-105"></div>
              <div className="relative grid grid-cols-2 gap-6">
                {[
                  { value: '5K+', label: 'Hóspedes Satisfeitos', icon: Star },
                  { value: '4.9', label: 'Avaliação Média', icon: Star },
                  { value: '24h', label: 'Atendimento Premium', icon: Coffee },
                  { value: '100%', label: 'Conforto Garantido', icon: Waves },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="group rounded-3xl border border-gray-100 bg-white/80 backdrop-blur-sm p-8 text-center shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="mt-5 text-4xl font-black text-gray-900">{value}</p>
                    <p className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
