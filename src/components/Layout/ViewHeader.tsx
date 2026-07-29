import type { ReactNode } from 'react'
import { BackIcon } from '@/components/ui/Icons'
import './ViewHeader.css'

interface ViewHeaderProps {
  title: string
  description: string
  onBack: () => void
  /** Optional controls rendered on the right, e.g. a reset action. */
  actions?: ReactNode
}

export function ViewHeader({ title, description, onBack, actions }: ViewHeaderProps) {
  return (
    <div className="view-header">
      <button type="button" className="view-header-back" onClick={onBack}>
        <BackIcon size={15} />
        Start
      </button>
      <div className="view-header-text">
        <h2 className="view-header-title">{title}</h2>
        <p className="view-header-description">{description}</p>
      </div>
      {actions && <div className="view-header-actions">{actions}</div>}
    </div>
  )
}
