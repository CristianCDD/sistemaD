import { useEffect, useMemo, useState } from 'react'
import { Edit3, FileSpreadsheet, Plus, RefreshCcw, Trash2 } from 'lucide-react'

import Header from '../components/Header'
import SearchBox from '../components/SearchBox'
import { api } from '../services/api'
import { inventoryPrice, money, statusLabel, stockBadge } from '../utils/format'
import ProductDrawer from './ProductDrawer'

function ProductsView() {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingProductId, setDeletingProductId] = useState(null)

  const load = async () => {
    setLoading(true)
    const productsResponse = await api.get('/productos/')
    setProducts(productsResponse.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return products
    return products.filter((product) => {
      return product.name.toLowerCase().includes(value) || (product.sku || '').toLowerCase().includes(value)
    })
  }, [products, query])

  const upsertProduct = (savedProduct) => {
    if (!savedProduct?.id) return
    setProducts((current) => {
      const exists = current.some((product) => product.id === savedProduct.id)
      const next = exists
        ? current.map((product) => product.id === savedProduct.id ? savedProduct : product)
        : [savedProduct, ...current]
      return next.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    })
  }

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`Estas seguro de eliminar "${product.name}"? Tambien se eliminaran sus movimientos de stock.`)
    if (!confirmed) return

    setDeletingProductId(product.id)
    try {
      await api.delete(`/productos/${product.id}/`)
      setProducts((current) => current.filter((item) => item.id !== product.id))
    } catch {
      window.alert('No se pudo eliminar el producto. Vuelve a intentarlo.')
    } finally {
      setDeletingProductId(null)
    }
  }

  const exportProducts = () => {
    const rows = products
      .slice()
      .sort((a, b) => {
        const aExhausted = Number(a.stock || 0) <= 0 || a.stock_status === 'agotado'
        const bExhausted = Number(b.stock || 0) <= 0 || b.stock_status === 'agotado'
        if (aExhausted !== bExhausted) return aExhausted ? 1 : -1
        return a.name.localeCompare(b.name, 'es')
      })
      .map((product) => [
        product.name,
        product.sku || '',
        product.stock ?? 0,
      ])

    const escapeCell = (value) => {
      const text = String(value ?? '')
      return `"${text.replaceAll('"', '""')}"`
    }

    const csv = [
      ['Producto', 'Codigo', 'Stock'],
      ...rows,
    ].map((row) => row.map(escapeCell).join(';')).join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `productos-stock-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Header
        title="Productos"
        subtitle="Edita la ficha del producto: nombre, codigo, descripcion y precio de inventario."
        actions={<SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre o codigo" />}
      />
      <div className="table-card">
        <div className="table-toolbar">
          <strong>{filtered.length} registros</strong>
          <div className="table-actions">
            <button className="soft-button" onClick={exportProducts} disabled={!products.length}>
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button className="primary-button compact" onClick={() => setCreating(true)}><Plus size={16} /> Nuevo producto</button>
            <button className="soft-button" onClick={load}><RefreshCcw size={16} /> Actualizar</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Codigo</th>
                <th>Precio inventario</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Cargando productos...</td></tr>
              ) : filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{product.sku || '-'}</td>
                  <td>{money(inventoryPrice(product))}</td>
                  <td>{product.stock ?? '-'}</td>
                  <td><span className={stockBadge(product.stock_status)}>{statusLabel(product.stock_status)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button" onClick={() => setEditing(product)} title="Editar producto">
                        <Edit3 size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        disabled={deletingProductId === product.id}
                        onClick={() => deleteProduct(product)}
                        title="Eliminar producto"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <ProductDrawer
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(savedProduct) => {
            upsertProduct(savedProduct)
            setEditing(null)
          }}
          onInventoryChanged={load}
        />
      )}
      {creating && (
        <ProductDrawer
          onClose={() => setCreating(false)}
          onSaved={(savedProduct) => {
            upsertProduct(savedProduct)
            setCreating(false)
          }}
          onInventoryChanged={load}
        />
      )}
    </>
  )
}

export default ProductsView
