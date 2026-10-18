import { useEffect, useRef, useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import { api } from '../services/api'

export default function CatalogEntryDrawer({ entry, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: entry?.name || '', sku: entry?.sku || '', description: entry?.description || '',
    category: entry?.category || '', show_on_landing: entry?.show_on_landing ?? false,
    is_active: entry?.is_active ?? true,
  })
  const [images, setImages] = useState(entry?.catalog_images_data || [])
  const [files, setFiles] = useState([])
  const previewUrls = useRef(new Set())
  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }, [])
  const appendFiles = event => {
    const selected = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'))
    const additions = selected.map(file => {
      const url = URL.createObjectURL(file)
      previewUrls.current.add(url)
      return { file, url }
    })
    setFiles(current => [...current, ...additions])
    event.target.value = ''
  }
  const removeFile = url => {
    URL.revokeObjectURL(url)
    previewUrls.current.delete(url)
    setFiles(current => current.filter(item => item.url !== url))
  }
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
    files.forEach(item => payload.append('images', item.file))
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
      </div>
      <label>Descripcion<textarea value={form.description} onChange={e => update('description', e.target.value)} /></label>
      <label className="checkbox-line"><input type="checkbox" checked={form.show_on_landing} onChange={e => update('show_on_landing', e.target.checked)} /> Mostrar en catalogo</label>
      <label className="checkbox-line"><input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} /> Activo</label>
      <label>Imagenes<input type="file" accept="image/*" multiple onChange={appendFiles} /></label>
      {(images.length > 0 || files.length > 0) && <div className="product-image-preview product-image-preview-list">
      <div className="product-preview-strip">{images.map(image => <div className="product-preview-tile" key={image.id}>
        <img src={image.url} alt={form.name} />
        <button type="button" className="preview-delete" aria-label="Quitar imagen" onClick={() => { setDeleted(current => [...current, image.id]); setImages(current => current.filter(item => item.id !== image.id)) }}><Trash2 size={14} /></button>
      </div>)}
      {files.map(item => <div className="product-preview-tile" key={item.url}>
        <img src={item.url} alt={item.file.name} />
        <button type="button" className="preview-delete" title="Quitar imagen" aria-label={`Quitar ${item.file.name}`} onClick={() => removeFile(item.url)}><Trash2 size={14} /></button>
      </div>)}
      </div>
      <span>{images.length + files.length} imagen(es) de catalogo{files.length > 0 ? ` (${files.length} nueva(s))` : ''}</span>
      </div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button" disabled={saving}><Save size={16} />{saving ? 'Guardando...' : 'Guardar ficha'}</button>
    </form>
  </aside></div>
}
