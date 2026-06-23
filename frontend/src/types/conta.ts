export type StatusConta = 'ABER' | 'PAGA' | 'FECH' | 'CANC'
export type CategoriaDespesa = 'FRIG' | 'SERV' | 'SPA' | 'OUTR'

export const StatusContaLabels: Record<StatusConta, string> = {
  ABER: 'Aberta',
  PAGA: 'Paga',
  FECH: 'Fechada',
  CANC: 'Cancelada',
}

export const CategoriaDespesaLabels: Record<CategoriaDespesa, string> = {
  FRIG: 'Frigobar',
  SERV: 'Serviço de Quarto',
  SPA: 'Spa',
  OUTR: 'Outros',
}

export interface Conta {
  id: number
  reserva: number
  dataAbertura: string
  dataFechamento: string | null
  totalAcumulado: number
  status: StatusConta
  status_display: string
  nomeTitular: string
  cpfTitular: string
}

export interface Despesa {
  id: number
  conta: number
  descricao: string
  valor: number
  categoria: CategoriaDespesa
  categoria_display: string
  produto: number | null
  produto_nome: string | null
  dataHora: string
}

export interface DespesaCreateRequest {
  conta: number
  descricao: string
  valor: number
  categoria: CategoriaDespesa
  produto?: number | null
}

export interface Produto {
  id: number
  nome: string
  descricao: string
  categoria: CategoriaDespesa
  precoAtual: number
  ativo: boolean
}
