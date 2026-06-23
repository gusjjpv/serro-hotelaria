import { hotelApi } from '@/services/api'
import type { Manutencao, ManutencaoCreateRequest } from '@/types/manutencao'

export async function listManutencoes() {
  return hotelApi.get('manutencoes/').json<Manutencao[]>()
}

export async function createManutencao(data: ManutencaoCreateRequest) {
  return hotelApi.post('manutencoes/', { json: data }).json<Manutencao>()
}

export async function finalizarManutencao(id: number) {
  return hotelApi.patch(`manutencoes/${id}/finalizar/`).json<Manutencao>()
}

export async function cancelarManutencao(id: number) {
  return hotelApi.patch(`manutencoes/${id}/cancelar/`).json<Manutencao>()
}
