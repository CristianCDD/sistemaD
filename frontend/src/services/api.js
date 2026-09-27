import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const tokenKey = 'distribuidor_damian_access'
export const refreshKey = 'distribuidor_damian_refresh'

export const api = axios.create({ baseURL: API_URL })

let refreshRequest = null

export function setAuthToken(accessToken) {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

export function clearStoredSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(refreshKey)
  setAuthToken(null)
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(refreshKey)
  if (!refresh) throw new Error('No hay refresh token')

  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_URL}/auth/refresh/`, { refresh })
      .then((response) => {
        const access = response.data.access
        localStorage.setItem(tokenKey, access)
        setAuthToken(access)
        return access
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

api.interceptors.request.use((config) => {
  const access = localStorage.getItem(tokenKey)
  if (access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const isAuthRequest = originalRequest?.url?.includes('/auth/login/') || originalRequest?.url?.includes('/auth/refresh/')

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true
      try {
        const access = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch {
        clearStoredSession()
        window.location.assign('/panel')
      }
    }

    return Promise.reject(error)
  },
)
