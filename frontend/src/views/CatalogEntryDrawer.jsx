import { useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import { api } from '../services/api'

export default function CatalogEntryDrawer({ entry, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: entry?.name || '', sku: entry?.sku || '', description: entry?.description || '',
    category: entry?.category || '', origin: entry?.origin || 'sin_definir', tags: entry?.tags || '',
    sale_price: entry?.sale_price ?? '', show_on_landing: entry?.show_on_landing ?? false,
    show_price_on_landing: entry?.show_price_on_landing ?? false, is_active: entry?.is_active ?? true,
  })
  const [images, setImages] = useState(entry?.catalog_images_data || [])
  const [files, setFiles] = useState([])
  const [deleted, setDeleted] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const save = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    files.forEach(file => payload.append('images', file))
    deleted.forEach(id => payload.append('delete_image_ids', id))
    try {
      const response = entry?.id
        ? await api.patch(`/catalogo/${entry.id}/`, payload)
        : await api.post('/catalogo/', payload)
      onSaved(response.data)
    } catch (err) {
      const details = err.response?.data
      setError(details ? Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(' ') : 'No se pudo guardar la ficha.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="drawer-backdrop"><aside className="drawer">
    <div className="drawer-head"><h2>{entry ? 'Editar ficha de catalogo' : 'Nueva ficha de catalogo'}</h2>
      <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
    </div>
    <form className="drawer-form" onSubmit={save}>
      <div className="form-grid">
        <label>Nombre comercial<input required maxLength={160} value={form.name} onChange={e => update('name', e.target.value)} /></label>
        <label>Codigo<input maxLength={80} value={form.sku} onChange={e => update('sku', e.target.value)} /></label>
        <label>Categoria<input maxLength={120} value={form.category} onChange={e => update('category', e.target.value)} /></label>
        <label>Origen<select value={form.origin} onChange={e => update('origin', e.target.value)}>
          <option value="sin_definir">Sin definir</option><option value="importado">Importado</option><option value="local">Compra local</option>
        </select></label>
      </div>
      <label>Descripcion<textarea value={form.description} onChange={e => update('description', e.target.value)} /></label>
      <label>Medidas y colores<input maxLength={240} value={form.tags} onChange={e => update('tags', e.target.value)} /></label>
      <label>Precio de venta<input type="number" min="0" step="0.01" value={form.sale_price} onChange={e => update('sale_price', e.target.value)} /></label>
      <label className="checkbox-line"><input type="checkbox" checked={form.show_price_on_landing} onChange={e => update('show_price_on_landing', e.target.checked)} /> Mostrar precio</label>
      <label className="checkbox-line"><input type="checkbox" checked={form.show_on_landing} onChange={e => update('show_on_landing', e.target.checked)} /> Mostrar en catalogo</label>
      <label className="checkbox-line"><input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} /> Activo</label>
      <label>Imagenes<input type="file" accept="image/*" multiple onChange={e => { setFiles(current => [...current, ...Array.from(e.target.files)]); e.target.value = '' }} /></label>
      <div className="product-preview-strip">{images.map(image => <div className="product-preview-tile" key={image.id}>
        <img src={image.url} alt={form.name} />
        <button type="button" className="preview-delete" aria-label="Quitar imagen" onClick={() => { setDeleted(current => [...current, image.id]); setImages(current => current.filter(item => item.id !== image.id)) }}><Trash2 size={14} /></button>
      </div>)}</div>
      {files.map((file, index) => <div className="row-actions" key={index}><span>{file.name}</span><button type="button" className="icon-button" aria-label={`Quitar ${file.name}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X size={16} /></button></div>)}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button" disabled={saving}><Save size={16} />{saving ? 'Guardando...' : 'Guardar ficha'}</button>
    </form>
  </aside></div>
}
