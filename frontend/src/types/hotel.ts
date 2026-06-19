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

export interface HotelPublic {
  id: number
  nome: string
  cidade: string
  telefoneContato: string
  emailContato: string
}

export interface CategoriaPublic {
  id: number
  nome: string
  descricao: string
  capacidade: number
  precoBase: number
  quartosDisponiveis: number
}

export interface HotelPublicDetail {
  id: number
  nome: string
  cidade: string
  enderecoCompleto: string
  telefoneContato: string
  emailContato: string
  categorias: CategoriaPublic[]
  totalQuartos: number
}

export interface CategoriaDisponivel {
  id: number
  nome: string
  descricao: string
  capacidade: number
  precoBase: number
  valorTotal: number
  quartosDisponiveis: number
  dias: number
}

export interface DisponibilidadeParams {
  dataEntrada: string
  dataSaida: string
  numHospedes: number
}
