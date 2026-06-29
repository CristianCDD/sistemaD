import { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'

import { api } from '../services/api'

function MovementEditor({ movement, onClose, onSaved }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    product: movement?.product || '',
    movement_type: movement?.movement_type || 'entrada',
    quantity: movement?.quantity || '',
    movement_date: movement?.movement_date || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      const response = await api.get('/productos/')
      const ordered = response.data.sort((a, b) => a.name.localeCompare(b.name, 'es'))
      setProducts(ordered)
      setForm((current) => ({ ...current, product: current.product || ordered[0]?.id || '' }))
    }

    loadProducts()
  }, [])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (!movement?.id || !form.product || !form.quantity || !form.movement_date) return

    setSaving(true)
    setError('')
    try {
      const response = await api.patch(`/movimientos-stock/${movement.id}/`, {
        product: Number(form.product),
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        movement_date: form.movement_date,
      })
      onSaved(response.data)
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      setError(detail || 'No se pudo actualizar el movimiento. Revisa los datos e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drawer-backdrop">
      <section className="movement-modal">
        <div className="drawer-head">
          <div>
            <h2>Editar movimiento</h2>
            <p>{movement?.product_name || 'Movimiento de almacen'}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        <form className="drawer-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Producto
              <select value={form.product} onChange={(event) => update('product', event.target.value)} required>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} ({product.sku || 'sin codigo'})</option>
                ))}
              </select>
            </label>
            <label>
              Movimiento
              <select value={form.movement_type} onChange={(event) => update('movement_type', event.target.value)}>
                <option value="entrada">Ingreso</option>
                <option value="salida">Salida</option>
              </select>
            </label>
            <label>
              Cantidad
              <input type="number" min="1" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} required />
            </label>
            <label>
              Fecha
              <input type="date" value={form.movement_date} onChange={(event) => update('movement_date', event.target.value)} required />
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar correccion'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default MovementEditor
