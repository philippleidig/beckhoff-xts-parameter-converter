import type { InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  unit?: string
}

export function Input({ unit, className = '', ...props }: InputProps) {
  if (unit) {
    return (
      <div className={`input-with-unit ${className}`}>
        <input className="input" {...props} />
        <span className="input-unit">{unit}</span>
      </div>
    )
  }
  return <input className={`input ${className}`} {...props} />
}
