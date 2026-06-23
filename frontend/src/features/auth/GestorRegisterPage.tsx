import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { Card } from '@/features/shared/Card'
import { Shield, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { formatCpf, formatPhone, formatCep } from '@/lib/utils'
import { generoOptions, estadoOptions } from '@/lib/constants'

const INITIAL_STATE = {
  first_name: '', last_name: '', email: '', username: '',
  telefone: '', dataNascimento: '', genero: '', cpf: '', senha: '',
  endereco: {
    rua: '', numero: '', complemento: '', bairro: '',
    cidade: '', estado: '', cep: '',
  },
}

const REQUIRED_PESSOAL = ['first_name', 'last_name', 'email', 'username', 'telefone', 'dataNascimento', 'genero', 'cpf', 'senha'] as const
const REQUIRED_ENDERECO = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'] as const

function validateAll(data: typeof INITIAL_STATE) {
  const errs: Record<string, any> = {}

  if (!data.first_name?.trim()) errs.first_name = { message: 'Obrigatório' }
  if (!data.last_name?.trim()) errs.last_name = { message: 'Obrigatório' }
  if (!data.email?.trim()) errs.email = { message: 'Obrigatório' }
  if (!data.username?.trim()) errs.username = { message: 'Obrigatório' }
  if (!data.cpf?.trim()) errs.cpf = { message: 'Obrigatório' }
  if (!data.telefone?.trim()) errs.telefone = { message: 'Obrigatório' }
  if (!data.dataNascimento) errs.dataNascimento = { message: 'Obrigatório' }
  if (!data.genero) errs.genero = { message: 'Obrigatório' }
  if (!data.senha || data.senha.length < 8) errs.senha = { message: 'Mínimo 8 caracteres' }

  for (const field of REQUIRED_ENDERECO) {
    if (!data.endereco[field]?.trim()) {
      const enderecoErrors: Record<string, any> = errs.endereco ?? {}
      enderecoErrors[field] = { message: 'Obrigatório' }
      errs.endereco = enderecoErrors
    }
  }

  return errs
}

async function extractError(err: unknown): Promise<string> {
  if (err instanceof Response) {
    return extractErrorFromResponse(err)
  }
  if (err && typeof err === 'object' && 'response' in err) {
    return extractErrorFromResponse((err as { response: Response }).response)
  }
  if (err instanceof Error) return err.message
  return 'Erro ao conectar ao servidor.'
}

async function extractErrorFromResponse(response: Response): Promise<string> {
  try {
    const text = await response.clone().text()
    try {
      const body = JSON.parse(text)
      const msgs = Object.values(body).flat().filter(Boolean).join('. ')
      return msgs || text
    } catch {
      return text
    }
  } catch {
    return 'Erro ao cadastrar. Verifique os dados.'
  }
}

export function GestorRegisterPage() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const registerGestor = useAuth((s) => s.registerGestor)
  const navigate = useNavigate()

  const setValue = useCallback((field: string, value: string) => {
    if (field.startsWith('endereco.')) {
      const sub = field.replace('endereco.', '')
      setFormData(prev => ({
        ...prev,
        endereco: { ...prev.endereco, [sub]: value },
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }, [])

  const validateStep = () => {
    const allErrors = validateAll(formData)
    const stepErrors: Record<string, any> = {}

    const fields = step === 0 ? REQUIRED_PESSOAL : ['endereco']
    for (const f of fields) {
      if (allErrors[f as string]) {
        stepErrors[f as string] = allErrors[f as string]
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleSubmit = async () => {
    const allErrors = validateAll(formData)
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) return

    setIsLoading(true)
    setApiError('')

    try {
      await registerGestor({
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        endereco: {
          ...formData.endereco,
          cep: formData.endereco.cep.replace(/\D/g, ''),
        },
      })
      navigate('/app')
    } catch (err) {
      setApiError(await extractError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (validateStep()) setStep(1)
  }

  const prevStep = () => {
    setStep(0)
    setErrors({})
  }

  const fieldProps = (field: string) => ({
    value: formData[field as keyof typeof formData] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValue(field, e.target.value),
  })

  const addressFieldProps = (field: string) => ({
    value: formData.endereco[field as keyof typeof formData.endereco],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValue(`endereco.${field}`, e.target.value),
  })

  return (
    <div className="min-h-screen w-full flex bg-surface">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <img src="/hotel-facade.png" alt="Hotel Facade" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-900/50 border border-primary-500/30 text-primary-300 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Conta Gestor</span>
          </div>
          <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Assuma o controle.</h2>
          <p className="text-lg text-gray-200 font-medium drop-shadow-md max-w-lg">Crie a sua conta de administrador e libere todo o potencial do seu hotel com nossas ferramentas avançadas.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 py-12 relative overflow-y-auto max-h-screen">
        <div className="fixed inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-100/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gold-100/50 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-xl relative z-10"
        >
          <div className="text-center mb-10">
            <Link to="/para-hoteis" className="inline-block">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-xl shadow-gray-900/20 hover:scale-105 transition-transform"
              >
                <Shield className="h-8 w-8 text-primary-400" />
              </motion.div>
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cadastro Gestor</h1>
            <p className="text-gray-500 mt-2 text-lg">Inicie a digitalização do seu negócio</p>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center justify-center gap-6 mb-10">
              {[
                { title: 'Gestor', description: 'Dados' },
                { title: 'Hotel', description: 'Endereço' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`
                    flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300
                    ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30' : 'bg-gray-100 text-gray-400'}
                  `}>
                    {i < step ? <Check className="h-5 w-5" /> : i + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-bold ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <Input id="first_name" label="Nome" placeholder="Seu nome" {...fieldProps('first_name')} error={errors.first_name?.message} />
                      <Input id="last_name" label="Sobrenome" placeholder="Seu sobrenome" {...fieldProps('last_name')} error={errors.last_name?.message} />
                    </div>

                    <Input id="email" label="E-mail Profissional" type="email" placeholder="gestor@hotel.com" {...fieldProps('email')} error={errors.email?.message} />
                    <Input id="username" label="Username" placeholder="Nome de usuário" {...fieldProps('username')} error={errors.username?.message} />

                    <div className="grid grid-cols-2 gap-5">
                      <Input id="cpf" label="CPF" placeholder="000.000.000-00" maxLength={14}
                        value={formData.cpf} onChange={(e) => setValue('cpf', formatCpf(e.target.value))}
                        error={errors.cpf?.message} />
                      <Input id="telefone" label="Telefone" placeholder="(00) 00000-0000" maxLength={15}
                        value={formData.telefone} onChange={(e) => setValue('telefone', formatPhone(e.target.value))}
                        error={errors.telefone?.message} />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <Input id="dataNascimento" label="Data de Nascimento" type="date" {...fieldProps('dataNascimento')} error={errors.dataNascimento?.message} />
                      <Select id="genero" label="Gênero" placeholder="Selecione" options={generoOptions} {...fieldProps('genero')} error={errors.genero?.message} />
                    </div>

                    <Input id="senha" label="Senha Forte" type="password" placeholder="Mínimo 8 caracteres" {...fieldProps('senha')} error={errors.senha?.message} />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <Input id="cep" label="CEP" placeholder="00000-000" maxLength={9}
                      value={formData.endereco.cep} onChange={(e) => setValue('endereco.cep', formatCep(e.target.value))}
                      error={errors.endereco?.cep?.message} />

                    <div className="grid grid-cols-[1fr_100px] gap-5">
                      <Input id="rua" label="Rua" placeholder="Nome da rua" {...addressFieldProps('rua')} error={errors.endereco?.rua?.message} />
                      <Input id="numero" label="Nº" placeholder="000" {...addressFieldProps('numero')} error={errors.endereco?.numero?.message} />
                    </div>

                    <Input id="complemento" label="Complemento" placeholder="Apto, Bloco, etc. (opcional)" {...addressFieldProps('complemento')} error={errors.endereco?.complemento?.message} />

                    <div className="grid grid-cols-2 gap-5">
                      <Input id="bairro" label="Bairro" placeholder="Seu bairro" {...addressFieldProps('bairro')} error={errors.endereco?.bairro?.message} />
                      <Input id="cidade" label="Cidade" placeholder="Sua cidade" {...addressFieldProps('cidade')} error={errors.endereco?.cidade?.message} />
                    </div>

                    <Select id="estado" label="Estado" placeholder="Selecione um estado" options={estadoOptions} {...addressFieldProps('estado')} error={errors.endereco?.estado?.message} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {apiError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 font-medium"
              >
                {apiError}
              </motion.p>
            )}

            <div className="mt-10 flex gap-4">
              {step > 0 && (
                <Button variant="outline" onClick={prevStep} className="flex-1 h-12 rounded-xl text-lg border-gray-300">
                  <ChevronLeft className="h-5 w-5" />
                  Voltar
                </Button>
              )}
              {step < 1 ? (
                <Button onClick={nextStep} className="flex-1 h-12 rounded-xl text-lg bg-gray-900 hover:bg-gray-800 text-white">
                  Próximo Passo
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1 h-12 rounded-xl text-lg bg-gray-900 hover:bg-gray-800 text-white">
                  <Check className="h-5 w-5" />
                  Concluir Cadastro
                </Button>
              )}
            </div>
          </div>

          <p className="mt-8 text-center text-gray-600 font-medium">
            Já possui uma conta Gestor?{' '}
            <Link to="/login" className="font-bold text-gray-900 hover:text-primary-600 transition-colors">
              Fazer login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
