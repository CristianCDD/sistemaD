import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, BookOpen, Building2, MapPin, MessageCircle, PackageCheck, ShoppingBag, Store, Truck } from 'lucide-react'

import { API_URL } from '../services/api'
import foamImage from '../assets/catalog/ojalillos.png'
import ojalillosImage from '../assets/catalog/pavonado.png'
import pvcImage from '../assets/catalog/vinil-imantado.png'
import vinilRolloImage from '../assets/catalog/vinil-rollo.png'
import logo from '../assets/landing/logo-nav.png'

const storeImageUrl = 'https://res.cloudinary.com/dmbvogx69/image/upload/v1782657157/tienda_a03kjv.png'

const whatsappNumbers = ['923327469']

const productImages = (product) => product.catalog_image_urls?.length ? product.catalog_image_urls : product.image_url ? [product.image_url] : []

const productCover = (product) => productImages(product)[0] || ''

function WhatsAppIcon({ size = 18 }) {
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

function LandingPage() {
  const [publicProducts, setPublicProducts] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/public/landing/`)
      .then((response) => response.json())
      .then((data) => setPublicProducts(data.products || []))
      .catch(() => setPublicProducts([]))
  }, [])

  const showcaseProducts = publicProducts.filter((product) => productCover(product)).slice(0, 4)
  const showcaseItems = showcaseProducts.length > 0
    ? showcaseProducts.map((product) => ({ src: productCover(product), alt: product.name, id: product.id }))
    : [
      { src: vinilRolloImage, alt: 'Vinil para publicidad', id: 'vinil' },
      { src: pvcImage, alt: 'PVC para publicidad', id: 'pvc' },
      { src: ojalillosImage, alt: 'Accesorios para publicidad', id: 'ojalillos' },
      { src: foamImage, alt: 'Foam para publicidad', id: 'foam' },
    ]

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav">
          <a className="landing-brand" href="/" aria-label="Distribuidor Damian">
            <img src={logo} alt="Distribuidor Damian" />
          </a>
          <div className="landing-nav-links">
            <a href="#tienda">Tienda</a>
            <a href="/catalogo">Catalogo</a>
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
              <a className="landing-whatsapp" href="https://wa.me/51923327469" target="_blank" rel="noreferrer">
                <WhatsAppIcon size={20} /> 923327469
              </a>
              <a className="landing-primary" href="https://maps.app.goo.gl/F762ew5y7AZkvdco7" target="_blank" rel="noreferrer">
                <MapPin size={18} /> Como llegar
              </a>
              <a className="landing-secondary" href="/catalogo">
                Ver catalogo <ArrowRight size={18} />
              </a>
            </div>
          </div>

          <div className="landing-showcase" aria-label="Productos destacados">
            <div className="showcase-panel-label">
              <span>Catalogo visual</span>
              <strong>Materiales listos para publicidad</strong>
            </div>
            {showcaseItems.map((product, index) => (
              <img
                className={`showcase-image showcase-${index + 1}`}
                src={product.src}
                alt={product.alt}
                key={product.id}
              />
            ))}
            <div className="showcase-scroll-note">Stock y consultas por WhatsApp</div>
          </div>
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

      <section className="landing-catalog-callout" id="productos">
        <div className="catalog-callout-copy">
          <span className="landing-kicker">Catalogo separado</span>
          <h2>Mira los productos con sus fotos en un espacio aparte</h2>
          <p>
            Dejamos el inicio limpio para presentar la tienda. El catalogo completo ahora vive en su propio link, ideal para compartirlo con clientes por WhatsApp.
          </p>
          <a className="landing-primary dark" href="/catalogo">
            <BookOpen size={18} /> Abrir catalogo
          </a>
        </div>
        {showcaseProducts.length > 0 && (
          <div className="catalog-callout-preview" aria-label="Vista previa del catalogo">
            {showcaseProducts.slice(0, 3).map((product) => (
              <img src={productCover(product)} alt={product.name} key={product.id} />
            ))}
          </div>
        )}
      </section>

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
              <WhatsAppIcon size={20} /> {number}
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}

export default LandingPage
