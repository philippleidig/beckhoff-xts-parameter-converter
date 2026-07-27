import { useCallback } from 'react'
import { useParameterStore } from '@/stores/parameterStore'
import { downloadXti } from '@/lib/xti/generateXti'
import { Button } from '@/components/ui/Button'
import { DownloadIcon } from '@/components/ui/Icons'
import './ExportStep.css'

const BASE_FILENAME = 'MoverControllerParameterSet.xti'
const AREA_FILENAME = 'MoverControllerParameterSet_Area.xti'

export function ExportStep() {
  const { getConvertedParams, hasAreaSet, controlAreas } = useParameterStore()

  const areaSet = hasAreaSet()
  const canExport = getConvertedParams() !== null

  const handleDownload = useCallback(
    (variant: 'base' | 'area') => {
      const params = getConvertedParams(variant)
      if (params) downloadXti(params, variant === 'base' ? BASE_FILENAME : AREA_FILENAME)
    },
    [getConvertedParams]
  )

  if (!canExport) {
    return <p className="export-placeholder">Complete the previous steps to enable the export.</p>
  }

  return (
    <div className="export-step">
      <div className="export-actions">
        <Button onClick={() => handleDownload('base')}>
          <DownloadIcon size={15} />
          Base parameter set
        </Button>
        {areaSet && (
          <Button variant="secondary" onClick={() => handleDownload('area')}>
            <DownloadIcon size={15} />
            Area parameter set
          </Button>
        )}
      </div>

      {areaSet && controlAreas.length > 0 && (
        <div className="export-areas">
          <p className="export-areas-title">Assign the area set to these control areas:</p>
          <table className="export-areas-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Start</th>
                <th>End</th>
                <th>Transition</th>
              </tr>
            </thead>
            <tbody>
              {controlAreas.map((area) => (
                <tr key={area.index}>
                  <td>{area.index}</td>
                  <td>{area.startPosition} mm</td>
                  <td>{area.endPosition} mm</td>
                  <td>{area.transitionLength} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {areaSet && controlAreas.length === 0 && (
        <p className="export-areas-note">
          The source uses area-dependent control, but no control area is enabled in the file.
          Define the position range for the area parameter set in the XTS Configurator.
        </p>
      )}
    </div>
  )
}
