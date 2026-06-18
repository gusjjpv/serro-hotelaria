import { hotelApi } from '@/services/api'
import type { Tarifa, TarifaCreateRequest } from '@/types/tarifa'

export async function listTarifas() {
  return hotelApi.get('tarifas/').json<Tarifa[]>()
}

export async function createTarifa(data: TarifaCreateRequest) {
  return hotelApi.post('tarifas/', { json: data }).json<Tarifa>()
}

export async function updateTarifa(id: number, data: TarifaCreateRequest) {
  return hotelApi.put(`tarifas/${id}/`, { json: data }).json<Tarifa>()
}

export async function deleteTarifa(id: number) {
  return hotelApi.delete(`tarifas/${id}/`).json<void>()
}
