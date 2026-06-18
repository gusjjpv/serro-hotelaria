import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/features/shared/Card'
import { getInitials, getRoleColor, getRoleLabel, formatDate, formatCpf, formatPhone } from '@/lib/utils'
import { User, Mail, Phone, Calendar, MapPin, Shield, Fingerprint } from 'lucide-react'

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-muted shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      {/* Profile Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-6">
          <div className={`
            flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold shadow-xl
            ${getRoleColor(user.role)}
          `}>
            {getInitials(`${user.first_name} ${user.last_name}`)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`
                inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold
                ${getRoleColor(user.role)}
              `}>
                <Shield className="h-3 w-3" />
                {getRoleLabel(user.role)}
              </span>
              <span className="text-sm text-muted">
                Membro desde {formatDate(user.date_joined)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-primary-600" />
          Dados Pessoais
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <InfoRow icon={User} label="Username" value={`@${user.username}`} />
          <InfoRow icon={Mail} label="E-mail" value={user.email} />
          <InfoRow icon={Phone} label="Telefone" value={formatPhone(user.telefone)} />
          <InfoRow icon={Calendar} label="Data de Nascimento" value={formatDate(user.dataNascimento)} />
          <InfoRow icon={Fingerprint} label="CPF" value={formatCpf(user.cpf)} />
          <InfoRow icon={Shield} label="Gênero" value={user.genero} />
        </div>
      </Card>

      {/* Address */}
      {user.endereco && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Endereço
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <InfoRow icon={MapPin} label="Rua" value={`${user.endereco.rua}, ${user.endereco.numero}`} />
            <InfoRow icon={MapPin} label="Complemento" value={user.endereco.complemento || '-'} />
            <InfoRow icon={MapPin} label="Bairro" value={user.endereco.bairro} />
            <InfoRow icon={MapPin} label="Cidade" value={user.endereco.cidade} />
            <InfoRow icon={MapPin} label="Estado" value={user.endereco.estado} />
            <InfoRow icon={MapPin} label="CEP" value={user.endereco.cep} />
          </div>
        </Card>
      )}
    </motion.div>
  )
}
