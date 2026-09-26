import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff, MessageCircle, Search, Sparkles, X } from 'lucide-react'

import { API_URL } from '../services/api'

const productImages = (product) => product.catalog_image_urls?.length ? product.catalog_image_urls : product.image_url ? [product.image_url] : []
const whatsappNumber = '999999999'

function CatalogPage() {
  const [publicProducts, setPublicProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cardImageIndexes, setCardImageIndexes] = useState({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/public/landing/`)
      .then((response) => response.json())
      .then((data) => setPublicProducts(data.products || []))
      .catch(() => setPublicProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProducts = normalizedQuery
    ? publicProducts.filter((product) => {
        const name = product.name?.toLowerCase() || ''
        const code = (product.codigo || product.sku || '').toLowerCase()
        return name.includes(normalizedQuery) || code.includes(normalizedQuery)
      })
    : publicProducts
  const productCount = publicProducts.length
  const imageCount = publicProducts.reduce((total, product) => total + productImages(product).length, 0)
  const selectedImages = selectedProduct?.images || []
  const selectedImage = selectedImages[selectedProduct?.imageIndex || 0]

  const cardImageIndex = (product) => {
    const images = productImages(product)
    if (!images.length) return 0
    return (cardImageIndexes[product.id] || 0) % images.length
  }

  const openProduct = (product) => {
    setSelectedProduct({
      images: productImages(product),
      title: product.name,
      imageIndex: cardImageIndex(product),
    })
  }

  const moveCardImage = (event, product, direction) => {
    event.preventDefault()
    event.stopPropagation()
    const images = productImages(product)
    if (images.length <= 1) return
    setCardImageIndexes((current) => ({
      ...current,
      [product.id]: ((current[product.id] || 0) + direction + images.length) % images.length,
    }))
  }

  const moveSelectedImage = (direction) => {
    setSelectedProduct((current) => {
      if (!current?.images?.length) return current
      const nextIndex = (current.imageIndex + direction + current.images.length) % current.images.length
      return { ...current, imageIndex: nextIndex }
    })
  }

  return (
    <main className="landing-page catalog-page">
      <section className="catalog-hero">
        <div className="catalog-hero-top">
          <a className="soft-button public-guide-back" href="/landing"><ArrowLeft size={16} /> Volver al inicio</a>
          <a className="landing-whatsapp catalog-hero-whatsapp" href={`https://wa.me/51${whatsappNumber}`} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> Consultar por WhatsApp
          </a>
        </div>
        <div className="catalog-hero-grid">
          <div className="catalog-hero-copy">
            <span className="landing-kicker"><Sparkles size={16} /> Catalogo visual</span>
            <h1>Encuentra el material que necesitas</h1>
            <p>Explora los productos por foto, busca por nombre o codigo y abre cada imagen completa antes de consultar disponibilidad.</p>
          </div>
          <div className="catalog-stats" aria-label="Resumen del catalogo">
            <article>
              <strong>{productCount}</strong>
              <span>productos</span>
            </article>
            <article>
              <strong>{imageCount}</strong>
              <span>imagenes</span>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section catalog-section" id="productos">
        <div className="catalog-toolbar">
          <div className="landing-section-head">
            <span>Productos disponibles</span>
            <h2>Catalogo de productos</h2>
            <p>Selecciona una tarjeta para ver sus fotos completas.</p>
          </div>
          <label className="catalog-search">
            <Search size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto o codigo"
            />
          </label>
        </div>

        <div className="catalog-result-line">
          {loading ? 'Cargando catalogo...' : `${filteredProducts.length} de ${productCount} productos`}
        </div>

        <div className="landing-gallery catalog-grid">
          {filteredProducts.map((product) => {
            const images = productImages(product)
            const currentIndex = cardImageIndex(product)
            const currentImage = images[currentIndex]
            const code = product.codigo || product.sku || 'Sin codigo'
            const message = encodeURIComponent(`Hola, quiero consultar por ${product.name}${code !== 'Sin codigo' ? ` (${code})` : ''}.`)

            return (
              <article
                className="landing-product-card catalog-product-card"
                key={product.id}
                role="button"
                tabIndex={0}
                onClick={() => openProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openProduct(product)
                  }
                }}
              >
                {currentImage ? (
                  <div className="landing-product-frame">
                    <img src={currentImage} alt={`${product.name} ${currentIndex + 1}`} />
                    {images.length > 1 && (
                      <>
                        <button className="card-carousel-arrow card-carousel-prev" type="button" onClick={(event) => moveCardImage(event, product, -1)} aria-label="Imagen anterior">
                          <ChevronLeft size={20} />
                        </button>
                        <button className="card-carousel-arrow card-carousel-next" type="button" onClick={(event) => moveCardImage(event, product, 1)} aria-label="Imagen siguiente">
                          <ChevronRight size={20} />
                        </button>
                        <span className="card-carousel-count">{currentIndex + 1} / {images.length}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="landing-product-empty"><ImageOff size={28} /> Sin imagen</div>
                )}
                <div className="landing-product-info">
                  <span className="catalog-code">{code}</span>
                  <strong>{product.name}</strong>
                  <div className="catalog-card-actions">
                    <span>{images.length ? `${images.length} foto${images.length === 1 ? '' : 's'}` : 'Sin fotos'}</span>
                    <a
                      href={`https://wa.me/51${whatsappNumber}?text=${message}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Consultar
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {!loading && filteredProducts.length === 0 && (
          <div className="catalog-empty">
            <MessageCircle size={26} />
            <strong>{publicProducts.length === 0 ? 'Catalogo en preparacion' : 'No encontramos ese producto'}</strong>
            <span>{publicProducts.length === 0 ? 'Escribenos por WhatsApp para consultar productos disponibles.' : 'Prueba con otro nombre o codigo.'}</span>
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="landing-image-modal" role="dialog" aria-modal="true">
          <div className="landing-image-viewer">
            <button className="icon-button landing-image-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Cerrar imagen">
              <X size={22} />
            </button>
            <div className="landing-image-title">
              <span>Producto</span>
              <strong>{selectedProduct.title}</strong>
            </div>
            {selectedImage ? (
              <div className="image-carousel">
                {selectedImages.length > 1 && (
                  <button className="carousel-arrow carousel-prev" type="button" onClick={() => moveSelectedImage(-1)} aria-label="Imagen anterior">
                    <ChevronLeft size={24} />
                  </button>
                )}
                <img src={selectedImage} alt={`${selectedProduct.title} ${(selectedProduct.imageIndex || 0) + 1}`} />
                {selectedImages.length > 1 && (
                  <button className="carousel-arrow carousel-next" type="button" onClick={() => moveSelectedImage(1)} aria-label="Imagen siguiente">
                    <ChevronRight size={24} />
                  </button>
                )}
                {selectedImages.length > 1 && (
                  <span className="carousel-count">{(selectedProduct.imageIndex || 0) + 1} / {selectedImages.length}</span>
                )}
              </div>
            ) : (
              <div className="landing-product-empty large">Sin imagen</div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default CatalogPage
