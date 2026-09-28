import { useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, ClipboardList, History, Package, RefreshCcw, X } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Header from '../components/Header'
import Metric from '../components/Metric'
import SearchBox from '../components/SearchBox'
import { api } from '../services/api'
import { inventoryPrice, localDateInputValue, money, statusLabel, stockBadge } from '../utils/format'
import ProductDrawer from './ProductDrawer'

const quickRanges = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'previous-month', label: 'Mes anterior' },
  { id: 'all', label: 'Todo' },
]

function quickRangeDates(rangeId) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  if (rangeId === 'today') {
    const date = localDateInputValue(today)
    return { from: date, to: date }
  }

  if (rangeId === 'week') {
    const day = today.getDay() || 7
    const start = new Date(today)
    start.setDate(today.getDate() - day + 1)
    return { from: localDateInputValue(start), to: localDateInputValue(today) }
  }

  if (rangeId === 'previous-month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: localDateInputValue(start), to: localDateInputValue(end) }
  }

  if (rangeId === 'all') return { from: '', to: '' }

  return { from: localDateInputValue(startOfMonth), to: localDateInputValue(today) }
}

function StockReportView() {
  const [report, setReport] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [query, setQuery] = useState('')
  const [historyProduct, setHistoryProduct] = useState(null)
  const [dateFrom, setDateFrom] = useState(() => localDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [dateTo, setDateTo] = useState(() => localDateInputValue())
  const [activeRange, setActiveRange] = useState('month')
  const [loading, setLoading] = useState(true)

  const load = async ({ from = dateFrom, to = dateTo, product = selectedProduct } = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (product) params.set('producto', product)
    if (from) params.set('desde', from)
    if (to) params.set('hasta', to)
    const response = await api.get(`/reportes/stock/?${params.toString()}`)
    setReport(response.data)
    setLoading(false)
  }

  const applyQuickRange = (rangeId) => {
    const range = quickRangeDates(rangeId)
    setActiveRange(rangeId)
    setDateFrom(range.from)
    setDateTo(range.to)
    load({ from: range.from, to: range.to })
  }

  const updateDateFrom = (value) => {
    setActiveRange('')
    setDateFrom(value)
  }

  const updateDateTo = (value) => {
    setActiveRange('')
    setDateTo(value)
  }

  const loadProducts = async () => {
    const response = await api.get('/productos/')
    setProducts(response.data.sort((a, b) => a.name.localeCompare(b.name, 'es')))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    load()
  }, [selectedProduct])

  const filteredProducts = useMemo(() => {
    if (!report?.products) return []
    const value = query.trim().toLowerCase()
    if (!value) return report.products
    return report.products.filter((product) => (
      product.name.toLowerCase().includes(value)
      || (product.sku || '').toLowerCase().includes(value)
    ))
  }, [report, query])

  const selectedProductName = selectedProduct
    ? products.find((product) => String(product.id) === String(selectedProduct))?.name
    : ''

  const selectedProductData = selectedProduct
    ? products.find((product) => String(product.id) === String(selectedProduct))
    : null

  const periodLabel = dateFrom || dateTo
    ? `${dateFrom || 'Inicio'} al ${dateTo || 'hoy'}`
    : 'Todos los movimientos registrados'

  const stateData = report ? [
    { name: 'Normal', value: report.normal, color: '#24b77a' },
    { name: 'Agotado', value: report.exhausted, color: '#ef5b6d' },
  ] : []

  const movementData = report ? [
    { name: 'Entradas', cantidad: report.movements.entries },
    { name: 'Salidas', cantidad: report.movements.exits },
  ] : []

  return (
    <>
      <Header
        title="Reporte de Stock"
        subtitle={`${selectedProductName || 'Todos los productos'} - Periodo: ${periodLabel}`}
        className="sticky-header stock-report-header"
        actions={
          <div className="report-filters">
            <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              <option value="">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} ({product.sku || 'sin codigo'})</option>
              ))}
            </select>
            <div className="quick-range-group" aria-label="Rangos rapidos">
              {quickRanges.map((range) => (
                <button
                  className={`quick-range-button ${activeRange === range.id ? 'active' : ''}`.trim()}
                  key={range.id}
                  onClick={() => applyQuickRange(range.id)}
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>
            <input type="date" value={dateFrom} onChange={(event) => updateDateFrom(event.target.value)} />
            <input type="date" value={dateTo} onChange={(event) => updateDateTo(event.target.value)} />
            {selectedProductData && (
              <button className="soft-button compact" onClick={() => setHistoryProduct(selectedProductData)}>
                <History size={16} /> Historial completo
              </button>
            )}
            {selectedProduct && (
              <button className="soft-button compact" onClick={() => setSelectedProduct('')} title="Quitar producto">
                <X size={16} />
              </button>
            )}
            <button className="primary-button compact" onClick={() => load()}><RefreshCcw size={16} /> Aplicar</button>
          </div>
        }
      />
      {loading || !report ? (
        <div className="table-card">Cargando reporte...</div>
      ) : (
        <>
          <div className="metric-grid">
            <Metric title="Total de productos" value={report.total_products} note={`${report.total_products} activos`} icon={Package} />
            <Metric title="Productos agotados" value={report.exhausted} note="Stock actual en cero" tone="warning" icon={ClipboardList} />
            <Metric title="Valor inventario" value={money(report.inventory_value)} note="Segun precio inventario" icon={CircleDollarSign} />
          </div>
          <div className="report-grid">
            <section className="chart-card">
              <div className="chart-head">
                <h2>Movimientos del periodo</h2>
                <p>{selectedProductName || 'Todos los productos'} - {periodLabel}</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={movementData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#1b64e8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="chart-card">
              <h2>Estado del Stock</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stateData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={100} paddingAngle={3}>
                    {stateData.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </section>
          </div>
          <InventoryTable
            products={filteredProducts}
            query={query}
            setQuery={setQuery}
            selectedProduct={selectedProduct}
            onSelectProduct={(product) => setSelectedProduct(String(product.id))}
          />
        </>
      )}
      {historyProduct && (
        <ProductDrawer
          product={historyProduct}
          initialTab="history"
          historyOnly
          highlightedRange={{ from: dateFrom, to: dateTo }}
          onClose={() => setHistoryProduct(null)}
          onSaved={async () => {
            setHistoryProduct(null)
            await loadProducts()
            await load()
          }}
          onInventoryChanged={load}
        />
      )}
    </>
  )
}

function InventoryTable({ products, query, setQuery, selectedProduct, onSelectProduct }) {
  return (
    <div className="table-card">
      <div className="table-toolbar">
        <h2>Inventario de Productos</h2>
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar producto o codigo" />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Codigo</th>
              <th>Stock Actual</th>
              <th>Estado</th>
              <th>Precio inventario</th>
            </tr>
          </thead>
          <tbody>
            {products.length ? (
              products.map((product) => (
                <tr
                  className={`clickable-row ${String(product.id) === String(selectedProduct) ? 'selected-row' : ''}`.trim()}
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                >
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.stock}</td>
                  <td><span className={stockBadge(product.stock_status)}>{statusLabel(product.stock_status)}</span></td>
                  <td>{money(inventoryPrice(product))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className="empty-state compact">
                    <strong>Sin productos encontrados</strong>
                    <span>Prueba con otro nombre o codigo para ver el inventario.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StockReportView
