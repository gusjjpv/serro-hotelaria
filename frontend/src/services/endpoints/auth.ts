import authenticatedApi, { authApi, setTokens, clearTokens } from '@/services/api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Usuario,
  UserListResponse,
  UserCreateRequest,
} from '@/types'

export async function login(data: LoginRequest) {
  const res = await authApi.post('login/', { json: data }).json<LoginResponse>()
  setTokens(res.access, res.refresh)
  return res
}

export async function register(data: RegisterRequest) {
  const res = await authApi.post('register/', { json: data }).json<RegisterResponse>()
  setTokens(res.access, res.refresh)
  return res
}

export async function registerGestor(data: RegisterRequest) {
  const res = await authApi.post('register/gestor/', { json: data }).json<RegisterResponse>()
  setTokens(res.access, res.refresh)
  return res
}

export async function refreshToken(refresh: string) {
  const res = await authApi.post('token/refresh/', { json: { refresh } }).json<{ access: string }>()
  return res
}

export async function getMe() {
  return authenticatedApi.get('me/').json<Usuario>()
}

export async function listUsers() {
  return authenticatedApi.get('users/').json<UserListResponse[]>()
}

export async function createUser(data: UserCreateRequest) {
  return authenticatedApi.post('users/', { json: data }).json<UserListResponse>()
}

export async function getUser(id: number) {
  return authenticatedApi.get(`users/${id}/`).json<Usuario>()
}

export async function updateUser(id: number, data: Partial<UserCreateRequest>) {
  return authenticatedApi.put(`users/${id}/`, { json: data }).json<Usuario>()
}

export async function deleteUser(id: number) {
  return authenticatedApi.delete(`users/${id}/`).json<void>()
}

export async function logout() {
  clearTokens()
}
