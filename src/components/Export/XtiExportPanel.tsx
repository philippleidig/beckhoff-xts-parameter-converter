import { useCallback, useState } from 'react'
import type { MoverControllerParameters } from '@/lib/converter/types'
import { downloadXti } from '@/lib/xti/generateXti'
import { isValidDriverVersion } from '@/lib/xti/xtiTemplate'
import { XTS_DRIVER_VERSION } from '@/lib/constants/xtsVersion'
import { Button } from '@/components/ui/Button'
import { DownloadIcon, AlertIcon } from '@/components/ui/Icons'
import './XtiExportPanel.css'

export interface ExportableSet {
  id: string
  label: string
  fileName: string
  /** Resolved on click so an edited parameter set always exports its current values. */
  getParams: () => MoverControllerParameters | null
  /** The first set is the primary action; the others are rendered as secondary. */
  variant?: 'primary' | 'secondary'
}

interface XtiExportPanelProps {
  sets: ExportableSet[]
}

/**
 * Downloads MoverController parameter sets as `.xti` files.
 *
 * The generated file names the TcIoXts driver version it targets. That version cannot
 * be derived from the parameters themselves, so it is exposed as an editable field
 * with the shipped default pre-filled.
 */
export function XtiExportPanel({ sets }: XtiExportPanelProps) {
  const [driverVersion, setDriverVersion] = useState(XTS_DRIVER_VERSION)
  const [exportError, setExportError] = useState<string | null>(null)

  const versionValid = isValidDriverVersion(driverVersion)

  const handleDownload = useCallback(
    (set: ExportableSet) => {
      setExportError(null)
      try {
        const params = set.getParams()
        if (!params) return
        downloadXti(params, set.fileName, { driverVersion })
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'The parameter set could not be generated.')
      }
    },
    [driverVersion]
  )

  return (
    <div className="xti-export">
      <div className="xti-export-actions">
        {sets.map((set) => (
          <Button
            key={set.id}
            variant={set.variant ?? 'primary'}
            onClick={() => handleDownload(set)}
            disabled={!versionValid}
          >
            <DownloadIcon size={15} />
            {set.label}
          </Button>
        ))}
      </div>

      {exportError && (
        <p className="xti-export-error">
          <AlertIcon size={14} />
          <span>{exportError}</span>
        </p>
      )}

      <details className="xti-export-version">
        <summary>
          Built for TcIoXts <strong>{driverVersion}</strong>
        </summary>
        <p className="xti-export-version-hint">
          The generated file references this driver version. It cannot be read from the source
          file, which describes the SoftDrive rather than the MoverController. Change it only if
          your TwinCAT installation ships a different TcIoXts version.
        </p>
        <div className="xti-export-version-row">
          <input
            type="text"
            className={`xti-export-version-input ${versionValid ? '' : 'is-invalid'}`}
            value={driverVersion}
            onChange={(e) => setDriverVersion(e.target.value)}
            aria-label="TcIoXts driver version"
            aria-invalid={!versionValid}
            spellCheck={false}
          />
          <button
            type="button"
            className="xti-export-version-reset"
            onClick={() => setDriverVersion(XTS_DRIVER_VERSION)}
            disabled={driverVersion === XTS_DRIVER_VERSION}
          >
            Reset
          </button>
        </div>
        {!versionValid && (
          <p className="xti-export-version-error">
            Expected four numbers, for example {XTS_DRIVER_VERSION}.
          </p>
        )}
      </details>
    </div>
  )
}
