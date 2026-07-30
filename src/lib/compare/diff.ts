import { mcModules, mcParameterMeta, sdModules, sdParameterMeta } from '@/lib/tmc/registry'
import type { ParameterMeta } from '@/lib/converter/types'
import type { ParameterSetKind } from '@/lib/xml/detectFormat'

export type DiffStatus = 'same' | 'changed'

export interface DiffRow {
  paramKey: string
  label: string
  unit: string
  comment?: string
  left: string | number
  right: string | number
  status: DiffStatus
  /**
   * Change of the right value relative to the left one (`0.25` = +25 %). Null when
   * the values are not both numeric or the left one is zero, which has no meaningful
   * relative change.
   */
  relativeChange: number | null
}

export interface DiffGroup {
  group: string
  rows: DiffRow[]
  changedCount: number
}

export interface DiffModule {
  key: string
  label: string
  iconHex: string
  groups: DiffGroup[]
  changedCount: number
  totalCount: number
}

export interface DiffResult {
  modules: DiffModule[]
  changedCount: number
  totalCount: number
}

/**
 * Relative tolerance for numeric equality.
 *
 * Values that travelled through a conversion carry floating point noise in the last
 * bits; reporting that as a difference would bury the changes that matter. The
 * tolerance is far below the precision any parameter is specified with.
 */
const RELATIVE_EPSILON = 1e-9

function valuesEqual(left: string | number, right: string | number): boolean {
  if (typeof left === 'number' && typeof right === 'number') {
    if (left === right) return true
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false
    return Math.abs(left - right) <= RELATIVE_EPSILON * Math.max(1, Math.abs(left), Math.abs(right))
  }
  return String(left) === String(right)
}

function relativeChangeOf(left: string | number, right: string | number): number | null {
  if (typeof left !== 'number' || typeof right !== 'number') return null
  if (left === 0 || !Number.isFinite(left) || !Number.isFinite(right)) return null
  return (right - left) / Math.abs(left)
}

function buildRow(
  paramKey: string,
  meta: ParameterMeta,
  left: string | number,
  right: string | number
): DiffRow {
  const same = valuesEqual(left, right)
  return {
    paramKey,
    label: meta.displayName,
    unit: meta.unit,
    comment: meta.comment,
    left,
    right,
    status: same ? 'same' : 'changed',
    relativeChange: same ? null : relativeChangeOf(left, right),
  }
}

/** Groups rows by their metadata group, preserving the order of the metadata. */
function groupRows(rows: DiffRow[], groupOf: Map<string, string>): DiffGroup[] {
  const groups: DiffGroup[] = []
  const seen = new Map<string, number>()

  for (const row of rows) {
    const group = groupOf.get(row.paramKey) || 'General'
    const index = seen.get(group)
    if (index !== undefined) {
      groups[index].rows.push(row)
    } else {
      seen.set(group, groups.length)
      groups.push({ group, rows: [row], changedCount: 0 })
    }
  }

  for (const group of groups) {
    group.changedCount = group.rows.filter((row) => row.status === 'changed').length
  }
  return groups
}

/**
 * Compares two parameter sets of the same generation, parameter by parameter.
 *
 * The metadata drives the walk, so every parameter the app knows about is reported —
 * including the ones that happen to be identical, which the caller can filter out.
 */
export function diffParameterSets(
  kind: ParameterSetKind,
  left: object,
  right: object
): DiffResult {
  const descriptors = kind === 'softDrive' ? sdModules() : mcModules()
  const metaByModule = kind === 'softDrive' ? sdParameterMeta() : mcParameterMeta()

  const leftRecord = left as Record<string, Record<string, string | number>>
  const rightRecord = right as Record<string, Record<string, string | number>>

  const modules: DiffModule[] = descriptors.map((descriptor) => {
    const meta = metaByModule[descriptor.key]
    const groupOf = new Map<string, string>()

    const rows = Object.entries(meta).map(([paramKey, paramMeta]) => {
      groupOf.set(paramKey, paramMeta.group ?? 'General')
      return buildRow(
        paramKey,
        paramMeta,
        leftRecord[descriptor.key][paramKey],
        rightRecord[descriptor.key][paramKey]
      )
    })

    return {
      ...descriptor,
      groups: groupRows(rows, groupOf),
      changedCount: rows.filter((row) => row.status === 'changed').length,
      totalCount: rows.length,
    }
  })

  return {
    modules,
    changedCount: modules.reduce((sum, module) => sum + module.changedCount, 0),
    totalCount: modules.reduce((sum, module) => sum + module.totalCount, 0),
  }
}
