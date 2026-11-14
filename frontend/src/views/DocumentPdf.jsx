import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

const assets = import.meta.env.DEV ? '/node_modules/pdfjs-dist/' : '/pdf-preview/'

export default function DocumentPdf({ blob }) {
  const [pdf, setPdf] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [renderedPage, setRenderedPage] = useState(0)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let task
    async function openPdf() {
      try {
        const data = await blob.arrayBuffer()
        if (cancelled) return
        task = getDocument({
          data, cMapUrl: assets + 'cmaps/', cMapPacked: true,
          standardFontDataUrl: assets + 'standard_fonts/', wasmUrl: assets + 'wasm/', iccUrl: assets + 'iccs/',
        })
        const doc = await task.promise
        if (!cancelled) setPdf(doc)
      } catch {
        if (!cancelled) setError('No se pudo abrir el PDF. Puedes descargarlo.')
      }
    }
    openPdf()
    return () => {
      cancelled = true
      task?.destroy().catch(() => {})
    }
  }, [blob])

  useEffect(() => {
    if (!pdf) return
    let cancelled = false
    let renderTask
    async function renderPage() {
      setError('')
      try {
        const page = await pdf.getPage(pageNumber)
        if (cancelled) return
        const canvas = canvasRef.current
        const natural = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(1500 / natural.width, 2200 / natural.height) })
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        canvas.style.setProperty('--page-width', `${natural.width}px`)
        renderTask = page.render({ canvas, viewport })
        await renderTask.promise
        if (!cancelled) setRenderedPage(pageNumber)
      } catch {
        if (!cancelled) setError('No se pudo mostrar esta p\u00e1gina. Puedes descargar el PDF.')
      }
    }
    renderPage()
    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [pdf, pageNumber])

  return (
    <div className="document-pdf">
      {pdf?.numPages > 1 && (
        <div className="document-pdf-controls" aria-label="Páginas del PDF">
          <button type="button" className="icon-button" title="Página anterior" aria-label="Página anterior" disabled={pageNumber === 1} onClick={() => setPageNumber((n) => n - 1)}><ChevronLeft size={18} /></button>
          <span aria-live="polite">Página {pageNumber} de {pdf.numPages}</span>
          <button type="button" className="icon-button" title="Página siguiente" aria-label="Página siguiente" disabled={pageNumber === pdf.numPages} onClick={() => setPageNumber((n) => n + 1)}><ChevronRight size={18} /></button>
        </div>
      )}
      <div className="document-pdf-page">
        {error ? <p role="alert">{error}</p> : renderedPage !== pageNumber && <p role="status">Cargando PDF...</p>}
        <canvas ref={canvasRef} hidden={Boolean(error) || renderedPage !== pageNumber} role="img" aria-label={`Página ${pageNumber} del PDF`} />
      </div>
    </div>
  )
}
