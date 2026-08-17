import { ViewHeader } from '@/components/Layout/ViewHeader'
import { Button } from '@/components/ui/Button'
import { ResetIcon } from '@/components/ui/Icons'
import { findStep, TUTORIAL_STEPS } from '@/lib/tutorial/steps'
import { useTutorialStore } from '@/stores/tutorialStore'
import { TutorialTree } from './TutorialTree'
import { TutorialStepPanel } from './TutorialStepPanel'
import './TutorialView.css'

interface TutorialViewProps {
  onBack: () => void
}

export function TutorialView({ onBack }: TutorialViewProps) {
  const { activeStepId, completed, setActive, markDone, reset } = useTutorialStore()
  const step = findStep(activeStepId)

  return (
    <>
      <ViewHeader
        title="Migrate from SoftDrive to MoverController"
        description="A step-by-step walkthrough: export the SoftDrive parameters, convert them, let the XTS Configurator rebuild the movers, and assign the new central parameter set."
        onBack={onBack}
        actions={
          <Button variant="ghost" size="sm" onClick={reset} disabled={completed.length === 0}>
            <ResetIcon size={14} />
            Reset progress
          </Button>
        }
      />

      <div className="tutorial">
        <aside className="tutorial-rail">
          <p className="tutorial-progress">
            {completed.length} of {TUTORIAL_STEPS.length} steps done
          </p>
          <TutorialTree
            activeStepId={activeStepId}
            completedIds={completed}
            onSelect={setActive}
          />
        </aside>

        <TutorialStepPanel
          step={step}
          done={completed.includes(step.id)}
          onSelect={setActive}
          onMarkDone={markDone}
        />
      </div>
    </>
  )
}
