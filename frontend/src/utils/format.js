export function money(value) {
  if (value === null || value === undefined || value === '') return 'Consultar'
  const number = Number(value)
  if (Number.isNaN(number)) return 'Consultar'
  return `S/ ${number.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function inventoryPrice(product) {
  return product?.cost ?? product?.sale_price ?? null
}

export function statusLabel(status) {
  const labels = {
    normal: 'Normal',
    bajo: 'Bajo',
    agotado: 'Agotado',
    no_aplica: 'No aplica',
  }
  return labels[status] || status
}

export function stockBadge(status) {
  return `badge ${status || 'neutral'}`
}

export function movementLabel(type) {
  const labels = {
    entrada: 'Ingreso',
    salida: 'Salida',
    ajuste: 'Ajuste',
  }
  return labels[type] || type
}

export function movementQuantity(movement) {
  const quantity = Number(movement?.quantity || 0)
  if (movement?.movement_type === 'salida') return `-${quantity}`
  return `${quantity}`
}

export function localDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
