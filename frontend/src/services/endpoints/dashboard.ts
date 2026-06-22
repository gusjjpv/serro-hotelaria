import { hotelApi } from '@/services/api'
import type { DashboardData, RelatorioFaturamento } from '@/types/dashboard'

export async function getDashboard() {
  return hotelApi.get('dashboard/').json<DashboardData>()
}

export async function getRelatorioFaturamento(dataInicio: string, dataFim: string) {
  return hotelApi.get('relatorios/faturamento/', {
    searchParams: { data_inicio: dataInicio, data_fim: dataFim },
  }).json<RelatorioFaturamento>()
}
