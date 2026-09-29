import { useEffect, useState } from 'react'
import { Award, Box, ChevronDown, ChevronLeft, ChevronRight, Headphones, MapPin, MessageCircle, PackageCheck, Phone, Search, Truck, X } from 'lucide-react'

import { API_URL } from '../services/api'
import foamImage from '../assets/catalog/ojalillos.png'
import ojalillosImage from '../assets/catalog/pavonado.png'
import pvcImage from '../assets/catalog/vinil-imantado.png'
import vinilRolloImage from '../assets/catalog/vinil-rollo.png'
import logo from '../assets/landing/logo-nav.png'

const productImages = (product) => product.catalog_image_urls?.length ? product.catalog_image_urls : product.image_url ? [product.image_url] : []

const productCategory = (product) => product.category || product.categoria || product.type || product.tipo || 'Materiales'

const productTags = (product) => {
  const values = [product.unit, product.unidad].filter(Boolean)
  return values.slice(0, 3)
}

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg
      aria-hidden="true"
      className="whatsapp-icon"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M16.02 3.2C8.95 3.2 3.2 8.88 3.2 15.86c0 2.23.6 4.42 1.74 6.34L3.1 28.8l6.82-1.78a12.9 12.9 0 0 0 6.1 1.53c7.07 0 12.82-5.68 12.82-12.66S23.09 3.2 16.02 3.2Zm0 23.2c-1.94 0-3.84-.52-5.5-1.5l-.4-.24-4.04 1.06 1.08-3.86-.26-.4a10.32 10.32 0 0 1-1.58-5.6c0-5.8 4.8-10.52 10.7-10.52s10.7 4.72 10.7 10.52-4.8 10.54-10.7 10.54Zm5.86-7.88c-.32-.16-1.9-.93-2.2-1.04-.3-.1-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.2.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.58a9.5 9.5 0 0 1-1.78-2.18c-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.1-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.12 1.08-1.12 2.64s1.14 3.06 1.3 3.28c.16.22 2.24 3.38 5.42 4.74.76.32 1.34.52 1.8.66.76.24 1.46.2 2 .12.62-.1 1.9-.76 2.16-1.5.26-.74.26-1.38.18-1.5-.08-.14-.3-.22-.62-.38Z"
      />
    </svg>
  )
}

