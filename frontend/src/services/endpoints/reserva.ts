import { hotelApi } from '@/services/api'
import type { Reserva, ReservaCreateRequest } from '@/types/reserva'
import type { PainelDoDia } from '@/types/dashboard'
import type { Conta } from '@/types/conta'

export async function createReserva(data: ReservaCreateRequest & { valorTotal?: number }) {
  return hotelApi.post('reservas/', { json: data }).json<Reserva>()
}

export async function getReserva(id: number) {
  return hotelApi.get(`reservas/${id}/`).json<Reserva>()
}

export async function listMinhasReservas() {
  return hotelApi.get('reservas/').json<Reserva[]>()
}

export async function cancelReserva(id: number) {
  return hotelApi.patch(`reservas/${id}/cancelar/`).json<Reserva>()
}

export async function checkInOnline(id: number) {
  return hotelApi.patch(`reservas/${id}/check-in/`).json<Reserva>()
}

export async function checkInPresencial(id: number, data?: { observacoes?: string; identidadeVerificada?: boolean }) {
  return hotelApi.patch(`reservas/${id}/checkin-presencial/`, { json: data }).json<Reserva>()
}

export async function checkOut(id: number) {
  return hotelApi.patch(`reservas/${id}/checkout/`).json<Reserva>()
}

export async function getPainelDoDia() {
  return hotelApi.get('reservas/painel-do-dia/').json<PainelDoDia>()
}

export async function getContaDaReserva(reservaId: number) {
  return hotelApi.get(`reservas/${reservaId}/conta/`).json<Conta>()
}
