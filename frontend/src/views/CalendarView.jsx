import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import Header from '../components/Header'
import { api } from '../services/api'
import { localDateInputValue, movementLabel, movementQuantity } from '../utils/format'

function monthBounds(monthValue) {
  const [year, month] = monthValue.split('-').map(Number)
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  return {
    first,
    last,
    dateFrom: localDateInputValue(first),
    dateTo: localDateInputValue(last),
  }
}

function monthLabel(monthValue) {
  const [year, month] = monthValue.split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function moveMonth(monthValue, delta) {
  const [year, month] = monthValue.split('-').map(Number)
  const next = new Date(year, month - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

function CalendarView() {
  const today = localDateInputValue()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selectedDate, setSelectedDate] = useState(today)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { dateFrom, dateTo } = monthBounds(month)
    const response = await api.get(`/movimientos-stock/?desde=${dateFrom}&hasta=${dateTo}`)
    setMovements(response.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [month])

  const movementsByDate = useMemo(() => {
    return movements.reduce((acc, movement) => {
      const list = acc.get(movement.movement_date) || []
      list.push(movement)
      acc.set(movement.movement_date, list)
      return acc
    }, new Map())
  }, [movements])

  const days = useMemo(() => {
    const { first, last } = monthBounds(month)
    const startOffset = (first.getDay() + 6) % 7
    const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7

    return Array.from({ length: totalCells }).map((_, index) => {
      const dayNumber = index - startOffset + 1
      if (dayNumber < 1 || dayNumber > last.getDate()) return null
      const date = `${month}-${String(dayNumber).padStart(2, '0')}`
      const dayMovements = movementsByDate.get(date) || []
      const entradas = dayMovements.filter((movement) => movement.movement_type === 'entrada').length
      const salidas = dayMovements.filter((movement) => movement.movement_type === 'salida').length

      return { date, dayNumber, movements: dayMovements, entradas, salidas }
    })
  }, [month, movementsByDate])

  const selectedMovements = movementsByDate.get(selectedDate) || []

  return (
    <>
      <Header
        title="Calendario de movimientos"
        subtitle="Identifica que dias hubo ingresos o salidas de almacen."
        actions={
          <div className="calendar-actions">
            <button className="icon-button" onClick={() => setMonth((current) => moveMonth(current, -1))}><ChevronLeft size={18} /></button>
            <strong>{monthLabel(month)}</strong>
            <button className="icon-button" onClick={() => setMonth((current) => moveMonth(current, 1))}><ChevronRight size={18} /></button>
          </div>
        }
      />

      <div className="calendar-layout">
        <section className="calendar-panel">
          <div className="calendar-weekdays">
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-card">
            {days.map((day, index) => (
              <button
                className={[
                  'calendar-cell',
                  !day ? 'muted' : '',
                  day?.date === selectedDate ? 'selected' : '',
                  day?.movements.length ? 'has-movement' : '',
                ].join(' ')}
                key={day?.date || `empty-${index}`}
                disabled={!day}
                onClick={() => day && setSelectedDate(day.date)}
              >
                {day && (
                  <>
                    <strong>{day.dayNumber}</strong>
                    {day.movements.length > 0 ? (
                      <div className="calendar-movement-summary">
                        <span>Hubo movimiento</span>
                        <small>{day.entradas} ingreso{day.entradas === 1 ? '' : 's'} / {day.salidas} salida{day.salidas === 1 ? '' : 's'}</small>
                      </div>
                    ) : (
                      <small>Sin movimiento</small>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        <aside className="table-card calendar-detail">
          <h2>{selectedDate}</h2>
          {loading ? (
            <div className="empty-state">Cargando movimientos...</div>
          ) : selectedMovements.length === 0 ? (
            <div className="empty-state">
              <strong>Sin movimientos</strong>
              <span>Ese dia no se registraron ingresos ni salidas de almacen.</span>
            </div>
          ) : (
            <div className="movement-list">
              {selectedMovements.map((movement) => (
                <article key={movement.id} className="movement-item">
                  <span className={movement.movement_type === 'entrada' ? 'badge normal' : 'badge agotado'}>{movementLabel(movement.movement_type)}</span>
                  <strong>{movement.product_name}</strong>
                  <small>Cantidad: {movementQuantity(movement)}</small>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

export default CalendarView
