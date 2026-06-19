import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/features/shared/Modal'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { useAuth } from '@/hooks/useAuth'
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Tab = 'login' | 'register'

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)

  const [loginForm, setLoginForm] = useState({ username: '', senha: '' })
  const [registerForm, setRegisterForm] = useState({
    first_name: '', last_name: '', email: '', username: '',
    telefone: '', cpf: '', senha: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginForm.username, loginForm.senha)
      onSuccess?.()
      onClose()
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setError('Usuário ou senha inválidos.')
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!registerForm.first_name.trim() || !registerForm.last_name.trim()) {
      setError('Nome e sobrenome são obrigatórios.')
      return
    }
    if (!registerForm.email.trim()) {
      setError('Email é obrigatório.')
      return
    }
    if (!registerForm.username.trim()) {
      setError('Username é obrigatório.')
      return
    }
    if (registerForm.senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      await register({
        ...registerForm,
        dataNascimento: '2000-01-01',
        genero: 'O',
        endereco: {
          rua: '', numero: '', complemento: '',
          bairro: '', cidade: '', estado: '', cep: '',
        },
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      if (err && typeof err === 'object' && 'response' in err) {
        try {
          const body = await (err as { response: Response }).response.clone().json()
          setError(Object.values(body).flat().join(' '))
        } catch {
          setError('Erro ao cadastrar. Verifique os dados.')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao cadastrar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acesse sua conta">
      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              tab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted hover:text-gray-900'
            }`}
          >
            <LogIn className="mr-1.5 inline h-4 w-4" />
            Entrar
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              tab === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted hover:text-gray-900'
            }`}
          >
            <UserPlus className="mr-1.5 inline h-4 w-4" />
            Cadastrar
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <Input
                label="Usuário"
                placeholder="Seu username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={loginForm.senha}
                  onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <Button type="submit" isLoading={loading} className="w-full">
                Entrar
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nome"
                  placeholder="Nome"
                  value={registerForm.first_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                />
                <Input
                  label="Sobrenome"
                  placeholder="Sobrenome"
                  value={registerForm.last_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                />
              </div>
              <Input
                label="E-mail"
                type="email"
                placeholder="email@exemplo.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
              <Input
                label="Username"
                placeholder="Escolha um username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={registerForm.cpf}
                  onChange={(e) => setRegisterForm({ ...registerForm, cpf: e.target.value })}
                />
                <Input
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  value={registerForm.telefone}
                  onChange={(e) => setRegisterForm({ ...registerForm, telefone: e.target.value })}
                />
              </div>
              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={registerForm.senha}
                  onChange={(e) => setRegisterForm({ ...registerForm, senha: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <Button type="submit" isLoading={loading} className="w-full">
                Criar Conta
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
