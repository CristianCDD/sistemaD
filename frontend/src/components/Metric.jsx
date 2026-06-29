function Metric({ title, value, note, icon: Icon, tone }) {
  return (
    <article className={`metric-card ${tone || ''}`}>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <Icon size={22} />
    </article>
  )
}

export default Metric
