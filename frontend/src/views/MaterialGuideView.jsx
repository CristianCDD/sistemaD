import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ImageOff, RefreshCcw, X } from 'lucide-react'

import Header from '../components/Header'
import SearchBox from '../components/SearchBox'
import { api } from '../services/api'

function MaterialGuideView({ publicMode = false }) {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const load = async () => {
    setLoading(true)
    const response = await api.get(publicMode ? '/public/guia-materiales/' : '/productos/')
    setProducts(response.data.sort((a, b) => a.name.localeCompare(b.name, 'es')))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return products
    return products.filter((product) => (
      product.name.toLowerCase().includes(value)
      || (product.sku || '').toLowerCase().includes(value)
    ))
  }, [products, query])

  const content = (
    <>
      <Header
        title="Guia de materiales"
        subtitle={publicMode ? 'Consulta productos por nombre, codigo e imagen sin ingresar al sistema.' : 'Consulta rapida para identificar productos por nombre, codigo e imagen.'}
        actions={<SearchBox value={query} onChange={setQuery} placeholder="Buscar material o codigo" />}
      />

      <section className="table-card">
        <div className="table-toolbar">
          <strong>{filtered.length} materiales</strong>
          <button className="soft-button" onClick={load}><RefreshCcw size={16} /> Actualizar</button>
        </div>

        {loading ? (
          <div className="empty-state">Cargando guia de materiales...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <strong>Sin materiales encontrados</strong>
            <span>Prueba buscando por otro nombre o codigo.</span>
          </div>
        ) : (
          <div className="material-guide-grid">
            {filtered.map((product) => (
              <button className="material-card" key={product.id} onClick={() => setSelectedProduct(product)} type="button">
                <div className="material-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="material-image-empty">
                      <ImageOff size={24} />
                      <span>Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="material-info">
                  <strong>{product.name}</strong>
                  <span>{product.sku || 'Sin codigo'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      {selectedProduct && (
        <div className="material-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section className="material-modal" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button material-modal-close" onClick={() => setSelectedProduct(null)} type="button">
              <X size={18} />
            </button>
            <div className="material-modal-info">
              <div>
                <span>Nombre</span>
                <h2>{selectedProduct.name}</h2>
              </div>
              <div>
                <span>Codigo</span>
                <strong>{selectedProduct.sku || 'Sin codigo'}</strong>
              </div>
            </div>
            <div className="material-modal-image">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} />
              ) : (
                <div className="material-image-empty">
                  <ImageOff size={30} />
                  <span>Sin imagen</span>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )

  if (!publicMode) return content

  return (
    <main className="public-guide-page">
      <a className="soft-button public-guide-back" href="/landing"><ArrowLeft size={16} /> Volver a la landing</a>
      {content}
    </main>
  )
}

export default MaterialGuideView
