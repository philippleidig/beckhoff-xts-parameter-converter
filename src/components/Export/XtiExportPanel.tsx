import { useCallback, useState } from 'react'
import type { MoverControllerParameters } from '@/lib/converter/types'
import { downloadXti } from '@/lib/xti/generateXti'
import { isValidDriverVersion } from '@/lib/xti/xtiTemplate'
import { XTS_DRIVER_VERSION } from '@/lib/constants/xtsVersion'
import { useTmcVersionStore } from '@/stores/tmcVersionStore'
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
 * The file is generated from the driver metadata of the version selected in the
 * header, so both its contents and the version it names follow that choice. The
 * override below only rewrites the version number, which is why it is a last resort
 * rather than the primary control.
 */
export function XtiExportPanel({ sets }: XtiExportPanelProps) {
  const activeVersion = useTmcVersionStore((state) => state.version)
  const [override, setOverride] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const driverVersion = override ?? activeVersion
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
          {override !== null && <span className="xti-export-version-badge">overridden</span>}
        </summary>
        <p className="xti-export-version-hint">
          The file is generated from the driver metadata of the version selected in the header,
          so pick the version there — the parameters, units and enum values shown throughout the
          app follow it too.
        </p>
        <p className="xti-export-version-hint">
          If your TwinCAT installation ships a TcIoXts version that is not listed, you can name it
          here. Only the version number is rewritten: the file itself is still built from{' '}
          <strong>{activeVersion}</strong>, so anything that changed between the two will be wrong.
        </p>
        <div className="xti-export-version-row">
          <input
            type="text"
            className={`xti-export-version-input ${versionValid ? '' : 'is-invalid'}`}
            value={driverVersion}
            onChange={(e) => setOverride(e.target.value)}
            aria-label="TcIoXts driver version"
            aria-invalid={!versionValid}
            spellCheck={false}
          />
          <button
            type="button"
            className="xti-export-version-reset"
            onClick={() => setOverride(null)}
            disabled={override === null}
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
