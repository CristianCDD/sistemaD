import { useEffect, useState } from 'react'

import DashboardShell from './components/DashboardShell'
import { api, clearStoredSession, refreshKey, setAuthToken, tokenKey } from './services/api'
import CalendarView from './views/CalendarView'
import ConfigView from './views/ConfigView'
import HomeView from './views/HomeView'
import LandingView from './views/LandingView'
import MaterialGuideView from './views/MaterialGuideView'
import MovementsView from './views/MovementsView'
import ProductsView from './views/ProductsView'
import PublicEntry from './views/PublicEntry'
import StockReportView from './views/StockReportView'

function App() {
  const publicPath = window.location.pathname
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(tokenKey))
  const [user, setUser] = useState(null)
  const [activeView, setActiveView] = useState('stock')
  const [booting, setBooting] = useState(Boolean(accessToken))

  useEffect(() => {
    if (!accessToken) {
      setBooting(false)
      return
    }

    setAuthToken(accessToken)
    api.get('/auth/me/')
      .then((response) => setUser(response.data))
      .catch(() => {
        clearStoredSession()
        setAccessToken(null)
      })
      .finally(() => setBooting(false))
  }, [accessToken])

  const handleLogin = ({ access, refresh, user: nextUser }) => {
    localStorage.setItem(tokenKey, access)
    localStorage.setItem(refreshKey, refresh)
    setAuthToken(access)
    setAccessToken(access)
    setUser(nextUser)
  }

  const logout = () => {
    clearStoredSession()
    setAccessToken(null)
    setUser(null)
  }

  if (publicPath === '/guia-materiales') return <MaterialGuideView publicMode />
  if (booting) return <div className="boot-screen">Cargando sistema...</div>
  if (!accessToken) return <PublicEntry onLogin={handleLogin} />

  return (
    <DashboardShell activeView={activeView} setActiveView={setActiveView} user={user} logout={logout}>
      {activeView === 'inicio' && <HomeView setActiveView={setActiveView} />}
      {activeView === 'productos' && <ProductsView />}
      {activeView === 'guia' && <MaterialGuideView />}
      {activeView === 'stock' && <StockReportView />}
      {activeView === 'movimientos' && <MovementsView />}
      {activeView === 'landing' && <LandingView />}
      {activeView === 'calendario' && <CalendarView />}
      {activeView === 'config' && <ConfigView user={user} />}
    </DashboardShell>
  )
}

export default App
