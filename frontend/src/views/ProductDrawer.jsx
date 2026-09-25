import { useEffect, useMemo, useState } from 'react'
import { Edit3, History, Save, Trash2, X } from 'lucide-react'

import MovementEditor from '../components/MovementEditor'
import { api } from '../services/api'
import { movementLabel, movementQuantity } from '../utils/format'

function ProductDrawer({
  product = null,
  onClose,
  onSaved,
  onInventoryChanged,
  initialTab = 'info',
  historyOnly = false,
  highlightedRange = null,
}) {
  const isNew = !product?.id
  const startingTab = historyOnly ? 'history' : initialTab
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    cost: product?.cost || '',
    description: product?.description || '',
  })
  const existingCatalogImages = product?.catalog_image_urls?.length ? product.catalog_image_urls : product?.landing_image_url ? [product.landing_image_url] : []
  const [catalogImageFiles, setCatalogImageFiles] = useState([])
  const [catalogImagePreviews, setCatalogImagePreviews] = useState(existingCatalogImages)
  const [materialImageFile, setMaterialImageFile] = useState(null)
  const [materialImagePreview, setMaterialImagePreview] = useState(product?.material_image_url || '')
  const [catalogInputKey, setCatalogInputKey] = useState(0)
  const [materialInputKey, setMaterialInputKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(startingTab)
  const [movements, setMovements] = useState([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [editingMovement, setEditingMovement] = useState(null)
  const [deletingMovementId, setDeletingMovementId] = useState(null)

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const updateCatalogImages = (files) => {
    const selectedFiles = Array.from(files || [])
    if (!selectedFiles.length) return

    setCatalogImageFiles((current) => {
      const selectedKeys = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      const newFiles = selectedFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`
        if (selectedKeys.has(key)) return false
        selectedKeys.add(key)
        return true
      })

      if (newFiles.length) {
        setCatalogImagePreviews((currentPreviews) => [
          ...currentPreviews,
          ...newFiles.map((file) => URL.createObjectURL(file)),
        ])
      }

      return [...current, ...newFiles]
    })
  }

  const updateMaterialImage = (file) => {
    setMaterialImageFile(file)
    if (file) {
      setMaterialImagePreview(URL.createObjectURL(file))
    }
  }

  const movementTotals = useMemo(() => {
    return movements.reduce((totals, movement) => {
      const quantity = Number(movement.quantity || 0)
      if (movement.movement_type === 'entrada') {
        return { ...totals, entries: totals.entries + quantity }
      }
      if (movement.movement_type === 'salida') {
        return { ...totals, exits: totals.exits + quantity }
      }
      return totals
    }, { entries: 0, exits: 0 })
  }, [movements])

  const loadProductMovements = async () => {
    if (isNew || !product?.id) return
    setLoadingMovements(true)
    const response = await api.get(`/movimientos-stock/?producto=${product.id}`)
    setMovements(response.data)
    setLoadingMovements(false)
  }

  const isHighlightedMovement = (movement) => {
    if (!highlightedRange?.from && !highlightedRange?.to) return false
    const date = movement.movement_date
    if (highlightedRange.from && date < highlightedRange.from) return false
    if (highlightedRange.to && date > highlightedRange.to) return false
    return true
  }

  useEffect(() => {
    if (isNew || activeTab !== 'history') return
    loadProductMovements()
  }, [activeTab, isNew, product?.id])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, value ?? '')
    })
    payload.append('product_type', 'producto')
    payload.append('minimum_stock', '0')
    payload.append('manages_stock', 'true')
    payload.append('is_active', 'true')
    catalogImageFiles.forEach((file) => payload.append('catalog_images', file))
    if (materialImageFile) {
      payload.append('material_image', materialImageFile)
    }

    try {
      let response
      if (isNew) {
        response = await api.post('/productos/', payload)
      } else {
        response = await api.patch(`/productos/${product.id}/`, payload)
      }
      setCatalogImageFiles([])
      setCatalogImagePreviews(response.data.catalog_image_urls?.length ? response.data.catalog_image_urls : response.data.landing_image_url ? [response.data.landing_image_url] : [])
      setMaterialImageFile(null)
      setMaterialImagePreview(response.data.material_image_url || '')
      setCatalogInputKey((value) => value + 1)
      setMaterialInputKey((value) => value + 1)
      onSaved(response.data)
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      setError(detail || 'No se pudo guardar. Revisa que el backend este encendido y vuelve a intentar.')
    } finally {
      setSaving(false)
    }
  }

  const deleteMovement = async (movement) => {
    const confirmed = window.confirm(`Estas seguro de eliminar el movimiento del ${movement.movement_date}? Esta accion actualizara el stock del producto.`)
    if (!confirmed) return

    setDeletingMovementId(movement.id)
    try {
      await api.delete(`/movimientos-stock/${movement.id}/`)
      await loadProductMovements()
      onInventoryChanged?.()
    } catch {
      window.alert('No se pudo eliminar el movimiento. Vuelve a intentarlo.')
    } finally {
      setDeletingMovementId(null)
    }
  }

  return (
    <div className="drawer-backdrop">
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <h2>{historyOnly ? `Historial del producto ${form.name}` : isNew ? 'Nuevo producto' : 'Editar ficha de producto'}</h2>
            <p>{form.sku || 'Sin codigo'}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        {!historyOnly && (
          <div className="drawer-tabs">
            <button type="button" className={activeTab === 'info' ? 'tab-active' : ''} onClick={() => setActiveTab('info')}>Informacion</button>
            {!isNew && (
              <button type="button" className={activeTab === 'history' ? 'tab-active' : ''} onClick={() => setActiveTab('history')}>
                <History size={16} /> Historial de movimientos
              </button>
            )}
          </div>
        )}

        {activeTab === 'info' ? (
          <form className="drawer-form" onSubmit={submit}>
            <h3>Informacion Basica</h3>
            <div className="form-grid">
              <label>Nombre<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
              <label>Codigo<input value={form.sku} onChange={(event) => update('sku', event.target.value)} /></label>
            </div>
            <h3>Datos base de inventario</h3>
            <div className="form-grid">
              <label>Precio inventario<input value={form.cost || ''} onChange={(event) => update('cost', event.target.value)} /></label>
            </div>
            <h3>Detalles</h3>
            <label>Descripcion<textarea value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
            <div className="image-purpose-grid">
              <label>
                Imagenes para catalogo
                <small>Fotos presentables para clientes en la pagina publica. Puedes seleccionar mas de una.</small>
                <input key={catalogInputKey} type="file" accept="image/*" multiple onChange={(event) => updateCatalogImages(event.target.files)} />
              </label>
              <label>
                Imagen para guia de materiales
                <small>Foto rapida para trabajadores al cargar o identificar material.</small>
                <input key={materialInputKey} type="file" accept="image/*" onChange={(event) => updateMaterialImage(event.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="image-preview-grid">
              {catalogImagePreviews.length > 0 && (
                <div className="product-image-preview product-image-preview-list">
                  <div className="product-preview-strip">
                    {catalogImagePreviews.map((preview, index) => (
                      <img src={preview} alt={`${form.name || 'Imagen para catalogo'} ${index + 1}`} key={preview} />
                    ))}
                  </div>
                  <span>
                    {catalogImageFiles.length
                      ? `${catalogImageFiles.length} nueva(s) imagen(es) para catalogo${existingCatalogImages.length ? ` + ${existingCatalogImages.length} actual(es)` : ''}`
                      : `${catalogImagePreviews.length} imagen(es) actuales de catalogo`}
                  </span>
                </div>
              )}
              {materialImagePreview && (
                <div className="product-image-preview">
                  <img src={materialImagePreview} alt={form.name || 'Imagen para guia de materiales'} />
                  <span>{materialImageFile ? 'Nueva imagen para materiales' : 'Imagen actual de materiales'}</span>
                </div>
              )}
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button" disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : isNew ? 'Crear producto' : 'Guardar cambios'}</button>
          </form>
        ) : (
          <section className="drawer-history">
            {historyOnly && (highlightedRange?.from || highlightedRange?.to) && (
              <div className="history-range-note">
                <History size={16} />
                <span>
                  Rango aplicado en el reporte: {highlightedRange.from || 'Inicio'} al {highlightedRange.to || 'hoy'}.
                </span>
              </div>
            )}
            <div className="history-summary">
              <article>
                <span>Ingresos</span>
                <strong>{movementTotals.entries}</strong>
              </article>
              <article>
                <span>Salidas</span>
                <strong>{movementTotals.exits}</strong>
              </article>
              <article>
                <span>Movimientos</span>
                <strong>{movements.length}</strong>
              </article>
            </div>

            {loadingMovements ? (
              <div className="empty-state">Cargando historial del producto...</div>
            ) : movements.length === 0 ? (
              <div className="empty-state">
                <strong>Sin movimientos registrados</strong>
                <span>Este producto todavia no tiene ingresos ni salidas registradas.</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Movimiento</th>
                      <th>Cantidad</th>
                      <th>Registrado por</th>
                      {!historyOnly && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr className={isHighlightedMovement(movement) ? 'highlighted-movement-row' : ''} key={movement.id}>
                        <td>{movement.movement_date}</td>
                        <td><span className={movement.movement_type === 'entrada' ? 'badge normal' : 'badge agotado'}>{movementLabel(movement.movement_type)}</span></td>
                        <td className={movement.movement_type === 'salida' ? 'negative-quantity' : 'positive-quantity'}>{movementQuantity(movement)}</td>
                        <td>{movement.created_by_username || '-'}</td>
                        {!historyOnly && (
                          <td>
                            <div className="row-actions">
                              <button className="icon-button" onClick={() => setEditingMovement(movement)} title="Editar movimiento">
                                <Edit3 size={17} />
                              </button>
                              <button
                                className="icon-button danger"
                                disabled={deletingMovementId === movement.id}
                                onClick={() => deleteMovement(movement)}
                                title="Eliminar movimiento"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {editingMovement && (
          <MovementEditor
            movement={editingMovement}
            onClose={() => setEditingMovement(null)}
            onSaved={async () => {
              setEditingMovement(null)
              await loadProductMovements()
              onInventoryChanged?.()
            }}
          />
        )}
      </aside>
    </div>
  )
}

export default ProductDrawer
