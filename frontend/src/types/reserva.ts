export type StatusReserva = 'CONF' | 'CANC' | 'FINA'

export const StatusReservaLabels: Record<StatusReserva, string> = {
  CONF: 'Confirmada',
  CANC: 'Cancelada',
  FINA: 'Finalizada',
}

export const StatusReservaColors: Record<StatusReserva, string> = {
  CONF: 'bg-green-100 text-green-700',
  CANC: 'bg-red-100 text-red-700',
  FINA: 'bg-gray-100 text-gray-700',
}

export interface Reserva {
  id: number
  codigo: string
  hospede: number
  hotel: number
  hotel_nome: string
  categoria: number
  categoria_nome: string
  quarto: number | null
  quarto_numero: string | null
  dataEntrada: string
  dataSaida: string
  numHospedes: number
  valorTotal: number
  status: StatusReserva
  status_display: string
  dataReserva: string
  dataAtualizacao: string
}

export interface ReservaCreateRequest {
  hotel: number
  categoria: number
  dataEntrada: string
  dataSaida: string
  numHospedes: number
  valorTotal: number
}
