import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, CalendarCheck, Home, ClipboardList } from 'lucide-react'

export function ReservaSucessoPage() {
  const [searchParams] = useSearchParams()
  const codigo = searchParams.get('codigo') || 'RES0000'

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle className="h-10 w-10 text-green-600" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900">Reserva confirmada!</h1>
        <p className="mt-2 text-muted">
          Sua reserva foi realizada com sucesso. Você receberá um email de confirmação em breve.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Código da reserva</p>
          <p className="mt-1 text-3xl font-bold tracking-wider text-primary-600">{codigo}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <CalendarCheck className="h-4 w-4" />
            Minhas Reservas
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Voltar para o início
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
