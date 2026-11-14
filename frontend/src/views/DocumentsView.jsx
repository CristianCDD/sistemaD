import { Fragment, useEffect, useRef, useState } from 'react'
import { Archive, ChevronRight, Download, FileText, Folder, FolderOpen, FolderPlus, RefreshCw, Search, Upload, X } from 'lucide-react'

import Header from '../components/Header'
import { api } from '../services/api'
import './DocumentsView.css'

const dateFormat = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' })
const sizeFormat = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })

function sizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${sizeFormat.format(bytes / 1024)} KB`
  return `${sizeFormat.format(bytes / 1024 ** 2)} MB`
}

function errorMessage(error, fallback) {
  const data = error.response?.data
  if (typeof data?.detail === 'string') return data.detail
  return ['file', 'name', 'folder', 'parent'].map((key) => data?.[key]?.[0]).find(Boolean) || fallback
}

export default function DocumentsView() {
  const [folder, setFolder] = useState(null)
  const [query, setQuery] = useState('')
  const [version, setVersion] = useState(0)
  const [library, setLibrary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [folderName, setFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const uploadInput = useRef(null)
  const zipInput = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get('/documentos/', {
          params: { carpeta: folder, q: query.trim() }, signal: controller.signal,
        })
        if (!controller.signal.aborted) setLibrary(data)
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(errorMessage(error, 'No se pudieron cargar los documentos.'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, query ? 180 : 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [folder, query, version])

  const reload = () => setVersion((value) => value + 1)

  function openFolder(id) {
    setFolder(id)
    setQuery('')
    setNotice('')
    setActionError('')
    setCreating(false)
    setFolderName('')
  }

  async function createFolder(event) {
    event.preventDefault()
    setBusy('folder')
    setActionError('')
    setNotice('')
    try {
      await api.post('/documentos/carpetas/', { name: folderName.trim(), parent: folder })
      setCreating(false)
      setFolderName('')
      setQuery('')
      setNotice('Carpeta creada.')
      reload()
    } catch (error) {
      setActionError(errorMessage(error, 'No se pudo crear la carpeta.'))
    } finally {
      setBusy('')
    }
  }

  async function upload(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setActionError('')
    setNotice('')
    if (file.size > library.max_file_bytes) {
      setActionError(`El archivo supera los ${sizeLabel(library.max_file_bytes)}.`)
      return
    }
    setBusy('upload')
    try {
      const data = new FormData()
      data.append('file', file)
      if (folder) data.append('folder', folder)
      await api.post('/documentos/archivos/', data)
      setQuery('')
      setNotice(`Se subi\u00f3 ${file.name}.`)
      reload()
    } catch (error) {
      setActionError(errorMessage(error, 'No se pudo subir el archivo.'))
    } finally {
      setBusy('')
    }
  }

  async function download(document) {
    setBusy(`download-${document.id}`)
    setActionError('')
    setNotice('')
    try {
      const { data } = await api.get(`/documentos/archivos/${document.id}/descargar/`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.name
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch {
      setActionError('No se pudo descargar el archivo.')
    } finally {
      setBusy('')
    }
  }

  async function uploadZip(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setActionError('')
    setNotice('')
    if (file.size > library.max_zip_bytes) {
      setActionError(`El ZIP supera los ${sizeLabel(library.max_zip_bytes)}.`)
      return
    }
    setBusy('zip')
    try {
      const form = new FormData()
      form.append('file', file)
      if (folder) form.append('folder', folder)
      const { data } = await api.post('/documentos/importar-zip/', form)
      setQuery('')
      setNotice(`Archivos importados: ${data.imported}. Ya existentes: ${data.existing}. Conflictos sin sobrescribir: ${data.conflicts}.`)
      reload()
    } catch (error) {
      setActionError(errorMessage(error, 'No se pudo importar el ZIP.'))
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <Header title="Documentos" subtitle="Archivos compartidos de Distribuidor Damian" />
      <section className="documents-panel" aria-label="Biblioteca de documentos">
        <div className="documents-toolbar">
          <nav className="documents-path" aria-label="Ruta de carpetas">
            <button type="button" disabled={Boolean(busy)} onClick={() => openFolder(null)} aria-current={!folder ? 'location' : undefined}>
              <FolderOpen size={17} aria-hidden="true" /> Documentos
            </button>
            {library?.path.map((item) => (
              <Fragment key={item.id}>
                <ChevronRight size={14} aria-hidden="true" />
                <button type="button" disabled={Boolean(busy)} aria-current={folder === item.id ? 'location' : undefined} onClick={() => openFolder(item.id)}>{item.name}</button>
              </Fragment>
            ))}
          </nav>
          <div className="documents-actions">
            {library?.can_manage && (
              <>
                <button type="button" className="soft-button" disabled={loading || Boolean(busy) || Boolean(loadError)} onClick={() => setCreating(true)}>
                  <FolderPlus size={18} aria-hidden="true" /> Nueva carpeta
                </button>
                <button type="button" className="primary-button" disabled={loading || Boolean(busy) || Boolean(loadError)} onClick={() => uploadInput.current.click()}>
                  <Upload size={18} aria-hidden="true" /> {busy === 'upload' ? 'Subiendo...' : 'Subir archivo'}
                </button>
                <input hidden ref={uploadInput} type="file" accept={library.extensions.join(',')} onChange={upload} aria-label="Elegir archivo" />
                {library.max_zip_bytes && (
                  <>
                    <button type="button" className="soft-button" disabled={loading || Boolean(busy) || Boolean(loadError)} onClick={() => zipInput.current.click()}>
                      <Archive size={18} aria-hidden="true" /> {busy === 'zip' ? 'Importando...' : 'Importar ZIP'}
                    </button>
                    <input hidden ref={zipInput} type="file" accept=".zip" onChange={uploadZip} aria-label="Elegir ZIP" />
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="documents-filters">
          <label className="documents-search">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Buscar en esta carpeta" aria-label="Buscar en esta carpeta" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button type="button" className="icon-button" disabled={loading || Boolean(busy)} onClick={reload} title="Actualizar documentos" aria-label="Actualizar documentos">
            <RefreshCw size={17} aria-hidden="true" />
          </button>
        </div>
        {creating && (
          <form className="documents-create" onSubmit={createFolder}>
            <label>Nombre de la carpeta<input value={folderName} maxLength={120} onChange={(event) => setFolderName(event.target.value)} required autoFocus /></label>
            <button type="submit" className="primary-button" disabled={!folderName.trim() || Boolean(busy)}>Crear</button>
            <button type="button" className="icon-button" title="Cancelar" aria-label="Cancelar" disabled={Boolean(busy)} onClick={() => { setCreating(false); setActionError('') }}>
              <X size={18} aria-hidden="true" />
            </button>
          </form>
        )}
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
        {notice && <p className="documents-notice" role="status">{notice}</p>}
        {loading ? <div className="empty-state" role="status">Cargando documentos...</div>
          : loadError ? <div className="empty-state" role="alert">{loadError}</div>
            : !library?.folders.length && !library?.documents.length ? <div className="empty-state">{query.trim() ? 'No se encontraron resultados.' : 'Esta carpeta est\u00e1 vac\u00eda.'}</div>
              : <div className="documents-list">
                  <table>
                    <thead><tr><th scope="col">Nombre</th><th scope="col">Fecha</th><th scope="col">Tamaño</th><th scope="col" aria-label="Acciones" /></tr></thead>
                    <tbody>
                      {library.folders.map((item) => (
                        <tr key={`folder-${item.id}`}>
                          <th scope="row"><button className="documents-folder" disabled={Boolean(busy)} type="button" onClick={() => openFolder(item.id)}><Folder size={21} aria-hidden="true" /> <span>{item.name}</span></button></th>
                          <td>—</td><td>—</td><td />
                        </tr>
                      ))}
                      {library.documents.map((item) => (
                        <tr key={`file-${item.id}`}>
                          <th scope="row"><div className="documents-filename"><FileText size={21} aria-hidden="true" /> <span>{item.name}</span></div></th>
                          <td>{dateFormat.format(new Date(item.created_at))}</td><td>{sizeLabel(item.size)}</td>
                          <td><button type="button" className="icon-button" title={`Descargar ${item.name}`} aria-label={`Descargar ${item.name}`} disabled={Boolean(busy)} onClick={() => download(item)}><Download size={17} aria-hidden="true" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>}
      </section>
    </>
  )
}
