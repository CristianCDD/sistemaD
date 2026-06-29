import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Globe2,
  Home,
  Images,
  LogOut,
  Settings,
  Tags,
  UserRound,
} from 'lucide-react'

import BrandMark from './BrandMark'

function DashboardShell({ children, activeView, setActiveView, user, logout }) {
  const nav = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'productos', label: 'Productos', icon: Tags },
    { id: 'movimientos', label: 'Almacen', icon: ClipboardList },
    { id: 'stock', label: 'Reporte de stock', icon: BarChart3 },
    { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    { id: 'guia', label: 'Guia de materiales', icon: Images },
    { id: 'landing', label: 'Landing page', icon: Globe2 },
    { id: 'config', label: 'Configuracion', icon: Settings },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <BrandMark />
        <nav className="nav-list">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={activeView === item.id ? 'nav-item active' : 'nav-item'}
                key={item.id}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-user">
          <UserRound size={18} />
          <div>
            <strong>{user?.username || 'Usuario'}</strong>
            <span>{user?.role || 'admin'}</span>
          </div>
          <button className="icon-button" onClick={logout} title="Cerrar sesion">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <section className="main-panel">{children}</section>
    </div>
  )
}

export default DashboardShell
