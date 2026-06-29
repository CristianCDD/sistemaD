import { useEffect, useState } from 'react'
import axios from 'axios'

import BrandMark from '../components/BrandMark'
import LoginPanel from '../components/LoginPanel'
import LandingPage from './LandingPage'
import { API_URL } from '../services/api'
import { money } from '../utils/format'

function PublicEntry({ onLogin }) {
  const [landing, setLanding] = useState(null)
  const [loading, setLoading] = useState(true)

  const isLandingPath = window.location.pathname === '/landing'

  useEffect(() => {
    if (isLandingPath) {
      setLoading(false)
      return
    }

    axios.get(`${API_URL}/public/landing/`)
      .then((response) => setLanding(response.data))
      .finally(() => setLoading(false))
  }, [isLandingPath])

  if (isLandingPath) return <LandingPage />

  const featured = landing?.products?.slice(0, 4) || []
  const config = landing?.config

  return (
    <main className="public-layout">
      <section className="public-hero">
        <nav className="public-nav">
          <BrandMark />
          <div className="public-nav-links">
            <a href="/landing">Landing publica</a>
            <a href="#login">Ingresar</a>
          </div>
        </nav>
        <div className="public-content">
          <span className="eyebrow">Catalogo y gestion</span>
          <h1>{config?.business_name || 'Distribuidor Damian'}</h1>
          <p>{config?.subheadline || 'Controla productos, stock y servicios desde un solo lugar.'}</p>
          <div className="public-actions">
            <a className="primary-link" href="#login">Entrar al sistema</a>
            <a className="ghost-link" href="/landing">Ver landing</a>
          </div>
        </div>
        <div className="public-products" id="productos">
          {loading ? (
            <p>Cargando productos...</p>
          ) : featured.map((product) => (
            <article className="public-product" key={product.id}>
              <span>{product.codigo || product.sku}</span>
              <strong>{product.name || product.nombre}</strong>
              <small>{product.display_price ? money(product.display_price) : 'Consultar precio'}</small>
            </article>
          ))}
        </div>
      </section>
      <LoginPanel onLogin={onLogin} />
    </main>
  )
}

export default PublicEntry
