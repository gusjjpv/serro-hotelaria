import { hotelApi } from '@/services/api'
import type { Hotel, HotelCreateRequest, HotelUpdateRequest } from '@/types'

export async function getHotel() {
  return hotelApi.get('hotel/').json<Hotel>()
}

export async function registerHotel(data: HotelCreateRequest) {
  return hotelApi.post('hotel/register/', { json: data }).json<Hotel>()
}

export async function updateHotel(data: HotelUpdateRequest) {
  return hotelApi.put('hotel/', { json: data }).json<Hotel>()
}
