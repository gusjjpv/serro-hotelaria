import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/features/shared/Card'
import { Button } from '@/features/shared/Button'
import { Input } from '@/features/shared/Input'
import { Select } from '@/features/shared/Select'
import { formatCnpj, formatCep, formatPhone } from '@/lib/utils'
import { estadoOptions } from '@/lib/constants'
import { parseFieldErrors, extractApiErrorParsed } from '@/lib/api-errors'
import * as hotelService from '@/services/endpoints/hotel'
import type { Hotel, HotelCreateRequest } from '@/types'
import {
  Building2,
  Save,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react'

const EMPTY_FORM: HotelCreateRequest = {
  nome: '',
  cnpj: '',
  telefoneContato: '',
  emailContato: '',
  endereco: {
    rua: '', numero: '', complemento: '', bairro: '',
    cidade: '', estado: '', cep: '',
  },
}

const REQUIRED_FIELDS = ['nome', 'cnpj', 'telefoneContato', 'emailContato'] as const
const REQUIRED_ENDERECO = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'] as const

function validate(data: HotelCreateRequest) {
  const errs: Record<string, any> = {}

  for (const f of REQUIRED_FIELDS) {
    if (!data[f]?.trim()) {
      errs[f] = { message: 'Obrigatório' }
    }
  }

  if (data.emailContato && !data.emailContato.includes('@')) {
    errs.emailContato = { message: 'E-mail inválido' }
  }

  for (const f of REQUIRED_ENDERECO) {
    if (!data.endereco[f]?.trim()) {
      errs.endereco ??= {}
      errs.endereco[f] = { message: 'Obrigatório' }
    }
  }

  return errs
}

export function HotelPage() {
  const [form, setForm] = useState<HotelCreateRequest>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const hotel = await hotelService.getHotel()
        setForm({
          nome: hotel.nome,
          cnpj: hotel.cnpj,
          telefoneContato: hotel.telefoneContato,
          emailContato: hotel.emailContato,
          endereco: { ...hotel.endereco },
        })
        setMode('edit')
      } catch (err) {
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response: Response }).response
          if (response.status !== 404) {
            setApiError('Erro ao carregar dados do hotel.')
          }
        }
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const setValue = useCallback((field: string, value: string) => {
    setSaved(false)
    if (field.startsWith('endereco.')) {
      const sub = field.replace('endereco.', '')
      setForm(prev => ({
        ...prev,
        endereco: { ...prev.endereco, [sub]: value },
      }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }, [])

  const handleSubmit = async () => {
    const allErrors = validate(form)
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) return

    setIsSaving(true)
    setApiError('')

    try {
      const payload = {
        ...form,
        cnpj: form.cnpj.replace(/\D/g, ''),
        telefoneContato: form.telefoneContato.replace(/\D/g, ''),
        endereco: {
          ...form.endereco,
          cep: form.endereco.cep.replace(/\D/g, ''),
        },
      }

      if (mode === 'create') {
        await hotelService.registerHotel(payload)
      } else {
        await hotelService.updateHotel(payload)
      }

      setSaved(true)
      setMode('edit')
    } catch (err) {
      const { fieldErrors, apiMessage } = await extractApiErrorParsed(err)
      setErrors(fieldErrors)
      setApiError(apiMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Building2 className="h-5 w-5" />
          </div>
          {mode === 'create' ? 'Cadastrar Hotel' : 'Dados do Hotel'}
        </h1>
        <p className="text-muted mt-1">
          {mode === 'create'
            ? 'Registre os dados do seu hotel para começar a operar'
            : 'Visualize e edite os dados do seu hotel'}
        </p>
      </div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3"
        >
          <Check className="h-4 w-4" />
          Dados salvos com sucesso!
        </motion.div>
      )}

      {apiError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {apiError}
        </motion.div>
      )}

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Dados do Hotel</h2>
            <div className="space-y-4">
              <Input
                id="nome"
                label="Nome do Hotel"
                placeholder="Nome fantasia"
                value={form.nome}
                onChange={(e) => setValue('nome', e.target.value)}
                error={errors.nome?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="cnpj"
                  label="CNPJ"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  value={form.cnpj}
                  onChange={(e) => setValue('cnpj', formatCnpj(e.target.value))}
                  error={errors.cnpj?.message}
                />
                <Input
                  id="telefoneContato"
                  label="Telefone de Contato"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  value={form.telefoneContato}
                  onChange={(e) => setValue('telefoneContato', formatPhone(e.target.value))}
                  error={errors.telefoneContato?.message}
                />
              </div>

              <Input
                id="emailContato"
                label="E-mail de Contato"
                type="email"
                placeholder="contato@hotel.com"
                value={form.emailContato}
                onChange={(e) => setValue('emailContato', e.target.value)}
                error={errors.emailContato?.message}
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Endereço</h2>
            <div className="space-y-4">
              <Input
                id="cep"
                label="CEP"
                placeholder="00000-000"
                maxLength={9}
                value={form.endereco.cep}
                onChange={(e) => setValue('endereco.cep', formatCep(e.target.value))}
                error={errors.endereco?.cep?.message}
              />

              <div className="grid grid-cols-[1fr_80px] gap-4">
                <Input
                  id="rua"
                  label="Rua"
                  placeholder="Nome da rua"
                  value={form.endereco.rua}
                  onChange={(e) => setValue('endereco.rua', e.target.value)}
                  error={errors.endereco?.rua?.message}
                />
                <Input
                  id="numero"
                  label="Nº"
                  placeholder="000"
                  value={form.endereco.numero}
                  onChange={(e) => setValue('endereco.numero', e.target.value)}
                  error={errors.endereco?.numero?.message}
                />
              </div>

              <Input
                id="complemento"
                label="Complemento"
                placeholder="Apto, Bloco, etc. (opcional)"
                value={form.endereco.complemento}
                onChange={(e) => setValue('endereco.complemento', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="bairro"
                  label="Bairro"
                  placeholder="Bairro"
                  value={form.endereco.bairro}
                  onChange={(e) => setValue('endereco.bairro', e.target.value)}
                  error={errors.endereco?.bairro?.message}
                />
                <Input
                  id="cidade"
                  label="Cidade"
                  placeholder="Cidade"
                  value={form.endereco.cidade}
                  onChange={(e) => setValue('endereco.cidade', e.target.value)}
                  error={errors.endereco?.cidade?.message}
                />
              </div>

              <Select
                id="estado"
                label="Estado"
                placeholder="Selecione um estado"
                options={estadoOptions}
                value={form.endereco.estado}
                onChange={(e) => setValue('endereco.estado', e.target.value)}
                error={errors.endereco?.estado?.message}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            className="min-w-[180px]"
          >
            {mode === 'create' ? (
              <>
                <Plus className="h-4 w-4" />
                Cadastrar Hotel
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
