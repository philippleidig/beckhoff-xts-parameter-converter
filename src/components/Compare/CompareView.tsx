import { useMemo, useState } from 'react'
import { useCompareStore } from '@/stores/compareStore'
import { ViewHeader } from '@/components/Layout/ViewHeader'
import { Button } from '@/components/ui/Button'
import { ResetIcon } from '@/components/ui/Icons'
import { diffParameterSets } from '@/lib/compare/diff'
import { CompareSlotCard } from './CompareSlotCard'
import { DiffTable } from './DiffTable'
import './CompareView.css'
import { useTmcVersionStore } from '@/stores/tmcVersionStore'

interface CompareViewProps {
  onBack: () => void
}

export function CompareView({ onBack }: CompareViewProps) {
  const [showIdentical, setShowIdentical] = useState(false)
  // Parameter names, units and enum values come from the selected driver version,
  // so this view has to re-render when it changes.
  const tmcVersion = useTmcVersionStore((state) => state.version)

  const { left, right, reset, activeKind } = useCompareStore()
  const kind = activeKind()

  // Both slots always hold the same generation — the store rejects a mismatched pair —
  // so the left slot's kind is the one to diff with.
  const diff = useMemo(
    // tmcVersion is not read here, but diffParameterSets walks the selected driver's
    // metadata, so the result changes with it.
    () => (left && right ? diffParameterSets(left.kind, left.params, right.params) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
    [left, right, tmcVersion]
  )

  return (
    <div className="compare-view">
      <ViewHeader
        title="Compare parameter sets"
        description="Compare two SoftDrive sets or two MoverController sets with each other, or with the TwinCAT default values."
        onBack={onBack}
        actions={
          <Button variant="ghost" size="sm" onClick={reset} disabled={!left && !right}>
            <ResetIcon size={14} />
            Clear both
          </Button>
        }
      />

      <div className="compare-slots">
        <CompareSlotCard side="left" title="Reference" activeKind={kind} />
        <CompareSlotCard side="right" title="Comparison" activeKind={kind} />
      </div>

      {diff && left && right ? (
        <section className="compare-result">
          <header className="compare-summary">
            <p className="compare-summary-count">
              <strong>
                {diff.changedCount} of {diff.totalCount}
              </strong>{' '}
              parameters differ
            </p>
            <label className="compare-toggle">
              <input
                type="checkbox"
                checked={showIdentical}
                onChange={(e) => setShowIdentical(e.target.checked)}
              />
              Show identical parameters
            </label>
          </header>

          <DiffTable
            diff={diff}
            leftLabel={left.label}
            rightLabel={right.label}
            showIdentical={showIdentical}
          />
        </section>
      ) : (
        <p className="compare-placeholder">
          Load a parameter set on both sides to see the differences. Old SoftDrive sets compare
          with old ones, new MoverController sets with new ones.
        </p>
      )}
    </div>
  )
}
