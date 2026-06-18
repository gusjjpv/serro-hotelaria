export type StatusQuarto = 'DISP' | 'OCUP' | 'LIMP' | 'MANU'

export const StatusQuartoLabels: Record<StatusQuarto, string> = {
  DISP: 'Disponível',
  OCUP: 'Ocupado',
  LIMP: 'Em Limpeza',
  MANU: 'Manutenção',
}

export const StatusQuartoColors: Record<StatusQuarto, string> = {
  DISP: 'bg-green-100 text-green-700',
  OCUP: 'bg-red-100 text-red-700',
  LIMP: 'bg-yellow-100 text-yellow-700',
  MANU: 'bg-gray-100 text-gray-700',
}

export interface CategoriaQuarto {
  id: number
  hotel: number
  nome: string
  descricao: string
  capacidade: number
  precoBase: number
  dataCriacao: string
  dataAtualizacao: string
}

export interface CategoriaQuartoCreateRequest {
  nome: string
  descricao: string
  capacidade: number
  precoBase: number
}

export interface Quarto {
  id: number
  hotel: number
  numero: string
  andar: number
  categoria: number
  categoria_nome?: string
  status: StatusQuarto
  status_display: string
  dataCriacao: string
  dataAtualizacao: string
}

export interface QuartoCreateRequest {
  numero: string
  andar: number
  categoria: number
  status?: StatusQuarto
}
