import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, X } from 'lucide-react'

import { API_URL } from '../services/api'

const productImages = (product) => product.catalog_image_urls?.length ? product.catalog_image_urls : product.image_url ? [product.image_url] : []

function CatalogPage() {
  const [publicProducts, setPublicProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cardImageIndexes, setCardImageIndexes] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/public/landing/`)
      .then((response) => response.json())
      .then((data) => setPublicProducts(data.products || []))
      .catch(() => setPublicProducts([]))
  }, [])

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
        <a className="soft-button public-guide-back" href="/landing"><ArrowLeft size={16} /> Volver al inicio</a>
        <span className="landing-kicker">Catalogo visual</span>
        <h1>Materiales para tus trabajos publicitarios</h1>
        <p>Revisa las imagenes del catalogo y escribenos por WhatsApp para consultar disponibilidad al por menor o mayor.</p>
      </section>

      <section className="landing-section catalog-section" id="productos">
        <div className="landing-section-head">
          <span>Productos disponibles</span>
          <h2>Catalogo de productos</h2>
          <p>Selecciona una tarjeta para ver sus fotos completas.</p>
        </div>
        <div className="landing-gallery">
          {publicProducts.map((product) => {
            const images = productImages(product)
            const currentIndex = cardImageIndex(product)
            const currentImage = images[currentIndex]

            return (
              <article
                className="landing-product-card"
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
                  <div className="landing-product-empty">Sin imagen</div>
                )}
                <div className="landing-product-info">
                  <strong>{product.name}</strong>
                  <span>Consultar por WhatsApp</span>
                </div>
              </article>
            )
          })}
        </div>
        {publicProducts.length === 0 && (
          <div className="catalog-empty">
            <MessageCircle size={26} />
            <strong>Catalogo en preparacion</strong>
            <span>Escribenos por WhatsApp para consultar productos disponibles.</span>
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