function CatalogPage() {
  const [publicProducts, setPublicProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cardImageIndexes, setCardImageIndexes] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorias')

  useEffect(() => {
    fetch(`${API_URL}/public/landing/`)
      .then((response) => response.json())
      .then((data) => setPublicProducts(data.products || []))
      .catch(() => setPublicProducts([]))
  }, [])

  const selectedImages = selectedProduct?.images || []
  const selectedImage = selectedImages[selectedProduct?.imageIndex || 0]
  const categories = ['Todas las categorias', ...Array.from(new Set(publicProducts.map(productCategory))).filter(Boolean)]
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = publicProducts.filter((product) => {
    const category = productCategory(product)
    const matchesCategory = selectedCategory === 'Todas las categorias' || category === selectedCategory
    const haystack = [product.name, category].filter(Boolean).join(' ').toLowerCase()
    return matchesCategory && (!normalizedSearch || haystack.includes(normalizedSearch))
  })

  const cardImageIndex = (product) => {
    const images = productImages(product)
    if (!images.length) return 0
    return (cardImageIndexes[product.id] || 0) % images.length
  }

  const openProduct = (product) => {
    const description = (product.description || product.descripcion || '').trim()
    setSelectedProduct({
      images: productImages(product),
      title: product.name,
      category: productCategory(product),
      description,
      tags: productTags(product),
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
    <main className="catalog-page">
      <header className="catalog-topbar">
        <a className="catalog-logo" href="/" aria-label="Distribuidor Damian">
          <img src={logo} alt="Distribuidor Damian" />
        </a>
        <nav className="catalog-nav" aria-label="Navegacion del catalogo">
          <a href="/">Inicio</a>
          <a className="active" href="/catalogo">Catalogo</a>
          <a href="/#tienda">Nosotros</a>
          <a href="/#contacto">Contacto</a>
        </nav>
        <div className="catalog-contact">
          <span><MapPin size={24} /> Av. Bolivia Nro. 148 Int. 3268<br />Cercado de Lima</span>
          <a href="https://wa.me/51923327469" target="_blank" rel="noreferrer"><Phone size={22} /> 923327469</a>
        </div>
      </header>

      <section className="catalog-banner">
        <div className="catalog-banner-copy">
          <h1>Materiales para <strong>publicidad</strong></h1>
          <p>Todo lo que necesitas para dar vida a tus ideas</p>
          <div className="catalog-benefits">
            <span><Award size={25} /> Productos<br />de calidad</span>
            <span><Truck size={27} /> Envios a<br />todo Lima</span>
            <span><Box size={28} /> Stock<br />permanente</span>
            <span><Headphones size={29} /> Asesoria<br />especializada</span>
          </div>
        </div>
        <div className="catalog-banner-visual" aria-hidden="true">
          <div className="material-slice"><img src={vinilRolloImage} alt="" /></div>
          <div className="material-slice"><img src={pvcImage} alt="" /></div>
          <div className="material-slice"><img src={ojalillosImage} alt="" /></div>
          <div className="material-slice"><img src={foamImage} alt="" /></div>
        </div>
        <div className="catalog-banner-note">
          <strong>Calidad en cada proyecto</strong>
          <span>Materiales confiables para grandes ideas</span>
        </div>
      </section>

      <section className="catalog-section" id="productos">
        <div className="catalog-section-head">
          <div>
            <h2>Nuestros productos</h2>
            <p>Explora nuestra amplia gama de materiales para publicidad.</p>
          </div>
          <div className="catalog-tools">
            <label className="catalog-search">
              <Search size={22} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto..."
              />
            </label>
            <label className="catalog-select">
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </label>
          </div>
        </div>

        <div className="catalog-grid">
          {filteredProducts.map((product) => {
            const images = productImages(product)
            const currentIndex = cardImageIndex(product)
            const currentImage = images[currentIndex]
            const category = productCategory(product)
            const tags = productTags(product)
            const description = (product.description || product.descripcion || '').trim()

            return (
              <article
                className="catalog-product-card"
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
                <span className="catalog-product-badge">{category}</span>
                {currentImage ? (
                  <div className="catalog-product-frame">
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
                  <div className="catalog-product-empty">Sin imagen</div>
                )}
                <div className="catalog-product-info">
                  <strong>{product.name}</strong>
                  {description && <p>{description}</p>}
                  {tags.length > 0 && (
                    <div className="catalog-product-tags">
                      {tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
                    </div>
                  )}
                  <a
                    className="catalog-quote-button"
                    href={`https://wa.me/51923327469?text=${encodeURIComponent(`Hola, quiero cotizar ${product.name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <WhatsAppIcon size={22} />
                    <span>Consultar por WhatsApp</span>
                  </a>
                </div>
              </article>
            )
          })}
        </div>
        {filteredProducts.length === 0 && (
          <div className="catalog-empty">
            <MessageCircle size={26} />
            <strong>{publicProducts.length === 0 ? 'Catalogo en preparacion' : 'No encontramos productos'}</strong>
            <span>{publicProducts.length === 0 ? 'Escribenos por WhatsApp para consultar productos disponibles.' : 'Prueba con otra busqueda o categoria.'}</span>
          </div>
        )}
        <div className="catalog-service-strip">
          <span><Award size={28} /><strong>Variedad de materiales</strong><small>para todo tipo de proyectos</small></span>
          <span><PackageCheck size={28} /><strong>Soluciones personalizadas</strong><small>para tu negocio</small></span>
          <span><Truck size={28} /><strong>Envios a todo Lima</strong><small>rapidos y seguros</small></span>
          <span><Headphones size={28} /><strong>Atencion especializada</strong><small>en cada compra</small></span>
        </div>
      </section>

      {selectedProduct && (
        <div className="catalog-detail-modal" role="dialog" aria-modal="true" onClick={() => setSelectedProduct(null)}>
          <section className="catalog-detail-viewer" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button catalog-detail-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Cerrar producto">
              <X size={22} />
            </button>
            <div className="catalog-detail-media">
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
            <div className="catalog-detail-info">
              <span>{selectedProduct.category}</span>
              <h2>{selectedProduct.title}</h2>
              {selectedProduct.description && <p>{selectedProduct.description}</p>}
              {selectedProduct.tags.length > 0 && (
                <div className="catalog-product-tags">
                  {selectedProduct.tags.map((tag, index) => <small key={`${tag}-${index}`}>{tag}</small>)}
                </div>
              )}
              <a
                className="catalog-quote-button"
                href={`https://wa.me/51923327469?text=${encodeURIComponent(`Hola, quiero cotizar ${selectedProduct.title}.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon size={22} />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default CatalogPage
