import { hotelApi } from '@/services/api'
import type { Reserva, ReservaCreateRequest } from '@/types/reserva'

export async function createReserva(data: ReservaCreateRequest) {
  return hotelApi.post('reservas/', { json: data }).json<Reserva>()
}

export async function getReserva(id: number) {
  return hotelApi.get(`reservas/${id}/`).json<Reserva>()
}
