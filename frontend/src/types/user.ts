export type Role = 'HO' | 'AT' | 'SV' | 'GE'

export interface Endereco {
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface Usuario {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  telefone: string
  cpf: string
  dataNascimento: string
  genero: string
  role: Role
  endereco: Endereco
  date_joined: string
  is_active?: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    role: Role
  }
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  email: string
  username: string
  telefone: string
  dataNascimento: string
  genero: string
  cpf: string
  senha: string
  endereco: Endereco
}

export interface RegisterResponse {
  access: string
  refresh: string
  user: {
    id: number
    email: string
    username: string
    first_name: string
    last_name: string
    role: Role
  }
}

export interface UserListResponse extends Usuario {}

export interface UserCreateRequest {
  first_name: string
  last_name: string
  email: string
  username: string
  telefone: string
  dataNascimento: string
  genero: string
  cpf: string
  role: Role
  endereco: Endereco
  senha: string
}
