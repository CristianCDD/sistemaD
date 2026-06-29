import { useState } from 'react'
import axios from 'axios'
import { ShieldCheck } from 'lucide-react'

import { API_URL, api, setAuthToken } from '../services/api'

function LoginPanel({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin12345!')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const login = await axios.post(`${API_URL}/auth/login/`, { username, password })
      const access = login.data.access
      setAuthToken(access)
      const me = await api.get('/auth/me/')
      onLogin({ access, refresh: login.data.refresh, user: me.data })
    } catch {
      setError('Usuario o contrasena incorrectos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="login-panel" id="login">
      <div className="login-card">
        <ShieldCheck size={34} />
        <h2>Acceso al sistema</h2>
        <p>Ingresa para administrar productos, stock y reportes.</p>
        <form onSubmit={submit}>
          <label>
            Usuario
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Contrasena
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default LoginPanel
