import type { HTMLAttributes } from 'react'
import './Card.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Card({ title, className = '', children, ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  )
}
