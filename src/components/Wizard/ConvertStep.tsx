import { useState } from 'react'
import { useParameterStore } from '@/stores/parameterStore'
import { mcParameterMeta } from '@/lib/tmc/registry'
import { Button } from '@/components/ui/Button'
import { DetailsModal } from '@/components/DetailsModal/DetailsModal'
import { LayersIcon } from '@/components/ui/Icons'
import './ConvertStep.css'
import { useTmcVersionStore } from '@/stores/tmcVersionStore'

function countParameters() {
  return Object.values(mcParameterMeta()).reduce((sum, module) => sum + Object.keys(module).length, 0)
}

export function ConvertStep() {
  // The parameter count comes from the selected driver version's metadata.
  useTmcVersionStore((state) => state.version)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { getConvertedParams, hasAreaSet } = useParameterStore()

  const converted = getConvertedParams()
  const areaSet = hasAreaSet()

  if (!converted) {
    return (
      <p className="convert-placeholder">
        Import parameters and select a magnet plate set to run the conversion.
      </p>
    )
  }

  return (
    <div className="convert-step">
      <dl className="convert-summary">
        <dt>Parameters converted</dt>
        <dd>{countParameters()}</dd>
        <dt>Parameter sets</dt>
        <dd>{areaSet ? '2 — base and area' : '1 — base'}</dd>
      </dl>

      {areaSet && (
        <p className="convert-area-hint">
          Area-dependent control was detected. A second parameter set is derived from the
          SoftDrive <code>_area</code> parameters.
        </p>
      )}

      <Button variant="secondary" size="sm" onClick={() => setDetailsOpen(true)}>
        <LayersIcon size={14} />
        Show details
      </Button>

      <DetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </div>
  )
}
