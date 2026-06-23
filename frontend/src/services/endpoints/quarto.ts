import { hotelApi } from '@/services/api'
import type { Quarto, QuartoCreateRequest, StatusQuarto } from '@/types/quarto'

export async function listQuartos() {
  return hotelApi.get('quartos/').json<Quarto[]>()
}

export async function createQuarto(data: QuartoCreateRequest) {
  return hotelApi.post('quartos/', { json: data }).json<Quarto>()
}

export async function updateQuarto(id: number, data: Partial<QuartoCreateRequest>) {
  return hotelApi.patch(`quartos/${id}/`, { json: data }).json<Quarto>()
}

export async function deleteQuarto(id: number) {
  return hotelApi.delete(`quartos/${id}/`).json<void>()
}

export async function updateQuartoStatus(id: number, status: StatusQuarto) {
  return hotelApi.patch(`quartos/${id}/status/`, { json: { status } }).json<Quarto>()
}
