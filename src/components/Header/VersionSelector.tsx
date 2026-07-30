import { useCallback } from 'react'
import { useTmcVersionStore } from '@/stores/tmcVersionStore'
import { TMC_VERSIONS } from '@/lib/tmc/registry'
import './VersionSelector.css'

/**
 * Picks the TcIoXts driver version the whole application works against.
 *
 * It sits in the header rather than in the export step because it changes more than
 * the exported file: parameter names, units and enum values in Convert, Create and
 * Compare all come from the selected version's driver metadata.
 *
 * With only one version available there is nothing to choose, so the control renders
 * as a plain label instead of a dropdown with a single entry.
 */
export function VersionSelector() {
  const version = useTmcVersionStore((state) => state.version)
  const loading = useTmcVersionStore((state) => state.loading)
  const error = useTmcVersionStore((state) => state.error)
  const select = useTmcVersionStore((state) => state.select)

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      void select(event.target.value)
    },
    [select]
  )

  if (TMC_VERSIONS.length <= 1) {
    return (
      <span className="version-selector version-selector-static" title="The only TcIoXts version available">
        TcIoXts {version}
      </span>
    )
  }

  return (
    <span className={`version-selector ${error ? 'is-error' : ''}`}>
      <label className="version-selector-label" htmlFor="tmc-version">
        TcIoXts
      </label>
      <select
        id="tmc-version"
        className="version-selector-select"
        value={version}
        onChange={handleChange}
        disabled={loading}
        aria-busy={loading}
        aria-label="TcIoXts driver version"
        title={error ?? 'Driver version used for parameter names, units and the exported file'}
      >
        {TMC_VERSIONS.map((entry) => (
          <option key={entry.version} value={entry.version}>
            {entry.version}
            {entry.version === TMC_VERSIONS[0].version ? ' (latest)' : ''}
          </option>
        ))}
      </select>
      {error && <span className="version-selector-error">{error}</span>}
    </span>
  )
}
