import { BarChart3, ClipboardList, Package } from 'lucide-react'

import Header from '../components/Header'

function HomeView({ setActiveView }) {
  return (
    <>
      <Header title="Inicio" subtitle="Resumen rapido del sistema administrativo." />
      <div className="quick-grid">
        <button onClick={() => setActiveView('productos')}><Package /> Editar productos</button>
        <button onClick={() => setActiveView('stock')}><BarChart3 /> Ver reporte de stock</button>
        <button onClick={() => setActiveView('movimientos')}><ClipboardList /> Registrar almacen</button>
      </div>
    </>
  )
}

export default HomeView
