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
  const values = [product.sku, product.codigo, product.category, product.categoria, product.unit, product.unidad].filter(Boolean)
  return values.length ? values.slice(0, 3) : ['Consultar', 'Stock', 'Mayor']
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
    const haystack = [product.name, product.sku, product.codigo, category].filter(Boolean).join(' ').toLowerCase()
    return matchesCategory && (!normalizedSearch || haystack.includes(normalizedSearch))
  })

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
          <a href="https://wa.me/51991927653" target="_blank" rel="noreferrer"><Phone size={22} /> 991-927-653</a>
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
                placeholder="Buscar producto o codigo..."
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
                  <div className="catalog-product-tags">
                    {tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
                  </div>
                  <a
                    className="catalog-quote-button"
                    href={`https://wa.me/51991927653?text=${encodeURIComponent(`Hola, quiero cotizar ${product.name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Cotizar <ChevronRight size={18} />
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
