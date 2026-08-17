import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { BackIcon, CheckIcon, ExternalLinkIcon } from '@/components/ui/Icons'
import { TUTORIAL_STEPS } from '@/lib/tutorial/steps'
import type { TutorialStep } from '@/lib/tutorial/steps'
import { TutorialCallout } from './TutorialCallout'
import { richText } from './richText'
import './TutorialStepPanel.css'

const NUMBERED_STEPS = TUTORIAL_STEPS.filter((step) => step.number !== undefined).length

/**
 * Turns an in-app `#/view` href into an absolute one.
 *
 * The action opens a second browser tab so the reader keeps their place in the
 * walkthrough while working in another tool.
 */
function resolveHref(href: string): string {
  if (!href.startsWith('#')) return href
  return `${window.location.pathname}${window.location.search}${href}`
}

interface TutorialStepPanelProps {
  step: TutorialStep
  done: boolean
  onSelect: (id: string) => void
  onMarkDone: (id: string) => void
}

export function TutorialStepPanel({ step, done, onSelect, onMarkDone }: TutorialStepPanelProps) {
  const index = TUTORIAL_STEPS.findIndex((entry) => entry.id === step.id)
  const previous = TUTORIAL_STEPS[index - 1]
  const next = TUTORIAL_STEPS[index + 1]

  // Warnings go above the click path so they are read before anything is changed in
  // TwinCAT; explanations and tips read better once the screenshots have been seen.
  const warnings = step.notes.filter((note) => note.kind === 'warning')
  const asides = step.notes.filter((note) => note.kind !== 'warning')

  const headerRef = useRef<HTMLElement>(null)
  const renderedStepId = useRef(step.id)

  useEffect(() => {
    // A step can be taller than the viewport, so moving on has to bring the heading back
    // into view instead of leaving the reader half way down the previous page.
    if (renderedStepId.current === step.id) return
    renderedStepId.current = step.id
    headerRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }, [step.id])

  const handlePrimary = () => {
    if (!done) onMarkDone(step.id)
    if (next) onSelect(next.id)
  }

  return (
    <article className="tutorial-step">
      <header className="tutorial-step-header" ref={headerRef}>
        <p className="tutorial-step-eyebrow">
          {step.number === undefined ? 'Before you start' : `Step ${step.number} of ${NUMBERED_STEPS}`}
          {step.optional && <span className="tutorial-step-badge">Optional</span>}
          {done && (
            <span className="tutorial-step-badge is-done">
              <CheckIcon size={10} strokeWidth={3.5} />
              Done
            </span>
          )}
        </p>
        <h2 className="tutorial-step-title">{step.title}</h2>
        <p className="tutorial-step-summary">{richText(step.summary)}</p>
      </header>

      {warnings.map((note) => (
        <TutorialCallout key={note.title} note={note} />
      ))}

      <ol className="tutorial-step-instructions">
        {step.instructions.map((instruction, i) => (
          <li key={i}>{richText(instruction)}</li>
        ))}
      </ol>

      {step.action && (
        <a
          className="tutorial-step-action"
          href={resolveHref(step.action.href)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {step.action.label}
          <ExternalLinkIcon size={14} />
        </a>
      )}

      {step.figures.map((figure) => (
        <figure key={figure.src} className="tutorial-figure">
          <div className="tutorial-figure-frame">
            <img src={figure.src} alt={figure.alt} />
          </div>
          <figcaption>{richText(figure.caption)}</figcaption>
        </figure>
      ))}

      {asides.map((note) => (
        <TutorialCallout key={note.title} note={note} />
      ))}

      {step.links.length > 0 && (
        <section className="tutorial-step-links">
          <h3>Beckhoff documentation</h3>
          <ul>
            {step.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ExternalLinkIcon size={12} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="tutorial-step-footer">
        {previous ? (
          <Button variant="secondary" size="sm" onClick={() => onSelect(previous.id)}>
            <BackIcon size={14} />
            Back
          </Button>
        ) : (
          <span />
        )}

        <div className="tutorial-step-footer-actions">
          {step.optional && next && !done && (
            <Button variant="ghost" size="sm" onClick={() => onSelect(next.id)}>
              Skip this step
            </Button>
          )}

          {next ? (
            <Button size="sm" onClick={handlePrimary}>
              {done ? 'Continue' : 'Mark done and continue'}
            </Button>
          ) : (
            <Button size="sm" onClick={handlePrimary} disabled={done}>
              {done ? 'Migration complete' : 'Mark as done'}
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
