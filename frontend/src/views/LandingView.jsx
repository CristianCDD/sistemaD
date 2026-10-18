import { useEffect, useRef, useState } from 'react'
import { Edit3, Plus, Trash2 } from 'lucide-react'

import Header from '../components/Header'
import { api } from '../services/api'
import SearchBox from '../components/SearchBox'
import CatalogEntryDrawer from './CatalogEntryDrawer'

function LandingView() {
  const [config, setConfig] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const configRef = useRef(null)
  const pendingConfig = useRef({})
  const saveInFlight = useRef(false)
  const saveTimer = useRef(null)
  const mounted = useRef(true)
  const configRevision = useRef(0)
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
      const initialConfig = configResponse.data[0] || {
        business_name: 'Distribuidor Damian',
        headline: '',
        subheadline: '',
        whatsapp: '',
        email: '',
        address: '',
        is_active: true,
      }
      configRef.current = initialConfig
      setConfig(initialConfig)
      setProducts(productsResponse.data)
    } catch {
      setError('No se pudo cargar el catalogo. Comprueba la conexion.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    load()
    return () => {
      mounted.current = false
      clearTimeout(saveTimer.current)
      flushConfig()
    }
  }, [])

  const flushConfig = async () => {
    if (saveInFlight.current || !configRef.current || !Object.keys(pendingConfig.current).length) return
    saveInFlight.current = true
    if (mounted.current) setSaveStatus('Guardando...')
    let failed = false
    try {
      while (Object.keys(pendingConfig.current).length) {
        const changes = pendingConfig.current
        pendingConfig.current = {}
        try {
          const current = configRef.current
          const response = current.id
            ? await api.patch(`/landing/config/${current.id}/`, changes)
            : await api.post('/landing/config/', { ...current, ...changes })
          configRef.current = { ...response.data, ...pendingConfig.current }
          if (mounted.current) setConfig(configRef.current)
        } catch (error) {
          pendingConfig.current = { ...changes, ...pendingConfig.current }
          throw error
        }
      }
      if (mounted.current) setSaveStatus('Cambios guardados')
    } catch {
      failed = true
      if (mounted.current) setSaveStatus('No se pudo guardar. Reintentando...')
    } finally {
      saveInFlight.current = false
      if (failed && mounted.current) saveTimer.current = setTimeout(flushConfig, 4000)
    }
  }

  const updateConfig = (key, value) => {
    configRevision.current += 1
    configRef.current = { ...configRef.current, [key]: value }
    pendingConfig.current = { ...pendingConfig.current, [key]: value }
    setConfig(configRef.current)
    setSaveStatus('Cambios pendientes...')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushConfig, 600)
  }

  useEffect(() => {
    if (loading || editing || creating || busyId !== null) return
    let cancelled = false
    let syncing = false
    const sync = async () => {
      if (document.hidden || syncing) return
      syncing = true
      try {
        const response = await api.get('/catalogo/')
        if (!cancelled) setProducts(response.data)
        if (!saveInFlight.current && !Object.keys(pendingConfig.current).length) {
          const revision = configRevision.current
          const configResponse = await api.get('/landing/config/')
          if (!cancelled && revision === configRevision.current && !saveInFlight.current && !Object.keys(pendingConfig.current).length && configResponse.data[0]) {
            configRef.current = configResponse.data[0]
            setConfig(configRef.current)
          }
        }
      } catch {
        // Keep the current view during brief network interruptions.
      } finally {
        syncing = false
      }
    }
    const interval = setInterval(sync, 5000)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [loading, editing, creating, busyId])

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
        actions={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Nuevo producto para el catalogo</button>}
      />

      {error && <div className="form-error" role="alert">{error}</div>}
      {loading ? (
        <div className="table-card">Cargando catalogo...</div>
      ) : config ? (
        <>
          <section className="table-card">
            <h2>Informacion publica</h2>
            <form className="landing-form" onBlur={flushConfig} onSubmit={event => { event.preventDefault(); flushConfig() }}>
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
              <span className="landing-wide" role="status" aria-live="polite">{saveStatus}</span>
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
      {(creating || editing) && <CatalogEntryDrawer autoSave={Boolean(editing)} entry={editing} onClose={() => { setCreating(false); setEditing(null) }} onSaved={saved => {
        setProducts(current => [...current.filter(item => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, 'es')))
        if (editing) setEditing(saved)
        else setCreating(false)
      }} />}
    </>
  )
}

export default LandingView
