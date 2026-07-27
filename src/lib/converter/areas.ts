import type { SoftDriveParameters } from './types'
import type { ControlArea } from '@/lib/xml/controlAreas'

/**
 * The SoftDrive holds one *_area variant per control parameter and switches to it
 * while the mover is inside an enabled ControlArea. The MoverController has no
 * such concept — instead a second parameter set is assigned to those position
 * ranges. Since there is only ever one *_area variant (no `_area2`), a source
 * configuration maps to at most two MoverController parameter sets.
 */
export type ParameterSetVariant = 'base' | 'area'

/** SoftDrive enum values whose `_AREA` suffix marks area-dependent control. */
export const AREA_ENUM_VALUES: Record<string, { paramLabel: string; areaValues: string[] }> = {
  'positionControl:PositionLoopType': {
    paramLabel: 'Position Loop Type',
    areaValues: ['P_POSITION_STANDSTILL_AREA'],
  },
  'velocityControl:VelocityLoopType': {
    paramLabel: 'Velocity Loop Type',
    areaValues: ['PI_VELOCITY_STANDSTILL_AREA'],
  },
  'feedForward:FeedforwardType': {
    paramLabel: 'Feed Forward Type',
    areaValues: ['FFT_ON_AREA'],
  },
}

/** `ConfigurationFilter.Usage` values that restrict the filter to one variant. */
const FILTER_USAGE_INSIDE = 'INSIDE_AREA'
const FILTER_USAGE_OUTSIDE = 'OUTSIDE_AREA'

const FILTER_OFF = 'FILTER_OFF'

/**
 * Folds the `_area` values into the base fields so the regular conversion can run
 * over the result unchanged.
 *
 * For `'base'` the parameters pass through untouched, except when the source
 * filter is restricted to `INSIDE_AREA` — the MoverController filter has no
 * `Usage` field, so "only inside the area" is expressed by switching the filter
 * off in the base set and keeping it in the area set (and vice versa).
 */
export function applyVariant(
  src: SoftDriveParameters,
  variant: ParameterSetVariant
): SoftDriveParameters {
  const filterType = resolveFilterType(src, variant)

  if (variant === 'base') {
    if (filterType === src.filter.Type) return src
    return { ...src, filter: { ...src.filter, Type: filterType } }
  }

  return {
    ...src,
    positionControl: {
      ...src.positionControl,
      Kp: src.positionControl.Kp_area,
      Kp_standstill: src.positionControl.Kp_area_standstill,
      PosLoopFilter: src.positionControl.PosLoopFilter_area,
    },
    velocityControl: {
      ...src.velocityControl,
      Kp: src.velocityControl.Kp_area,
      Kp_standstill: src.velocityControl.Kp_area_standstill,
      Tn: src.velocityControl.Tn_area,
      Tn_standstill: src.velocityControl.Tn_area_standstill,
      Kd: src.velocityControl.Kd_area,
      Kd_standstill: src.velocityControl.Kd_area_standstill,
    },
    filter: {
      ...src.filter,
      Type: filterType,
    },
    feedForward: {
      ...src.feedForward,
      KpAccFFT: src.feedForward.KpAccFFT_area,
      FrictionCompensation: src.feedForward.FrictionCompensation_area,
    },
  }
}

function resolveFilterType(src: SoftDriveParameters, variant: ParameterSetVariant): string {
  const usage = src.filter.Usage
  if (variant === 'base' && usage === FILTER_USAGE_INSIDE) return FILTER_OFF
  if (variant === 'area' && usage === FILTER_USAGE_OUTSIDE) return FILTER_OFF
  return src.filter.Type
}

/**
 * True when the source uses area-dependent control and therefore needs a second
 * MoverController parameter set: an `*_AREA` loop type, an area-restricted filter,
 * or at least one enabled ControlArea.
 */
export function hasAreaConfiguration(
  src: SoftDriveParameters | null,
  areas: ControlArea[]
): boolean {
  if (!src) return false
  if (areas.length > 0) return true

  if (src.filter.Usage === FILTER_USAGE_INSIDE || src.filter.Usage === FILTER_USAGE_OUTSIDE) {
    return true
  }

  const loopTypes: Array<[string, string]> = [
    ['positionControl:PositionLoopType', src.positionControl.PositionLoopType],
    ['velocityControl:VelocityLoopType', src.velocityControl.VelocityLoopType],
    ['feedForward:FeedforwardType', src.feedForward.FeedforwardType],
  ]

  return loopTypes.some(([key, value]) => AREA_ENUM_VALUES[key]?.areaValues.includes(value))
}
