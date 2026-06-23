import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Card } from '@/features/shared/Card'
import { LogIn, Hotel, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuth((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(username, password)
      navigate('/app')
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response: Response }).response
        if (resp.status === 401) {
          setError('Credenciais inválidas. Verifique username e senha.')
        } else {
          setError('Erro ao conectar ao servidor. Tente novamente.')
        }
      } else {
        setError('Erro ao conectar ao servidor. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-surface">
      {/* Left Side: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <img src="/hotel-room.png" alt="Hotel Room" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Sua melhor estadia começa aqui.</h2>
          <p className="text-lg text-gray-200 font-medium drop-shadow-md max-w-lg">Acesse sua conta para gerenciar reservas, conferir extratos e solicitar serviços exclusivos de forma rápida e segura.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-100/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gold-100/50 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-block">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xl shadow-primary-500/20 hover:scale-105 transition-transform"
              >
                <Hotel className="h-8 w-8" />
              </motion.div>
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bem-vindo de volta</h1>
            <p className="text-gray-500 mt-2 text-lg">Faça login para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                id="username"
                label="Username"
                type="text"
                placeholder="Seu username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <Input
                id="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium"
              >
                {error}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full text-lg h-12 rounded-xl"
                size="lg"
              >
                <LogIn className="h-5 w-5" />
                Entrar na Conta
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-gray-600 font-medium"
          >
            Ainda não tem cadastro?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Criar minha conta
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
