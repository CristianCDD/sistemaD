function Header({ title, subtitle, actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  )
}

export default Header
