export interface DashboardMetricas {
  quartosOcupados: number
  quartosTotal: number
  quartosDisponiveis: number
  quartosEmLimpeza: number
  quartosManutencao: number
  checkinsPendentes: number
  checkoutsPendentes: number
  faturamentoDoDia: string
}

export interface ReservaAtiva {
  id: number
  codigo: string
  hospedeNome: string
  quartoNumero: string | null
  categoria: string
  dataEntrada: string
  dataSaida: string
  status: string
  statusDisplay: string
}

export interface DashboardData {
  metricas: DashboardMetricas
  reservasAtivas: ReservaAtiva[]
}

export interface PainelDoDiaItem {
  id: number
  codigo: string
  hospede_nome: string
  quarto_numero: string | null
  categoria: string
  dataEntrada?: string
  dataSaida?: string
  status: string
}

export interface PainelDoDia {
  checkins_previstos: PainelDoDiaItem[]
  checkouts_previstos: PainelDoDiaItem[]
}

export interface RelatorioFaturamentoResumo {
  totalReservas: number
  totalDiarias: number
  receitaTotal: string
}

export interface RelatorioReservaItem {
  id: number
  codigo: string
  hospedeNome: string
  quartoNumero: string | null
  categoria: string
  dataEntrada: string
  dataSaida: string
  numDias: number
  valorTotal: string
}

export interface RelatorioFaturamento {
  filtro: {
    dataInicio: string
    dataFim: string
  }
  resumo: RelatorioFaturamentoResumo
  reservas: RelatorioReservaItem[]
}
