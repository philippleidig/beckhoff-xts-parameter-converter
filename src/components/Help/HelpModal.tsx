import { Modal } from '@/components/ui/Modal'
import type { HelpGuide } from '@/lib/help/guides'
import './HelpModal.css'

interface HelpModalProps {
  guide: HelpGuide
  open: boolean
  onClose: () => void
}

export function HelpModal({ guide, open, onClose }: HelpModalProps) {
  return (
    <Modal open={open} title={guide.title} onClose={onClose}>
      <p className="help-intro">{guide.intro}</p>
      <ol className="help-steps">
        {guide.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <figure className="help-figure">
        <img src={guide.image.src} alt={guide.image.alt} className="help-image" />
      </figure>
      {guide.note && <p className="help-note">{guide.note}</p>}
    </Modal>
  )
}
