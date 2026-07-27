import { useParameterStore } from '@/stores/parameterStore'
import { StepCard } from './StepCard'
import type { StepStatus } from './StepCard'
import { ImportStep } from './ImportStep'
import { MagnetPlateStep } from './MagnetPlateStep'
import { ConvertStep } from './ConvertStep'
import { ExportStep } from './ExportStep'
import './Wizard.css'

export function Wizard() {
  const { softDriveParams, selectedMagnetPlateType } = useParameterStore()

  const imported = !!softDriveParams
  const plateSelected = !!selectedMagnetPlateType
  const converted = imported && plateSelected

  // The first unfinished step is the active one; everything after it stays dimmed.
  const completion = [imported, plateSelected, converted, false]
  const activeIndex = completion.indexOf(false)

  const statusOf = (index: number): StepStatus => {
    if (completion[index]) return 'done'
    return index === activeIndex ? 'active' : 'pending'
  }

  return (
    <div className="wizard">
      <StepCard step={1} title="Import" status={statusOf(0)}>
        <ImportStep />
      </StepCard>

      <StepCard step={2} title="Magnet Plate Set" status={statusOf(1)}>
        <MagnetPlateStep />
      </StepCard>

      <StepCard step={3} title="Convert" status={statusOf(2)}>
        <ConvertStep />
      </StepCard>

      <StepCard step={4} title="Export" status={statusOf(3)} helpGuideId="importParameterSet">
        <ExportStep />
      </StepCard>
    </div>
  )
}
