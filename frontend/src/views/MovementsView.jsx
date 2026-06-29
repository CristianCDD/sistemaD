import { useEffect, useMemo, useState } from 'react'
import { Edit3 } from 'lucide-react'

import Header from '../components/Header'
import MovementEditor from '../components/MovementEditor'
import { api } from '../services/api'
import { localDateInputValue, movementLabel, movementQuantity } from '../utils/format'

function MovementsView() {
  const today = localDateInputValue()
  const [date, setDate] = useState(today)
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMovement, setEditingMovement] = useState(null)
  const [form, setForm] = useState({
    product: '',
    movement_type: 'entrada',
    quantity: '',
    movement_date: today,
  })

  const stockProducts = useMemo(
    () => products.filter((product) => product.manages_stock),
    [products],
  )

  const loadMovements = async () => {
    setLoading(true)
    const response = await api.get(`/movimientos-stock/?fecha=${date}`)
    setMovements(response.data)
    setLoading(false)
  }

  const loadProducts = async () => {
    const response = await api.get('/productos/')
    const ordered = response.data
      .filter((product) => product.manages_stock)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    setProducts(ordered)
    setForm((current) => ({ ...current, product: current.product || ordered[0]?.id || '' }))
  }

  useEffect(() => {
    loadProducts()
    loadMovements()
  }, [])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submitMovement = async (event) => {
    event.preventDefault()
    if (!form.product || !form.quantity) return

    setSaving(true)
    const created = await api.post('/movimientos-stock/', {
      product: Number(form.product),
      movement_type: form.movement_type,
      quantity: Number(form.quantity),
      movement_date: form.movement_date,
    })
    setSaving(false)
    setForm((current) => ({ ...current, quantity: '' }))
    setDate(form.movement_date)
    if (form.movement_date === date) {
      setMovements((current) => [created.data, ...current])
      return
    }

    const response = await api.get(`/movimientos-stock/?fecha=${form.movement_date}`)
    setMovements(response.data)
  }

  return (
    <>
      <Header
        title="Almacen"
        subtitle="Registra solo ingresos y salidas: producto, movimiento, cantidad y fecha."
        actions={
          <div className="date-filter">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <button className="primary-button compact" onClick={loadMovements}>Consultar</button>
          </div>
        }
      />

      <section className="table-card">
        <h2>Registrar ingreso o salida</h2>
        <form className="movement-form" onSubmit={submitMovement}>
          <label>
            Producto
            <select value={form.product} onChange={(event) => update('product', event.target.value)} required>
              {stockProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
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
            <input type="date" value={form.movement_date} onChange={(event) => update('movement_date', event.target.value)} />
          </label>
          <button className="primary-button" disabled={saving || !stockProducts.length}>
            {saving ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </form>
      </section>

      <div className="table-card">
        <div className="table-toolbar">
          <strong>{movements.length} movimientos</strong>
          <span>{date}</span>
        </div>
        {loading ? (
          <div className="empty-state">Cargando movimientos del dia...</div>
        ) : movements.length === 0 ? (
          <div className="empty-state">
            <strong>Sin movimientos registrados</strong>
            <span>No se han registrado ingresos ni salidas para esta fecha. Cuando guardes un movimiento, aparecera aqui.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.product_name}</td>
                    <td><span className={movement.movement_type === 'entrada' ? 'badge normal' : 'badge agotado'}>{movementLabel(movement.movement_type)}</span></td>
                    <td className={movement.movement_type === 'salida' ? 'negative-quantity' : 'positive-quantity'}>{movementQuantity(movement)}</td>
                    <td>{movement.movement_date}</td>
                    <td>
                      <button className="icon-button" onClick={() => setEditingMovement(movement)} title="Editar movimiento">
                        <Edit3 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editingMovement && (
        <MovementEditor
          movement={editingMovement}
          onClose={() => setEditingMovement(null)}
          onSaved={async (updatedMovement) => {
            setEditingMovement(null)
            const response = await api.get(`/movimientos-stock/?fecha=${date}`)
            setMovements(response.data)
            if (updatedMovement.movement_date !== date) {
              setDate(updatedMovement.movement_date)
              const updatedDateResponse = await api.get(`/movimientos-stock/?fecha=${updatedMovement.movement_date}`)
              setMovements(updatedDateResponse.data)
            }
          }}
        />
      )}
    </>
  )
}

export default MovementsView
