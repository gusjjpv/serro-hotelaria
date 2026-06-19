import { hotelApi } from '@/services/api'
import type { CategoriaQuarto, CategoriaQuartoCreateRequest } from '@/types/quarto'

export async function listCategorias() {
  return hotelApi.get('categorias/').json<CategoriaQuarto[]>()
}

export async function createCategoria(data: CategoriaQuartoCreateRequest) {
  return hotelApi.post('categorias/', { json: data }).json<CategoriaQuarto>()
}

export async function updateCategoria(id: number, data: Partial<CategoriaQuartoCreateRequest>) {
  return hotelApi.patch(`categorias/${id}/`, { json: data }).json<CategoriaQuarto>()
}

export async function deleteCategoria(id: number) {
  return hotelApi.delete(`categorias/${id}/`).json<void>()
}
