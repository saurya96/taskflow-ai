import { AlertCircle, Check, LoaderCircle, Plus } from 'lucide-react'

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function StatusBadge({ status }) {
  const label = status === 'success' ? 'Successful' : status || 'Unknown'
  return <span className={`status-badge status-${status}`}>{label}</span>
}

export function Alert({ children, variant = 'error' }) {
  if (!children) return null
  const Icon = variant === 'success' ? Check : AlertCircle
  return (
    <div className={`alert alert-${variant}`} role="status">
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={22} />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon = Plus, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
