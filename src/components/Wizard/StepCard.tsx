import type { ReactNode } from 'react'
import { CheckIcon } from '@/components/ui/Icons'
import { HelpButton } from '@/components/Help/HelpButton'
import type { HelpGuideId } from '@/lib/help/guides'
import './StepCard.css'

export type StepStatus = 'done' | 'active' | 'pending'

interface StepCardProps {
  step: number
  title: string
  status: StepStatus
  helpGuideId?: HelpGuideId
  children: ReactNode
}

export function StepCard({ step, title, status, helpGuideId, children }: StepCardProps) {
  return (
    <section className={`step-card step-card-${status}`} aria-current={status === 'active'}>
      <header className="step-card-header">
        <span className="step-card-badge" aria-hidden="true">
          {status === 'done' ? <CheckIcon size={14} strokeWidth={3} /> : step}
        </span>
        <h2 className="step-card-title">{title}</h2>
        {helpGuideId && <HelpButton guideId={helpGuideId} />}
      </header>
      <div className="step-card-body">{children}</div>
    </section>
  )
}
