import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const tokenKey = 'distribuidor_damian_access'
export const refreshKey = 'distribuidor_damian_refresh'

export const api = axios.create({ baseURL: API_URL })

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
