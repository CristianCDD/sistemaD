import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Edit3, ImageOff, Plus, RefreshCcw, Trash2, X } from 'lucide-react'

import Header from '../components/Header'
import SearchBox from '../components/SearchBox'
import { api } from '../services/api'
import CatalogEntryDrawer from './CatalogEntryDrawer'

const materialImages = (product) => product.material_image_urls?.length ? product.material_image_urls : product.image_url ? [product.image_url] : []

function MaterialGuideView({ publicMode = false }) {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(publicMode ? '/public/guia-materiales/' : '/guia-materiales/')
      setProducts(response.data.sort((a, b) => a.name.localeCompare(b.name, 'es')))
    } catch {
      setError('No se pudo cargar la guia. Vuelve a actualizar.')
    } finally {
      setLoading(false)
    }
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

  const openProduct = (product) => {
    setSelectedImageIndex(0)
    setSelectedProduct(product)
  }

  const closeProduct = () => {
    setSelectedProduct(null)
    setSelectedImageIndex(0)
  }

  const selectedImages = selectedProduct ? materialImages(selectedProduct) : []
  const selectedImage = selectedImages[selectedImageIndex]

  const moveSelectedImage = (direction) => {
    if (!selectedImages.length) return
    setSelectedImageIndex((current) => (current + direction + selectedImages.length) % selectedImages.length)
  }

  const deleteGuideProduct = async () => {
    if (!window.confirm(`Eliminar "${selectedProduct.name}" solo de la guia de materiales?`)) return
    setDeleting(true)
    try {
      await api.delete(`/guia-materiales/${selectedProduct.id}/`)
      setProducts(current => current.filter(product => product.id !== selectedProduct.id))
      closeProduct()
    } catch {
      setError('No se pudo eliminar el producto de la guia.')
    } finally {
      setDeleting(false)
    }
  }

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
          {!publicMode && <button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Anadir nuevo producto para la guia</button>}
          <button className="soft-button" onClick={load}><RefreshCcw size={16} /> Actualizar</button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}

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
              <button className="material-card" key={product.id} onClick={() => openProduct(product)} type="button">
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
        <div className="material-modal-backdrop" onClick={closeProduct}>
          <section className={`material-modal${selectedImage ? '' : ' material-modal-no-image'}`} role="dialog" aria-modal="true" aria-label={selectedProduct.name} onClick={(event) => event.stopPropagation()}>
            <button className="icon-button material-modal-close" onClick={closeProduct} type="button" aria-label="Cerrar material">
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
            {selectedProduct.description && <p className="material-modal-description">{selectedProduct.description}</p>}
            <div className="material-modal-image">
              {selectedImage ? (
                <div className="image-carousel">
                  {selectedImages.length > 1 && (
                    <button className="carousel-arrow carousel-prev" type="button" onClick={() => moveSelectedImage(-1)} aria-label="Imagen anterior">
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <img src={selectedImage} alt={`${selectedProduct.name} ${selectedImageIndex + 1}`} />
                  {selectedImages.length > 1 && (
                    <button className="carousel-arrow carousel-next" type="button" onClick={() => moveSelectedImage(1)} aria-label="Imagen siguiente">
                      <ChevronRight size={24} />
                    </button>
                  )}
                  {selectedImages.length > 1 && (
                    <span className="carousel-count">{selectedImageIndex + 1} / {selectedImages.length}</span>
                  )}
                </div>
              ) : (
                <div className="material-image-empty">
                  <ImageOff size={30} />
                  <span>Sin imagen</span>
                </div>
              )}
            </div>
            {!publicMode && <div className="material-modal-actions">
              <button className="soft-button" onClick={() => { setEditing(selectedProduct); closeProduct() }}><Edit3 size={16} /> Editar producto</button>
              <button className="soft-button" disabled={deleting} onClick={deleteGuideProduct}><Trash2 size={16} /> Eliminar de la guia</button>
            </div>}
          </section>
        </div>
      )}
      {!publicMode && (creating || editing) && <CatalogEntryDrawer guideMode entry={editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        onSaved={saved => {
          setProducts(current => [...current.filter(product => product.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, 'es')))
          setCreating(false)
          setEditing(null)
        }} />}
    </>
  )

  if (!publicMode) return content

  return (
    <main className="public-guide-page">
      <a className="soft-button public-guide-back" href="/"><ArrowLeft size={16} /> Volver al catalogo</a>
      {content}
    </main>
  )
}

export default MaterialGuideView
