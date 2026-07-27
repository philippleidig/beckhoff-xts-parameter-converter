import { useState } from 'react'
import { HELP_GUIDES } from '@/lib/help/guides'
import type { HelpGuideId } from '@/lib/help/guides'
import { HelpIcon } from '@/components/ui/Icons'
import { HelpModal } from './HelpModal'
import './HelpButton.css'

interface HelpButtonProps {
  guideId: HelpGuideId
}

export function HelpButton({ guideId }: HelpButtonProps) {
  const [open, setOpen] = useState(false)
  const guide = HELP_GUIDES[guideId]

  return (
    <>
      <button
        type="button"
        className="help-button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={guide.title}
        title={guide.title}
      >
        <HelpIcon size={16} />
      </button>
      <HelpModal guide={guide} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
