import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  )
}

export function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    HO: 'Hóspede',
    AT: 'Atendente',
    SV: 'Supervisor',
    GE: 'Gestor',
  }
  return labels[role] || role
}

export function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    HO: 'bg-blue-100 text-blue-700',
    AT: 'bg-green-100 text-green-700',
    SV: 'bg-purple-100 text-purple-700',
    GE: 'bg-gold-100 text-gold-700',
  }
  return colors[role] || 'bg-gray-100 text-gray-700'
}
