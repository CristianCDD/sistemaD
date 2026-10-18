import { useEffect, useState } from 'react'
import { Edit3, Plus, RefreshCcw, Save, Trash2 } from 'lucide-react'

import Header from '../components/Header'
import { api } from '../services/api'
import SearchBox from '../components/SearchBox'
import CatalogEntryDrawer from './CatalogEntryDrawer'

function LandingView() {
  const [config, setConfig] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [configResponse, productsResponse] = await Promise.all([
        api.get('/landing/config/'),
        api.get('/catalogo/'),
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
    } catch {
      setError('No se pudo cargar el catalogo. Vuelve a actualizar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateConfig = (key, value) => setConfig((current) => ({ ...current, [key]: value }))

  const saveConfig = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (config.id) {
        const response = await api.patch(`/landing/config/${config.id}/`, config)
        setConfig(response.data)
      } else {
        const response = await api.post('/landing/config/', config)
        setConfig(response.data)
      }
    } catch {
      setError('No se pudo guardar la informacion publica.')
    } finally {
      setSaving(false)
    }
  }

  const toggleProduct = async (product, key) => {
    setBusyId(product.id)
    try {
      const response = await api.patch(`/catalogo/${product.id}/`, {
        [key]: !product[key],
      })
      setProducts((current) => current.map((item) => item.id === product.id ? response.data : item))
    } catch {
      setError('No se pudo cambiar la visibilidad.')
    } finally {
      setBusyId(null)
    }
  }

  const removeEntry = async product => {
    if (!window.confirm(`Eliminar "${product.name}" del catalogo? El producto y su inventario se conservaran.`)) return
    setBusyId(product.id)
    try {
      await api.delete(`/catalogo/${product.id}/`)
      setProducts(current => current.filter(item => item.id !== product.id))
    } catch {
      setError('No se pudo eliminar la ficha.')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = products.filter(product => [product.name, product.sku, product.category].join(' ').toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <>
      <Header
        title="Catalogo"
        subtitle="Productos publicados"
        actions={<><button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Nuevo producto para el catalogo</button><button className="soft-button" onClick={load}><RefreshCcw size={16} /> Actualizar</button></>}
      />

      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? (
        <div className="table-card">Cargando catalogo...</div>
      ) : config ? (
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
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar catalogo'}
              </button>
            </form>
          </section>

          <section className="table-card">
            <h2>Fichas del catalogo</h2>
            <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre, codigo o categoria" />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Codigo</th>
                    <th>Mostrar</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.sku || '-'}</td>
                      <td>
                        <button disabled={busyId === product.id} className={product.show_on_landing && product.is_active ? 'toggle-chip on' : 'toggle-chip'} onClick={() => toggleProduct(product, 'show_on_landing')}>
                          {product.show_on_landing && product.is_active ? 'Visible' : 'Oculto'}
                        </button>
                      </td>
                      <td><div className="row-actions">
                        <button className="icon-button" title="Editar ficha" onClick={() => setEditing(product)}><Edit3 size={17} /></button>
                        <button className="icon-button danger" title="Eliminar del catalogo" disabled={busyId === product.id} onClick={() => removeEntry(product)}><Trash2 size={17} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan={4}>Sin fichas para mostrar</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
      {(creating || editing) && <CatalogEntryDrawer entry={editing} onClose={() => { setCreating(false); setEditing(null) }} onSaved={saved => {
        setProducts(current => [...current.filter(item => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, 'es')))
        setCreating(false)
        setEditing(null)
      }} />}
    </>
  )
}

export default LandingView
