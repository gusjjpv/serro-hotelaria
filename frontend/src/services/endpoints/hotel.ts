import { hotelApi, publicApi } from '@/services/api'
import type { Hotel, HotelCreateRequest, HotelUpdateRequest, HotelPublic, HotelPublicDetail, CategoriaDisponivel, DisponibilidadeParams } from '@/types'

export async function getHotel() {
  return hotelApi.get('hotel/').json<Hotel>()
}

export async function registerHotel(data: HotelCreateRequest) {
  return hotelApi.post('hotel/register/', { json: data }).json<Hotel>()
}

export async function updateHotel(data: HotelUpdateRequest) {
  return hotelApi.put('hotel/', { json: data }).json<Hotel>()
}

export async function listHotelsPublic(params?: { search?: string }) {
  const search = params?.search
  return publicApi.get('hoteis/', { searchParams: search ? { search } : undefined }).json<HotelPublic[]>()
}

export async function getHotelPublic(id: number) {
  return publicApi.get(`hoteis/${id}/`).json<HotelPublicDetail>()
}

export async function getDisponibilidade(hotelId: number, params: DisponibilidadeParams) {
  return publicApi.get(`hoteis/${hotelId}/disponibilidade/`, {
    searchParams: {
      dataEntrada: params.dataEntrada,
      dataSaida: params.dataSaida,
      numHospedes: String(params.numHospedes),
    },
  }).json<CategoriaDisponivel[]>()
}
