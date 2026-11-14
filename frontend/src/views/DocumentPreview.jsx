import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Download, FileText, X } from 'lucide-react'

import { api } from '../services/api'

const DocumentPdf = lazy(() => import('./DocumentPdf'))
const imageTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

export default function DocumentPreview({ item, onClose, onDownload }) {
  const dialog = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const extension = item.name.split('.').pop().toLowerCase()
  const imageType = Object.hasOwn(imageTypes, extension) ? imageTypes[extension] : null
  const isPdf = extension === 'pdf'

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    if (!imageType && !isPdf) return
    const controller = new AbortController()
    let url
    api.get(`/documentos/archivos/${item.id}/descargar/`, { responseType: 'blob', signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return
        if (imageType) url = URL.createObjectURL(data.slice(0, data.size, imageType))
        setFile({ blob: data, url })
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('No se pudo cargar la vista previa.')
      })
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [item.id, imageType, isPdf])

  async function download() {
    setDownloading(true)
    try {
      if (!await onDownload(item, file?.blob)) setError('No se pudo descargar el archivo.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <dialog className="document-preview" ref={dialog} aria-labelledby="document-preview-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === dialog.current) onClose() }}>
      <div className="document-preview-layout">
        <header className="document-preview-header">
          <FileText size={21} aria-hidden="true" />
          <h2 id="document-preview-title">{item.name}</h2>
          <button type="button" className="icon-button" aria-label="Descargar archivo" title="Descargar archivo" disabled={downloading} onClick={download}><Download size={18} /></button>
          <button type="button" className="icon-button" aria-label="Cerrar vista previa" title="Cerrar vista previa" onClick={onClose} autoFocus><X size={20} /></button>
        </header>
        <div className="document-preview-body">
          {error ? <p role="alert">{error}</p>
            : !imageType && !isPdf ? <p>Vista previa no disponible para este formato.</p>
              : !file ? <p role="status">Cargando vista previa...</p>
                : imageType ? <img className="document-preview-image" src={file.url} alt={item.name} onError={() => setError('No se pudo mostrar la imagen.')} />
                  : <Suspense fallback={<p role="status">Cargando PDF...</p>}><DocumentPdf blob={file.blob} /></Suspense>}
        </div>
      </div>
    </dialog>
  )
}
