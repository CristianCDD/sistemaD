import { UserRound } from 'lucide-react'

import Header from '../components/Header'
import { API_URL } from '../services/api'

function ConfigView({ user }) {
  return (
    <>
      <Header title="Configuracion" subtitle="Informacion de sesion y preferencias iniciales." />
      <div className="table-card config-card">
        <UserRound />
        <div>
          <h2>{user?.username}</h2>
          <p>Rol: {user?.role || 'admin'}</p>
          <p>El backend esta conectado a {API_URL}</p>
        </div>
      </div>
    </>
  )
}

export default ConfigView
