import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Building2, TrendingUp, Users, CalendarCheck, BarChart3, CheckCircle2 } from 'lucide-react'

export function SaaSLandingPage() {
  const features = [
    {
      icon: CalendarCheck,
      title: 'Gestão de Reservas Inteligente',
      description: 'Mapa de reservas visual, check-in e check-out simplificados, evitando overbookings.'
    },
    {
      icon: TrendingUp,
      title: 'Tarifário Dinâmico',
      description: 'Ajuste seus preços com base na demanda e na sazonalidade de forma automática.'
    },
    {
      icon: Users,
      title: 'Controle de Hóspedes',
      description: 'Histórico completo, preferências e fidelização dos seus clientes em um clique.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Financeiros',
      description: 'Controle o caixa, fluxo de consumo e a rentabilidade do seu negócio em tempo real.'
    }
  ]

  return (
    <div className="bg-white">
      {/* Hero SaaS */}
      <section className="relative overflow-hidden bg-gray-900 text-white min-h-[80vh] flex items-center">
        <div className="absolute inset-0">
          <img src="/hotel-facade.png" alt="SaaS Management" className="h-full w-full object-cover opacity-30 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 flex flex-col md:flex-row items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="md:w-1/2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/50 border border-primary-500/30 text-primary-300 mb-6">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Para Gestores e Hoteleiros</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              Revolucione a gestão do seu <span className="text-primary-400">Hotel</span>.
            </h1>
            <p className="text-xl text-gray-300 font-medium mb-10 max-w-lg">
              Um sistema Property Management System (PMS) completo, moderno e desenhado para multiplicar seus lucros e automatizar sua rotina.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/register/gestor" 
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-500 transition-all hover:scale-105 hover:shadow-xl shadow-primary-600/30"
              >
                Criar Conta Grátis
              </Link>
              <Link 
                to="/login" 
                className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all border border-white/10"
              >
                Fazer Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features SaaS */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">Tudo que o seu negócio precisa</h2>
            <div className="mt-4 mx-auto h-1 w-24 rounded bg-primary-600"></div>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">Desenvolvido com tecnologia de ponta para atender as necessidades complexas da hotelaria de forma simples.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Social Proof CTA */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Pronto para digitalizar seu hotel?</h2>
            <p className="text-lg text-gray-600 mb-8">Junte-se a dezenas de hotéis que já aumentaram suas taxas de ocupação e reduziram falhas operacionais utilizando o SERRÔ Hotelaria.</p>
            <ul className="space-y-4 mb-10">
              {['Implantação em menos de 24h', 'Suporte técnico especializado', 'Sem taxas ocultas por reserva'].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-gray-800 font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Link 
              to="/register/gestor" 
              className="inline-flex px-8 py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
            >
              Começar Agora
            </Link>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative"
          >
            <div className="absolute -inset-4 bg-primary-50 rounded-[3rem] transform rotate-3"></div>
            <img src="/hotel-restaurant.png" alt="Hotel Restaurant" className="relative rounded-2xl shadow-2xl object-cover h-[400px] w-full" />
          </motion.div>
        </div>
      </section>
    </div>
  )
}
