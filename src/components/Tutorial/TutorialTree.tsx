import { CheckIcon } from '@/components/ui/Icons'
import { TUTORIAL_GROUPS } from '@/lib/tutorial/steps'
import './TutorialTree.css'

type NodeStatus = 'done' | 'active' | 'pending'

interface TutorialTreeProps {
  activeStepId: string
  completedIds: string[]
  onSelect: (id: string) => void
}

/**
 * The walkthrough as a task tree: groups on the first level, steps branching off them.
 *
 * It doubles as the navigation and as the progress report — which is why every node
 * carries a status marker rather than the tree being a plain list of links.
 */
export function TutorialTree({ activeStepId, completedIds, onSelect }: TutorialTreeProps) {
  return (
    <nav className="tutorial-tree" aria-label="Migration steps">
      {TUTORIAL_GROUPS.map((group) => {
        const groupDone = group.steps.every((step) => completedIds.includes(step.id))

        return (
          <section key={group.id} className="tutorial-tree-group">
            <p className={`tutorial-tree-node tutorial-tree-group-title${groupDone ? ' is-done' : ''}`}>
              <Marker status={groupDone ? 'done' : 'pending'} />
              {group.title}
            </p>

            <ul className="tutorial-tree-steps">
              {group.steps.map((step) => {
                const status: NodeStatus = completedIds.includes(step.id)
                  ? 'done'
                  : step.id === activeStepId
                    ? 'active'
                    : 'pending'

                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      className={`tutorial-tree-node tutorial-tree-step is-${status}`}
                      onClick={() => onSelect(step.id)}
                      aria-current={step.id === activeStepId ? 'step' : undefined}
                    >
                      <Marker status={status} optional={step.optional} />
                      <span className="tutorial-tree-label">
                        {step.number !== undefined && (
                          <span className="tutorial-tree-number">{step.number}.</span>
                        )}
                        {step.title}
                        {step.optional && <span className="tutorial-tree-optional">Optional</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </nav>
  )
}

function Marker({ status, optional }: { status: NodeStatus; optional?: boolean }) {
  return (
    <span
      className={`tutorial-tree-marker is-${status}${optional ? ' is-optional' : ''}`}
      aria-hidden="true"
    >
      {status === 'done' && <CheckIcon size={11} strokeWidth={3.5} />}
    </span>
  )
}
