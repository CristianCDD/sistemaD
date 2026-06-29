import { useEffect, useState } from 'react'
import { RefreshCcw, Save } from 'lucide-react'

import Header from '../components/Header'
import { api } from '../services/api'

function LandingView() {
  const [config, setConfig] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const [configResponse, productsResponse] = await Promise.all([
      api.get('/landing/config/'),
      api.get('/productos/'),
    ])
    setConfig(configResponse.data[0] || {
      business_name: 'Distribuidor Damian',
      headline: '',
      subheadline: '',
      whatsapp: '',
      email: '',
      address: '',
      is_active: true,
    })
    setProducts(productsResponse.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const updateConfig = (key, value) => setConfig((current) => ({ ...current, [key]: value }))

  const saveConfig = async (event) => {
    event.preventDefault()
    setSaving(true)
    if (config.id) {
      const response = await api.patch(`/landing/config/${config.id}/`, config)
      setConfig(response.data)
    } else {
      const response = await api.post('/landing/config/', config)
      setConfig(response.data)
    }
    setSaving(false)
  }

  const toggleProduct = async (product, key) => {
    const response = await api.patch(`/productos/${product.id}/`, {
      [key]: !product[key],
    })
    setProducts((current) => current.map((item) => item.id === product.id ? response.data : item))
  }

  return (
    <>
      <Header
        title="Landing page"
        subtitle="Edita la informacion publica y que productos se muestran al visitante."
        actions={<button className="soft-button" onClick={load}><RefreshCcw size={16} /> Actualizar</button>}
      />

      {loading || !config ? (
        <div className="table-card">Cargando landing...</div>
      ) : (
        <>
          <section className="table-card">
            <h2>Informacion publica</h2>
            <form className="landing-form" onSubmit={saveConfig}>
              <label>
                Nombre comercial
                <input value={config.business_name || ''} onChange={(event) => updateConfig('business_name', event.target.value)} />
              </label>
              <label>
                Titulo principal
                <input value={config.headline || ''} onChange={(event) => updateConfig('headline', event.target.value)} />
              </label>
              <label className="landing-wide">
                Descripcion
                <textarea value={config.subheadline || ''} onChange={(event) => updateConfig('subheadline', event.target.value)} />
              </label>
              <label>
                WhatsApp
                <input value={config.whatsapp || ''} onChange={(event) => updateConfig('whatsapp', event.target.value)} />
              </label>
              <label>
                Email
                <input value={config.email || ''} onChange={(event) => updateConfig('email', event.target.value)} />
              </label>
              <label className="landing-wide">
                Direccion
                <input value={config.address || ''} onChange={(event) => updateConfig('address', event.target.value)} />
              </label>
              <button className="primary-button landing-save" disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar landing'}
              </button>
            </form>
          </section>

          <section className="table-card">
            <h2>Productos visibles en landing</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Codigo</th>
                    <th>Mostrar</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.sku || '-'}</td>
                      <td>
                        <button className={product.show_on_landing ? 'toggle-chip on' : 'toggle-chip'} onClick={() => toggleProduct(product, 'show_on_landing')}>
                          {product.show_on_landing ? 'Visible' : 'Oculto'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}

export default LandingView
