export type MotivoManutencao = 'PREV' | 'CORR' | 'LIMP'
export type StatusManutencao = 'AGEN' | 'EMAN' | 'CONC' | 'CANC'

export const MotivoManutencaoLabels: Record<MotivoManutencao, string> = {
  PREV: 'Preventiva',
  CORR: 'Corretiva',
  LIMP: 'Limpeza',
}

export const StatusManutencaoLabels: Record<StatusManutencao, string> = {
  AGEN: 'Agendada',
  EMAN: 'Em Andamento',
  CONC: 'Concluída',
  CANC: 'Cancelada',
}

export interface Manutencao {
  id: number
  quarto: number
  quarto_numero: string
  hotel: number
  hotel_nome: string
  dataInicio: string
  dataFim: string
  motivo: MotivoManutencao
  motivo_display: string
  descricao: string
  status: StatusManutencao
  status_display: string
  statusAnterior: string
  dataCriacao: string
  dataAtualizacao: string
}

export interface ManutencaoCreateRequest {
  quarto: number
  hotel: number
  dataInicio: string
  dataFim: string
  motivo: MotivoManutencao
  descricao?: string
}
