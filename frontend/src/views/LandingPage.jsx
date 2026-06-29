import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Building2, MapPin, MessageCircle, PackageCheck, ShoppingBag, Store, Truck, X } from 'lucide-react'

import { API_URL } from '../services/api'

const logoUrl = 'https://res.cloudinary.com/dmbvogx69/image/upload/v1782541769/logo_fyguf1.png'
const storeImageUrl = 'https://res.cloudinary.com/dmbvogx69/image/upload/v1782657157/tienda_a03kjv.png'

const whatsappNumbers = ['999999999', '987654321']

function LandingPage() {
  const [publicProducts, setPublicProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/public/landing/`)
      .then((response) => response.json())
      .then((data) => setPublicProducts(data.products || []))
      .catch(() => setPublicProducts([]))
  }, [])

  const showcaseProducts = publicProducts.filter((product) => product.image_url).slice(0, 4)

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav">
          <a className="landing-brand" href="/landing" aria-label="Distribuidor Damian">
            <img src={logoUrl} alt="Distribuidor Damian" />
          </a>
          <div className="landing-nav-links">
            <a href="#tienda">Tienda</a>
            {publicProducts.length > 0 && <a href="#productos">Productos</a>}
            <a href="/guia-materiales">Guia de materiales</a>
            <a href="#ubicacion">Ubicacion</a>
            <a href="#contacto">WhatsApp</a>
          </div>
        </nav>

        <div className="landing-hero-content" id="inicio">
          <div className="landing-copy">
            <span className="landing-kicker">Venta al por menor y mayor</span>
            <h1>Distribuidor Damian</h1>
            <p>
              Insumos de publicidad para negocios, talleres y emprendedores que necesitan materiales listos para trabajar.
            </p>
            <div className="landing-actions">
              <a className="landing-whatsapp" href="https://wa.me/51999999999" target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> 999999999
              </a>
              <a className="landing-primary" href="https://maps.app.goo.gl/F762ew5y7AZkvdco7" target="_blank" rel="noreferrer">
                <MapPin size={18} /> Como llegar
              </a>
              {publicProducts.length > 0 && (
                <a className="landing-secondary" href="#productos">
                  Ver productos <ArrowRight size={18} />
                </a>
              )}
              <a className="landing-secondary" href="/guia-materiales">
                Guia de materiales
              </a>
            </div>
          </div>

          {showcaseProducts.length > 0 && (
            <div className="landing-showcase" aria-label="Productos destacados">
              {showcaseProducts.map((product, index) => (
              <img
                className={`showcase-image showcase-${index + 1}`}
                src={product.image_url}
                alt={product.name}
                key={product.id}
              />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="landing-strip" aria-label="Servicios principales">
        <article>
          <ShoppingBag size={24} />
          <strong>Venta directa</strong>
          <span>Compra por unidad, rollo, paquete o caja segun tu necesidad.</span>
        </article>
        <article>
          <PackageCheck size={24} />
          <strong>Variedad de insumos</strong>
          <span>Materiales para publicidad, impresion, acabados e instalacion.</span>
        </article>
        <article>
          <Truck size={24} />
          <strong>Atencion mayorista</strong>
          <span>Opciones para negocios que requieren reposicion frecuente.</span>
        </article>
      </section>

      <section className="landing-store-section" id="tienda">
        <div className="store-image-panel reveal-left">
          <img src={storeImageUrl} alt="Fachada de Distribuidor Damian en Centro Lima" />
        </div>
        <div className="store-copy-panel reveal-right">
          <span className="landing-kicker store-kicker">Tienda fisica en Centro Lima</span>
          <h2>
            15 años abasteciendo materiales para publicidad
          </h2>
          <p>
            Nos encuentras en Av. Bolivia 148, en el segundo piso, tienda 3268. Atendemos compras al por menor y por mayor para talleres, negocios y emprendedores.
          </p>
          <div className="store-highlight-grid">
            <article>
              <BadgeCheck size={22} />
              <strong>15 años</strong>
              <span>de experiencia</span>
            </article>
            <article>
              <Building2 size={22} />
              <strong>2do piso</strong>
              <span>facil de ubicar</span>
            </article>
            <article>
              <Store size={22} />
              <strong>Tienda 3268</strong>
              <span>Centro Lima</span>
            </article>
          </div>
        </div>
      </section>

      {publicProducts.length > 0 && (
        <section className="landing-section" id="productos">
          <div className="landing-section-head">
            <span>Catalogo visual</span>
            <h2>Materiales para tus trabajos publicitarios</h2>
            <p>Una muestra de los productos disponibles en tienda. Consulta disponibilidad para compras al menor o mayor.</p>
          </div>
          <div className="landing-gallery">
            {publicProducts.map((product) => (
              <button
                className="landing-product-card"
                key={product.id}
                type="button"
                onClick={() => setSelectedProduct({
                  image: product.image_url,
                  title: product.name,
                })}
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <div className="landing-product-empty">Sin imagen</div>
                )}
                <div>
                  <strong>{product.name}</strong>
                  <span>Consultar por WhatsApp</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="landing-location" id="ubicacion">
        <div className="location-copy">
          <span>Visitanos</span>
          <h2>Av. Bolivia 148, Lima 15001</h2>
          <p>Estamos ubicados en Lima para atender compras de insumos publicitarios al por menor y por mayor.</p>
          <a className="landing-primary dark" href="https://maps.app.goo.gl/F762ew5y7AZkvdco7" target="_blank" rel="noreferrer">
            <MapPin size={18} /> Abrir en Google Maps
          </a>
        </div>
        <div className="map-frame">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.8397735422127!2d-77.04019562561037!3d-12.054543042044271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c90017823e07%3A0x329b03845fe87cc!2sDistribuidor%20Damian%20E.I.R.L.!5e0!3m2!1ses!2spe!4v1782541882939!5m2!1ses!2spe"
            title="Mapa de Distribuidor Damian"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>

      <section className="landing-contact" id="contacto">
        <MessageCircle size={30} />
        <div>
          <strong>Consulta por WhatsApp</strong>
          <span>Escribenos para consultar disponibilidad, precios por mayor o compras al detalle.</span>
        </div>
        <div className="landing-contact-actions">
          {whatsappNumbers.map((number) => (
            <a className="landing-whatsapp" href={`https://wa.me/51${number}`} target="_blank" rel="noreferrer" key={number}>
              <MessageCircle size={18} /> {number}
            </a>
          ))}
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
            {selectedProduct.image ? (
              <img src={selectedProduct.image} alt={selectedProduct.title} />
            ) : (
              <div className="landing-product-empty large">Sin imagen</div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default LandingPage
