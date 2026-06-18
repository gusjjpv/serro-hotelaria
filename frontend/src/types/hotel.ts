import type { Endereco } from './user'

export interface Hotel {
  id: number
  nome: string
  cnpj: string
  endereco: Endereco
  telefoneContato: string
  emailContato: string
  dataCriacao: string
  dataAtualizacao: string
}

export interface HotelCreateRequest {
  nome: string
  cnpj: string
  endereco: Endereco
  telefoneContato: string
  emailContato: string
}

export type HotelUpdateRequest = HotelCreateRequest
