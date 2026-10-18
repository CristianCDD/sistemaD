import { useEffect, useRef, useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import { api } from '../services/api'
import { prepareImageUpload } from '../utils/prepareImageUpload'

export default function CatalogEntryDrawer({ entry, onClose, onSaved, guideMode = false }) {
  const [form, setForm] = useState({
    name: entry?.name || '', sku: entry?.sku || '', description: entry?.description || '',
    ...(!guideMode ? { category: entry?.category || '' } : {}),
  })
  const [images, setImages] = useState(entry?.catalog_images_data || [])
  const [files, setFiles] = useState([])
  const previewUrls = useRef(new Set())
  const imagePreparation = useRef(Promise.resolve())
  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }, [])
  const appendFiles = event => {
    const selected = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'))
    const additions = selected.map(file => {
      const url = URL.createObjectURL(file)
      previewUrls.current.add(url)
      // Start compression while the user completes the form, one image at a time.
      const prepared = imagePreparation.current.then(() => prepareImageUpload(file))
      imagePreparation.current = prepared.then(() => undefined)
      return { file, url, prepared }
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
  const [saveStatus, setSaveStatus] = useState('')
  const [error, setError] = useState('')
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const save = async event => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveStatus(files.length ? 'Preparando imagenes...' : 'Guardando...')
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    if (!entry?.id) {
      if (!guideMode) payload.append('show_on_landing', 'true')
      payload.append('is_active', 'true')
    }
    deleted.forEach(id => payload.append('delete_image_ids', id))
    try {
      const preparedFiles = await Promise.all(files.map(item => item.prepared))
      preparedFiles.forEach(file => payload.append('images', file))
      setSaveStatus(files.length ? 'Subiendo imagenes...' : 'Guardando...')
      const options = {
        onUploadProgress: event => {
          if (!files.length || !event.total) return
          const percent = Math.min(100, Math.round(event.loaded * 100 / event.total))
          setSaveStatus(percent < 100 ? `Subiendo imagenes... ${percent}%` : 'Guardando imagenes...')
        },
      }
      const endpoint = guideMode ? '/guia-materiales/' : '/catalogo/'
      const response = entry?.id
        ? await api.patch(`${endpoint}${entry.id}/`, payload, options)
        : await api.post(endpoint, payload, options)
      onSaved(response.data)
    } catch (err) {
      const details = err.response?.data
      setError(details ? Object.entries(details).map(([key, value]) => `${key}: ${value}`).join(' ') : 'No se pudo guardar la ficha.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="drawer-backdrop"><aside className="drawer">
    <div className="drawer-head"><h2>{guideMode
      ? entry ? 'Editar producto de la guia' : 'Anadir nuevo producto para la guia'
      : entry ? 'Editar producto del catalogo' : 'Nuevo producto para el catalogo'}</h2>
      <button className="icon-button" disabled={saving} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
    </div>
    <form className="drawer-form" onSubmit={save}>
      <div className="form-grid">
        <label>Nombre comercial<input required maxLength={160} value={form.name} onChange={e => update('name', e.target.value)} /></label>
        <label>Codigo<input maxLength={80} value={form.sku} onChange={e => update('sku', e.target.value)} /></label>
        {!guideMode && <label>Categoria<input maxLength={120} value={form.category} onChange={e => update('category', e.target.value)} /></label>}
      </div>
      <label>Descripcion<textarea value={form.description} onChange={e => update('description', e.target.value)} /></label>
      <label>Imagenes<input type="file" accept="image/*" multiple disabled={saving} onChange={appendFiles} /></label>
      {(images.length > 0 || files.length > 0) && <div className="product-image-preview product-image-preview-list">
      <div className="product-preview-strip">{images.map(image => <div className="product-preview-tile" key={image.id}>
        <img src={image.url} alt={form.name} />
        <button type="button" className="preview-delete" disabled={saving} aria-label="Quitar imagen" onClick={() => { setDeleted(current => [...current, image.id]); setImages(current => current.filter(item => item.id !== image.id)) }}><Trash2 size={14} /></button>
      </div>)}
      {files.map(item => <div className="product-preview-tile" key={item.url}>
        <img src={item.url} alt={item.file.name} />
        <button type="button" className="preview-delete" disabled={saving} title="Quitar imagen" aria-label={`Quitar ${item.file.name}`} onClick={() => removeFile(item.url)}><Trash2 size={14} /></button>
      </div>)}
      </div>
      <span>{images.length + files.length} imagen(es){files.length > 0 ? ` (${files.length} nueva(s))` : ''}</span>
      </div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button" disabled={saving} aria-live="polite"><Save size={16} />{saving ? saveStatus : 'Guardar producto'}</button>
    </form>
  </aside></div>
}
