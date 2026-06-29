import { useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, RefreshCcw } from 'lucide-react'

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
                    <button className="icon-button" onClick={() => setEditing(product)} title="Editar">
                      <Edit3 size={17} />
                    </button>
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
