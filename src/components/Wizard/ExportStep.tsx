import { useCallback, useState } from 'react'
import { useParameterStore } from '@/stores/parameterStore'
import { downloadXti } from '@/lib/xti/generateXti'
import { isValidDriverVersion } from '@/lib/xti/xtiTemplate'
import { XTS_DRIVER_VERSION } from '@/lib/constants/xtsVersion'
import { Button } from '@/components/ui/Button'
import { DownloadIcon, AlertIcon } from '@/components/ui/Icons'
import './ExportStep.css'

const BASE_FILENAME = 'MoverControllerParameterSet.xti'
const AREA_FILENAME = 'MoverControllerParameterSet_Area.xti'

export function ExportStep() {
  const { getConvertedParams, hasAreaSet, controlAreas } = useParameterStore()

  const [driverVersion, setDriverVersion] = useState(XTS_DRIVER_VERSION)
  const [exportError, setExportError] = useState<string | null>(null)

  const areaSet = hasAreaSet()
  const canExport = getConvertedParams() !== null
  const versionValid = isValidDriverVersion(driverVersion)

  const handleDownload = useCallback(
    (variant: 'base' | 'area') => {
      setExportError(null)
      try {
        const params = getConvertedParams(variant)
        if (!params) return
        downloadXti(params, variant === 'base' ? BASE_FILENAME : AREA_FILENAME, { driverVersion })
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'The parameter set could not be generated.')
      }
    },
    [getConvertedParams, driverVersion]
  )

  if (!canExport) {
    return <p className="export-placeholder">Complete the previous steps to enable the export.</p>
  }

  return (
    <div className="export-step">
      <div className="export-actions">
        <Button onClick={() => handleDownload('base')} disabled={!versionValid}>
          <DownloadIcon size={15} />
          Base parameter set
        </Button>
        {areaSet && (
          <Button variant="secondary" onClick={() => handleDownload('area')} disabled={!versionValid}>
            <DownloadIcon size={15} />
            Area parameter set
          </Button>
        )}
      </div>

      {exportError && (
        <p className="export-error">
          <AlertIcon size={14} />
          <span>{exportError}</span>
        </p>
      )}

      <details className="export-version">
        <summary>
          Built for TcIoXts <strong>{driverVersion}</strong>
        </summary>
        <p className="export-version-hint">
          The generated file references this driver version. It cannot be read from the source
          file, which describes the SoftDrive rather than the MoverController. Change it only if
          your TwinCAT installation ships a different TcIoXts version.
        </p>
        <div className="export-version-row">
          <input
            type="text"
            className={`export-version-input ${versionValid ? '' : 'is-invalid'}`}
            value={driverVersion}
            onChange={(e) => setDriverVersion(e.target.value)}
            aria-label="TcIoXts driver version"
            aria-invalid={!versionValid}
            spellCheck={false}
          />
          <button
            type="button"
            className="export-version-reset"
            onClick={() => setDriverVersion(XTS_DRIVER_VERSION)}
            disabled={driverVersion === XTS_DRIVER_VERSION}
          >
            Reset
          </button>
        </div>
        {!versionValid && (
          <p className="export-version-error">
            Expected four numbers, for example {XTS_DRIVER_VERSION}.
          </p>
        )}
      </details>

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
