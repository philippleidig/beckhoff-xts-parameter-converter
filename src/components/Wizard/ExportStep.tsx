import { useMemo } from 'react'
import { useParameterStore } from '@/stores/parameterStore'
import { XtiExportPanel } from '@/components/Export/XtiExportPanel'
import type { ExportableSet } from '@/components/Export/XtiExportPanel'
import './ExportStep.css'

const BASE_FILENAME = 'MoverControllerParameterSet.xti'
const AREA_FILENAME = 'MoverControllerParameterSet_Area.xti'

export function ExportStep() {
  const { getConvertedParams, hasAreaSet, controlAreas } = useParameterStore()

  const areaSet = hasAreaSet()
  const canExport = getConvertedParams() !== null

  const sets = useMemo<ExportableSet[]>(() => {
    const result: ExportableSet[] = [
      {
        id: 'base',
        label: 'Base parameter set',
        fileName: BASE_FILENAME,
        getParams: () => getConvertedParams('base'),
      },
    ]
    if (areaSet) {
      result.push({
        id: 'area',
        label: 'Area parameter set',
        fileName: AREA_FILENAME,
        getParams: () => getConvertedParams('area'),
        variant: 'secondary',
      })
    }
    return result
  }, [areaSet, getConvertedParams])

  if (!canExport) {
    return <p className="export-placeholder">Complete the previous steps to enable the export.</p>
  }

  return (
    <div className="export-step">
      <XtiExportPanel sets={sets} />

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
