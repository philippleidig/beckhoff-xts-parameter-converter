import { describe, it, expect } from 'vitest'
import { applyVariant, hasAreaConfiguration } from './areas'
import { createDefaultSoftDriveParameters } from './defaults'
import type { SoftDriveParameters } from './types'
import type { ControlArea } from '@/lib/xml/controlAreas'

/** Defaults with distinct base and _area values so a swap is unmistakable. */
function makeParams(overrides: Partial<SoftDriveParameters> = {}): SoftDriveParameters {
  const base = createDefaultSoftDriveParameters()
  return {
    ...base,
    positionControl: { ...base.positionControl, Kp: 1, Kp_area: 11, Kp_standstill: 2, Kp_area_standstill: 22, PosLoopFilter: 3, PosLoopFilter_area: 33 },
    velocityControl: {
      ...base.velocityControl,
      Kp: 4, Kp_area: 44, Kp_standstill: 5, Kp_area_standstill: 55,
      Tn: 6, Tn_area: 66, Tn_standstill: 7, Tn_area_standstill: 77,
      Kd: 8, Kd_area: 88, Kd_standstill: 9, Kd_area_standstill: 99,
    },
    feedForward: { ...base.feedForward, KpAccFFT: 10, KpAccFFT_area: 100, FrictionCompensation: 12, FrictionCompensation_area: 120 },
    ...overrides,
  }
}

const NO_AREAS: ControlArea[] = []
const ONE_AREA: ControlArea[] = [{ index: 0, startPosition: 100, endPosition: 200, transitionLength: 10 }]

describe('applyVariant', () => {
  it('leaves the parameters untouched for the base variant', () => {
    const params = makeParams()
    expect(applyVariant(params, 'base')).toBe(params)
  })

  it('swaps every _area value into its base field', () => {
    const result = applyVariant(makeParams(), 'area')

    expect(result.positionControl.Kp).toBe(11)
    expect(result.positionControl.Kp_standstill).toBe(22)
    expect(result.positionControl.PosLoopFilter).toBe(33)

    expect(result.velocityControl.Kp).toBe(44)
    expect(result.velocityControl.Kp_standstill).toBe(55)
    expect(result.velocityControl.Tn).toBe(66)
    expect(result.velocityControl.Tn_standstill).toBe(77)
    expect(result.velocityControl.Kd).toBe(88)
    expect(result.velocityControl.Kd_standstill).toBe(99)

    expect(result.feedForward.KpAccFFT).toBe(100)
    expect(result.feedForward.FrictionCompensation).toBe(120)
  })

  it('leaves parameters without an _area counterpart alone', () => {
    const params = makeParams()
    const result = applyVariant(params, 'area')

    expect(result.encoder).toEqual(params.encoder)
    expect(result.interpolator).toEqual(params.interpolator)
    expect(result.positionControl.InpositionTn).toBe(params.positionControl.InpositionTn)
    expect(result.velocityControl.MaxVelocity).toBe(params.velocityControl.MaxVelocity)
    expect(result.feedForward.PhaseAdvanceAngle).toBe(params.feedForward.PhaseAdvanceAngle)
    expect(result.feedForward.DetectionMaxCurrent).toBe(params.feedForward.DetectionMaxCurrent)
  })

  it('does not mutate the source', () => {
    const params = makeParams()
    applyVariant(params, 'area')
    expect(params.velocityControl.Kp).toBe(4)
  })

  describe('filter Usage', () => {
    it('keeps the filter in both sets when Usage is ALWAYS', () => {
      const params = makeParams({ filter: { ...createDefaultSoftDriveParameters().filter, Type: 'LOWPASS2', Usage: 'ALWAYS' } })
      expect(applyVariant(params, 'base').filter.Type).toBe('LOWPASS2')
      expect(applyVariant(params, 'area').filter.Type).toBe('LOWPASS2')
    })

    it('switches the filter off in the area set when Usage is OUTSIDE_AREA', () => {
      const params = makeParams({ filter: { ...createDefaultSoftDriveParameters().filter, Type: 'LOWPASS2', Usage: 'OUTSIDE_AREA' } })
      expect(applyVariant(params, 'base').filter.Type).toBe('LOWPASS2')
      expect(applyVariant(params, 'area').filter.Type).toBe('FILTER_OFF')
    })

    it('switches the filter off in the base set when Usage is INSIDE_AREA', () => {
      const params = makeParams({ filter: { ...createDefaultSoftDriveParameters().filter, Type: 'LOWPASS2', Usage: 'INSIDE_AREA' } })
      expect(applyVariant(params, 'base').filter.Type).toBe('FILTER_OFF')
      expect(applyVariant(params, 'area').filter.Type).toBe('LOWPASS2')
    })
  })
})

describe('hasAreaConfiguration', () => {
  const nonArea = (): SoftDriveParameters => {
    const p = makeParams()
    return {
      ...p,
      positionControl: { ...p.positionControl, PositionLoopType: 'P_POSITION_STANDSTILL' },
      velocityControl: { ...p.velocityControl, VelocityLoopType: 'PI_VELOCITY_STANDSTILL' },
      filter: { ...p.filter, Usage: 'ALWAYS' },
      feedForward: { ...p.feedForward, FeedforwardType: 'FFT_ON' },
    }
  }

  it('is false without any area indicator', () => {
    expect(hasAreaConfiguration(nonArea(), NO_AREAS)).toBe(false)
  })

  it('is false for null parameters', () => {
    expect(hasAreaConfiguration(null, ONE_AREA)).toBe(false)
  })

  it('detects P_POSITION_STANDSTILL_AREA', () => {
    const p = nonArea()
    p.positionControl.PositionLoopType = 'P_POSITION_STANDSTILL_AREA'
    expect(hasAreaConfiguration(p, NO_AREAS)).toBe(true)
  })

  it('detects PI_VELOCITY_STANDSTILL_AREA', () => {
    const p = nonArea()
    p.velocityControl.VelocityLoopType = 'PI_VELOCITY_STANDSTILL_AREA'
    expect(hasAreaConfiguration(p, NO_AREAS)).toBe(true)
  })

  it('detects FFT_ON_AREA', () => {
    const p = nonArea()
    p.feedForward.FeedforwardType = 'FFT_ON_AREA'
    expect(hasAreaConfiguration(p, NO_AREAS)).toBe(true)
  })

  it.each(['INSIDE_AREA', 'OUTSIDE_AREA'])('detects filter Usage %s', (usage) => {
    const p = nonArea()
    p.filter.Usage = usage
    expect(hasAreaConfiguration(p, NO_AREAS)).toBe(true)
  })

  it('detects an enabled control area even when no loop type uses AREA', () => {
    expect(hasAreaConfiguration(nonArea(), ONE_AREA)).toBe(true)
  })

  it('treats the bundled defaults as area-configured', () => {
    // defaults.ts uses PI_VELOCITY_STANDSTILL_AREA and FFT_ON_AREA.
    expect(hasAreaConfiguration(createDefaultSoftDriveParameters(), NO_AREAS)).toBe(true)
  })
})
