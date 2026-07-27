import { useParameterStore } from '@/stores/parameterStore'
import { MAGNET_PLATE_TYPES } from '@/lib/constants/magnetPlateTypes'
import { Select } from '@/components/ui/Select'
import './MagnetPlateStep.css'

const magnetPlateOptions = Object.values(MAGNET_PLATE_TYPES).map((mp) => ({
  value: mp.id,
  label: `${mp.name} (FF: ${mp.forceFactor})`,
}))

export function MagnetPlateStep() {
  const { selectedMagnetPlateType, setMagnetPlateType, magnetPlateDetected, softDriveParams } =
    useParameterStore()
  const selected = selectedMagnetPlateType ? MAGNET_PLATE_TYPES[selectedMagnetPlateType] : null

  return (
    <div className="magnet-plate-step">
      <p className="magnet-plate-hint">
        The magnet plate determines the force factor used to convert the current-based SoftDrive
        gains into the force-based MoverController gains.
      </p>

      <Select
        options={magnetPlateOptions}
        value={selectedMagnetPlateType ?? ''}
        onChange={(e) => setMagnetPlateType(e.target.value)}
        placeholder="Select magnet plate set..."
        aria-label="Magnet plate set"
      />

      {magnetPlateDetected && softDriveParams && (
        <div className="magnet-plate-detected">
          <span className="magnet-plate-badge">Detected from source</span>
          <span className="magnet-plate-evidence">
            Motor torque constant {softDriveParams.softDrive.TorqueConstant} matches this plate.
            Change it above if that is not the plate you are migrating to.
          </span>
        </div>
      )}

      {selected && (
        <dl className="magnet-plate-summary">
          <dt>Magnet plate</dt>
          <dd>{selected.name}</dd>
          <dt>Force factor</dt>
          <dd>{selected.forceFactor}</dd>
        </dl>
      )}
    </div>
  )
}
