import { InfoIcon, TipIcon, WarningIcon } from '@/components/ui/Icons'
import type { TutorialNote, TutorialNoteKind } from '@/lib/tutorial/steps'
import { richText } from './richText'
import './TutorialCallout.css'

const ICONS: Record<TutorialNoteKind, typeof InfoIcon> = {
  info: InfoIcon,
  tip: TipIcon,
  warning: WarningIcon,
}

export function TutorialCallout({ note }: { note: TutorialNote }) {
  const Icon = ICONS[note.kind]

  return (
    <aside className={`tutorial-callout tutorial-callout-${note.kind}`}>
      <span className="tutorial-callout-icon" aria-hidden="true">
        <Icon size={15} />
      </span>
      <div>
        <p className="tutorial-callout-title">{note.title}</p>
        <p className="tutorial-callout-text">{richText(note.text)}</p>
      </div>
    </aside>
  )
}
