import { create } from 'zustand'
import type { Usuario, Role } from '@/types'
import { getAuthToken, getRefreshToken, setOnUnauthorized } from '@/services/api'
import * as authService from '@/services/endpoints/auth'

interface AuthState {
  user: Usuario | null
  isLoading: boolean
  isAuthenticated: boolean
  role: Role | null
  login: (username: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  setUser: (user: Usuario) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  role: null,

  login: async (username, password) => {
    await authService.login({ username, password })
    const user = await authService.getMe()
    set({ user, isAuthenticated: true, role: user.role as Role, isLoading: false })
  },

  register: async (data) => {
    await authService.register(data)
    const user = await authService.getMe()
    set({ user, isAuthenticated: true, role: user.role as Role, isLoading: false })
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, isAuthenticated: false, role: null, isLoading: false })
  },

  loadUser: async () => {
    const token = getAuthToken()
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, role: user.role as Role, isLoading: false })
      return
    } catch {
      // token might be expired, try refresh
    }

    const refresh = getRefreshToken()
    if (!refresh) {
      await authService.logout()
      set({ isLoading: false })
      return
    }

    try {
      const { access } = await authService.refreshToken(refresh)
      localStorage.setItem('access_token', access)
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, role: user.role as Role, isLoading: false })
    } catch {
      await authService.logout()
      set({ isLoading: false })
    }
  },

  setUser: (user) => set({ user }),
}))

// Configura callback global para redirecionar ao expirar sessão
setOnUnauthorized(() => {
  useAuth.getState().logout()
  window.location.href = '/login'
})
