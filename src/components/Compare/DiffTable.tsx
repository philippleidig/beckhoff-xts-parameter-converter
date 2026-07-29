import { Fragment } from 'react'
import { hexToDataUrl } from '@/lib/icons/imageData'
import type { DiffResult, DiffRow } from '@/lib/compare/diff'

interface DiffTableProps {
  diff: DiffResult
  leftLabel: string
  rightLabel: string
  /** When false, identical parameters are hidden so only the differences remain. */
  showIdentical: boolean
}

/** Trims the float noise a conversion leaves behind without hiding small values. */
function formatValue(value: string | number): string {
  if (typeof value !== 'number') return String(value)
  if (Number.isInteger(value)) return value.toString()
  return parseFloat(value.toFixed(6)).toString()
}

function formatDelta(row: DiffRow): string {
  if (row.status === 'same') return ''
  if (row.relativeChange === null) return '→'

  const percent = row.relativeChange * 100
  const arrow = percent > 0 ? '↑' : '↓'
  const magnitude = Math.abs(percent)
  const digits = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2
  return `${arrow} ${percent > 0 ? '+' : '−'}${magnitude.toFixed(digits)} %`
}

export function DiffTable({ diff, leftLabel, rightLabel, showIdentical }: DiffTableProps) {
  const visibleModules = diff.modules
    .map((module) => ({
      ...module,
      groups: module.groups
        .map((group) => ({
          ...group,
          rows: showIdentical ? group.rows : group.rows.filter((row) => row.status === 'changed'),
        }))
        .filter((group) => group.rows.length > 0),
    }))
    .filter((module) => module.groups.length > 0)

  if (visibleModules.length === 0) {
    return (
      <p className="diff-empty">
        Both parameter sets are identical — all {diff.totalCount} parameters match.
      </p>
    )
  }

  return (
    <div className="diff-modules">
      {visibleModules.map((module) => (
        <section key={module.key} className="diff-module">
          <header className="diff-module-header">
            <img src={hexToDataUrl(module.iconHex)} alt="" width={16} height={16} />
            <h4 className="diff-module-title">{module.label}</h4>
            <span className="diff-module-count">
              {module.changedCount === 0
                ? 'no differences'
                : `${module.changedCount} of ${module.totalCount} differ`}
            </span>
          </header>

          <table className="diff-table">
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                <th scope="col">{leftLabel}</th>
                <th scope="col">{rightLabel}</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {module.groups.map((group) => (
                <Fragment key={group.group}>
                  <tr>
                    <th colSpan={4} scope="colgroup" className="diff-group-header">
                      {group.group}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.paramKey} className={`diff-row diff-row-${row.status}`}>
                      <td className="diff-param" title={row.comment || undefined}>
                        {row.label}
                        {row.unit && <span className="diff-unit">{row.unit}</span>}
                      </td>
                      <td className="diff-value">{formatValue(row.left)}</td>
                      <td className="diff-value diff-value-right">{formatValue(row.right)}</td>
                      <td className="diff-delta">{formatDelta(row)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
