import ky from 'ky'

const API_PREFIX = '/api/auth'

export function getAuthToken() {
  return localStorage.getItem('access_token')
}

export function setAuthToken(token: string) {
  localStorage.setItem('access_token', token)
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb
}

export const authApi = ky.create({
  prefix: API_PREFIX,
  headers: { 'Content-Type': 'application/json' },
})

const authenticatedApi = ky.create({
  prefix: API_PREFIX,
  headers: { 'Content-Type': 'application/json' },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getAuthToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status === 401) {
          const storedRefresh = getRefreshToken()
          if (storedRefresh) {
            try {
              const refreshResponse = await authApi.post('token/refresh/', {
                json: { refresh: storedRefresh },
              }).json<{ access: string }>()

              setAuthToken(refreshResponse.access)
              request.headers.set('Authorization', `Bearer ${refreshResponse.access}`)
              return ky(request)
            } catch {
              clearTokens()
              onUnauthorized?.()
            }
          } else {
            clearTokens()
            onUnauthorized?.()
          }
        }
      },
    ],
  },
})

export const hotelApi = ky.create({
  prefix: '/api',
  headers: { 'Content-Type': 'application/json' },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getAuthToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status === 401) {
          const storedRefresh = getRefreshToken()
          if (storedRefresh) {
            try {
              const refreshResponse = await authApi.post('token/refresh/', {
                json: { refresh: storedRefresh },
              }).json<{ access: string }>()

              setAuthToken(refreshResponse.access)
              request.headers.set('Authorization', `Bearer ${refreshResponse.access}`)
              return ky(request)
            } catch {
              clearTokens()
              onUnauthorized?.()
            }
          } else {
            clearTokens()
            onUnauthorized?.()
          }
        }
      },
    ],
  },
})

export default authenticatedApi
