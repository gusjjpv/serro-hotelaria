export type TipoTemporada = 'ALTA' | 'BAIXA'

export const TipoTemporadaLabels: Record<TipoTemporada, string> = {
  ALTA: 'Alta Temporada',
  BAIXA: 'Baixa Temporada',
}

export const TipoTemporadaColors: Record<TipoTemporada, string> = {
  ALTA: 'bg-red-100 text-red-700',
  BAIXA: 'bg-blue-100 text-blue-700',
}

export interface Tarifa {
  id: number
  categoria: number
  categoria_nome: string
  valorDiaria: number
  dataInicio: string
  dataFim: string
  tipoTemporada: TipoTemporada
  tipoTemporada_display: string
  dataCriacao: string
  dataAtualizacao: string
}

export interface TarifaCreateRequest {
  categoria: number
  valorDiaria: number
  dataInicio: string
  dataFim: string
  tipoTemporada: TipoTemporada
}
