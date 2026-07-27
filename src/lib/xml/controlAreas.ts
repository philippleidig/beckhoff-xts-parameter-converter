import { getBooleanValue, getNumericValue, hasValue } from './locate'

/**
 * A position range on the track in which the SoftDrive applies its `_area`
 * parameter variants. Stored flat on the SoftDrive root as
 * `ControlAreas[i].IsEnabled|StartPosition|EndPosition|TransitionLength`.
 */
export interface ControlArea {
  index: number
  startPosition: number
  endPosition: number
  transitionLength: number
}

/** Upper bound to stop scanning even if a file numbers its areas with gaps. */
const MAX_CONTROL_AREAS = 64

/** Reads the enabled control areas from the SoftDrive-level ParameterValues. */
export function parseControlAreas(root: Element | null): ControlArea[] {
  if (!root) return []

  const areas: ControlArea[] = []
  for (let i = 0; i < MAX_CONTROL_AREAS; i++) {
    const prefix = `ControlAreas[${i}]`
    if (!hasValue(root, `${prefix}.IsEnabled`)) break
    if (getBooleanValue(root, `${prefix}.IsEnabled`) !== true) continue

    areas.push({
      index: i,
      startPosition: getNumericValue(root, `${prefix}.StartPosition`) ?? 0,
      endPosition: getNumericValue(root, `${prefix}.EndPosition`) ?? 0,
      transitionLength: getNumericValue(root, `${prefix}.TransitionLength`) ?? 0,
    })
  }
  return areas
}
