import { describe, it, expect } from 'vitest'
import { diffParameterSets } from './diff'
import type { DiffResult, DiffRow } from './diff'
import {
  createDefaultSoftDriveParameters,
  createDefaultMoverControllerParameters,
} from '@/lib/converter/defaults'
import { mcParameterMeta, sdParameterMeta } from '@/lib/tmc/registry'
import type { ParameterMeta } from '@/lib/converter/types'

function countParameters(meta: Record<string, Record<string, ParameterMeta>>): number {
  return Object.values(meta).reduce((sum, module) => sum + Object.keys(module).length, 0)
}

function rowOf(diff: DiffResult, moduleKey: string, paramKey: string): DiffRow {
  const module = diff.modules.find((m) => m.key === moduleKey)
  if (!module) throw new Error(`no module ${moduleKey}`)
  const row = module.groups.flatMap((g) => g.rows).find((r) => r.paramKey === paramKey)
  if (!row) throw new Error(`no parameter ${paramKey}`)
  return row
}

function changedRows(diff: DiffResult): DiffRow[] {
  return diff.modules.flatMap((m) => m.groups.flatMap((g) => g.rows)).filter((r) => r.status === 'changed')
}

describe('diffParameterSets', () => {
  it('reports no difference between two identical SoftDrive sets', () => {
    const diff = diffParameterSets(
      'softDrive',
      createDefaultSoftDriveParameters(),
      createDefaultSoftDriveParameters()
    )

    expect(diff.changedCount).toBe(0)
    expect(diff.totalCount).toBeGreaterThan(0)
    expect(changedRows(diff)).toEqual([])
  })

  it('reports no difference between two identical MoverController sets', () => {
    const diff = diffParameterSets(
      'moverController',
      createDefaultMoverControllerParameters(),
      createDefaultMoverControllerParameters()
    )

    expect(diff.changedCount).toBe(0)
  })

  it('covers every parameter of the compared generation', () => {
    const sd = diffParameterSets(
      'softDrive',
      createDefaultSoftDriveParameters(),
      createDefaultSoftDriveParameters()
    )
    const mc = diffParameterSets(
      'moverController',
      createDefaultMoverControllerParameters(),
      createDefaultMoverControllerParameters()
    )

    expect(sd.totalCount).toBe(countParameters(sdParameterMeta()))
    expect(mc.totalCount).toBe(countParameters(mcParameterMeta()))
  })

  it('reports a single changed value and nothing else', () => {
    const right = createDefaultMoverControllerParameters()
    right.velocityControl.Kp = 150

    const diff = diffParameterSets('moverController', createDefaultMoverControllerParameters(), right)

    expect(diff.changedCount).toBe(1)
    expect(changedRows(diff)[0].paramKey).toBe('Kp')
  })

  it('reports the relative change of a numeric difference', () => {
    const left = createDefaultMoverControllerParameters()
    const right = createDefaultMoverControllerParameters()
    left.velocityControl.Kp = 100
    right.velocityControl.Kp = 125

    const row = rowOf(diffParameterSets('moverController', left, right), 'velocityControl', 'Kp')
    expect(row.status).toBe('changed')
    expect(row.relativeChange).toBeCloseTo(0.25, 10)
  })

  // Values that went through a conversion carry noise in the last bits; reporting that
  // as a difference would bury the changes that matter.
  it('treats floating point noise as equal', () => {
    const left = createDefaultMoverControllerParameters()
    const right = createDefaultMoverControllerParameters()
    left.velocityControl.Kp = 0.1 + 0.2
    right.velocityControl.Kp = 0.3

    expect(diffParameterSets('moverController', left, right).changedCount).toBe(0)
  })

  it('does not hide a genuinely small difference', () => {
    const left = createDefaultMoverControllerParameters()
    const right = createDefaultMoverControllerParameters()
    left.positionControl.Kp = 0.03
    right.positionControl.Kp = 0.0301

    expect(diffParameterSets('moverController', left, right).changedCount).toBe(1)
  })

  it('reports an enum change without a relative change', () => {
    const right = createDefaultMoverControllerParameters()
    right.filter.Type = 'NOTCH'

    const row = rowOf(
      diffParameterSets('moverController', createDefaultMoverControllerParameters(), right),
      'filter',
      'Type'
    )
    expect(row.status).toBe('changed')
    expect(row.left).toBe('LOWPASS2')
    expect(row.right).toBe('NOTCH')
    expect(row.relativeChange).toBeNull()
  })

  it('leaves the relative change undefined when the reference is zero', () => {
    const right = createDefaultMoverControllerParameters()
    right.velocityControl.Kd = 5 // the default is 0

    const row = rowOf(
      diffParameterSets('moverController', createDefaultMoverControllerParameters(), right),
      'velocityControl',
      'Kd'
    )
    expect(row.status).toBe('changed')
    expect(row.relativeChange).toBeNull()
  })

  it('keeps the parameters grouped as the metadata describes them', () => {
    const diff = diffParameterSets(
      'moverController',
      createDefaultMoverControllerParameters(),
      createDefaultMoverControllerParameters()
    )
    const general = diff.modules.find((m) => m.key === 'general')

    expect(general?.groups.map((g) => g.group)).toEqual(['General', 'Interpolator', 'Advanced'])
  })
})
