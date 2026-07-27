import { describe, it, expect } from 'vitest'
import { convertParameters } from './converter'
import { createDefaultSoftDriveParameters } from './defaults'
import type { SoftDriveParameters } from './types'
import { CONVERSION_CONSTANT } from '@/lib/constants/magnetPlateTypes'

function makeSource(overrides?: Partial<{
  [K in keyof SoftDriveParameters]: Partial<SoftDriveParameters[K]>
}>): SoftDriveParameters {
  const base = createDefaultSoftDriveParameters()
  if (!overrides) return base
  for (const mod of Object.keys(overrides) as (keyof SoftDriveParameters)[]) {
    base[mod] = { ...base[mod], ...overrides[mod] } as never
  }
  return base
}

describe('convertParameters', () => {
  // AT9001-0450, FF = 5.4
  const FF_0450 = 5.4

  describe('General module', () => {
    it('copies InterpolatorType directly', () => {
      const source = makeSource({ interpolator: { InterpolatorType: 'INTERPOLATION_LINEAR' } })
      const result = convertParameters(source, FF_0450)
      expect(result.general.InterpolatorType).toBe('INTERPOLATION_LINEAR')
    })

    it('copies CurrentChangeLimit from feedForward', () => {
      const source = makeSource({ feedForward: { CurrentChangeLimit: 2 } })
      const result = convertParameters(source, FF_0450)
      expect(result.general.CurrentChangeLimit).toBe(2)
    })

    it('converts PhaseAdvanceAngle / 18 to PhaseAdvance', () => {
      const source = makeSource({ feedForward: { PhaseAdvanceAngle: 54 } })
      const result = convertParameters(source, FF_0450)
      expect(result.general.PhaseAdvance).toBe(3)
    })

    it('converts PhaseAdvanceAngle = 36 / 18 = 2', () => {
      const source = makeSource({ feedForward: { PhaseAdvanceAngle: 36 } })
      const result = convertParameters(source, FF_0450)
      expect(result.general.PhaseAdvance).toBe(2)
    })
  })

  describe('Encoder module', () => {
    it('copies VelocityFeedbackMode directly', () => {
      const source = makeSource({ encoder: { VelocityFeedbackMode: 'OBSERVER' } })
      const result = convertParameters(source, FF_0450)
      expect(result.encoder.VelocityFeedbackMode).toBe('OBSERVER')
    })

    it('copies PositionFeedbackMode directly', () => {
      const source = makeSource({ encoder: { PositionFeedbackMode: 'MODULO_START_INVERT' } })
      const result = convertParameters(source, FF_0450)
      expect(result.encoder.PositionFeedbackMode).toBe('MODULO_START_INVERT')
    })

    it('copies PositionLowPassFilter directly', () => {
      const source = makeSource({ encoder: { PositionLowPassFilter: 500 } })
      const result = convertParameters(source, FF_0450)
      expect(result.encoder.PositionLowPassFilter).toBe(500)
    })

    it('copies VelocityFilterBandwidth directly', () => {
      const source = makeSource({ encoder: { VelocityFilterBandwidth: 179 } })
      const result = convertParameters(source, FF_0450)
      expect(result.encoder.VelocityFilterBandwidth).toBe(179)
    })

    it('converts CorrectionFactor / 0.35 to ObserverCorrectionFactor', () => {
      const source = makeSource({ encoder: { CorrectionFactor: 0.5 } })
      const result = convertParameters(source, FF_0450)
      expect(result.encoder.ObserverCorrectionFactor).toBeCloseTo(0.5 / 0.35, 4)
    })

    it('copies CommutationErrorVelocity directly', () => {
      const source = makeSource({ encoder: { CommutationErrorVelocity: 1000 } })
      const result = convertParameters(source, FF_0450)
      expect(result.encoder.CommutationErrorVelocity).toBe(1000)
    })
  })

  describe('PositionControl module', () => {
    it('copies PositionLoopType directly', () => {
      const source = makeSource({ positionControl: { PositionLoopType: 'P_POSITION_STANDSTILL' } })
      const result = convertParameters(source, FF_0450)
      expect(result.positionControl.PositionLoopType).toBe('P_POSITION_STANDSTILL')
    })

    it('copies Kp directly', () => {
      const source = makeSource({ positionControl: { Kp: 0.05 } })
      const result = convertParameters(source, FF_0450)
      expect(result.positionControl.Kp).toBe(0.05)
    })

    it('copies Kp_standstill directly', () => {
      const source = makeSource({ positionControl: { Kp_standstill: 0.04 } })
      const result = convertParameters(source, FF_0450)
      expect(result.positionControl.Kp_standstill).toBe(0.04)
    })

    it('renames PosLoopFilter to PositionLoopFilter', () => {
      const source = makeSource({ positionControl: { PosLoopFilter: 75 } })
      const result = convertParameters(source, FF_0450)
      expect(result.positionControl.PositionLoopFilter).toBe(75)
    })

    it('copies InpositionTn directly', () => {
      const source = makeSource({ positionControl: { InpositionTn: 0.05 } })
      const result = convertParameters(source, FF_0450)
      expect(result.positionControl.InpositionTn).toBe(0.05)
    })
  })

  describe('VelocityControl module', () => {
    it('maps VelocityLoopType Area to non-Area', () => {
      const source = makeSource({ velocityControl: { VelocityLoopType: 'PI_VELOCITY_STANDSTILL_AREA' } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.VelocityLoopType).toBe('PI_VELOCITY_STANDSTILL')
    })

    it('converts Kp: value * 314 * FF', () => {
      const source = makeSource({ velocityControl: { Kp: 0.075 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Kp).toBeCloseTo(0.075 * CONVERSION_CONSTANT * FF_0450, 2)
    })

    it('converts Kp_standstill: value * 314 * FF', () => {
      const source = makeSource({ velocityControl: { Kp_standstill: 0.055 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Kp_standstill).toBeCloseTo(0.055 * CONVERSION_CONSTANT * FF_0450, 2)
    })

    it('copies Tn directly', () => {
      const source = makeSource({ velocityControl: { Tn: 0.1 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Tn).toBe(0.1)
    })

    it('copies Tn_standstill directly', () => {
      const source = makeSource({ velocityControl: { Tn_standstill: 0.1 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Tn_standstill).toBe(0.1)
    })

    it('converts Kd: value * FF', () => {
      const source = makeSource({ velocityControl: { Kd: 0.5 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Kd).toBeCloseTo(0.5 * FF_0450, 4)
    })

    it('converts Kd_standstill: value * FF', () => {
      const source = makeSource({ velocityControl: { Kd_standstill: 0.3 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Kd_standstill).toBeCloseTo(0.3 * FF_0450, 4)
    })

    it('copies MaxVelocity directly', () => {
      const source = makeSource({ velocityControl: { MaxVelocity: 4200 } })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.MaxVelocity).toBe(4200)
    })
  })

  describe('Filter module', () => {
    it('copies all filter parameters directly', () => {
      const source = makeSource({
        filter: {
          Type: 'LOWPASS2',
          LowPassFrequency: 336,
          LowPassDamping: 0.8,
          HighPassFrequency: 0,
          HighPassDamping: 0,
        },
      })
      const result = convertParameters(source, FF_0450)
      expect(result.filter.Type).toBe('LOWPASS2')
      expect(result.filter.LowPassFrequency).toBe(336)
      expect(result.filter.LowPassDamping).toBe(0.8)
      expect(result.filter.HighPassFrequency).toBe(0)
      expect(result.filter.HighPassDamping).toBe(0)
    })

    it('maps BIQUAD filter type to NOTCH (BIQUAD removed on MoverController)', () => {
      const source = makeSource({
        filter: {
          Type: 'BIQUAD',
          LowPassFrequency: 200,
          LowPassDamping: 0.7,
          HighPassFrequency: 50,
          HighPassDamping: 0.5,
        },
      })
      const result = convertParameters(source, FF_0450)
      expect(result.filter.Type).toBe('NOTCH')
      // Other filter parameters are still carried over unchanged.
      expect(result.filter.LowPassFrequency).toBe(200)
      expect(result.filter.LowPassDamping).toBe(0.7)
      expect(result.filter.HighPassFrequency).toBe(50)
      expect(result.filter.HighPassDamping).toBe(0.5)
    })

    it('leaves non-BIQUAD filter types unchanged', () => {
      for (const type of ['FILTER_OFF', 'LOWPASS1', 'HIGHPASS1', 'PIDT1', 'LOWPASS2', 'HIGHPASS2', 'NOTCH']) {
        const source = makeSource({ filter: { Type: type } })
        const result = convertParameters(source, FF_0450)
        expect(result.filter.Type).toBe(type)
      }
    })
  })

  describe('FeedForward module', () => {
    it('renames FeedforwardType to Type and maps Area to non-Area', () => {
      const source = makeSource({ feedForward: { FeedforwardType: 'FFT_ON_AREA' } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.Type).toBe('FFT_ON')
    })

    it('converts KpAccFFT: value * 0.35', () => {
      const source = makeSource({ feedForward: { KpAccFFT: 8 } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.KpAccFFT).toBeCloseTo(8 * 0.35, 4)
    })

    it('converts FrictionCompensation: value * FF', () => {
      const source = makeSource({ feedForward: { FrictionCompensation: 0.1 } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.FrictionCompensation).toBeCloseTo(0.1 * FF_0450, 4)
    })

    it('copies DetectionMinMovement directly', () => {
      const source = makeSource({ feedForward: { DetectionMinMovement: 0.1 } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.DetectionMinMovement).toBe(0.1)
    })

    it('copies DetectionFilter directly', () => {
      const source = makeSource({ feedForward: { DetectionFilter: 250 } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.DetectionFilter).toBe(250)
    })

    it('converts DetectionCurrentRamp to DetectionForceRamp: value * FF', () => {
      const source = makeSource({ feedForward: { DetectionCurrentRamp: 25 } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.DetectionForceRamp).toBeCloseTo(25 * FF_0450, 4)
    })

    it('converts DetectionMaxCurrent to DetectionMaxForceLimitFactor: value / 12', () => {
      const source = makeSource({ feedForward: { DetectionMaxCurrent: 12 } })
      const result = convertParameters(source, FF_0450)
      expect(result.feedForward.DetectionMaxForceLimitFactor).toBe(1)
    })
  })

  describe('known conversion values (Excel verification)', () => {
    it('AT9001-0450 (FF=5.4): matches expected output for sample values', () => {
      const source = makeSource({
        interpolator: { InterpolatorType: 'INTERPOLATION_POLYNOM3' },
        encoder: { CorrectionFactor: 0.5, VelocityFilterBandwidth: 179 },
        velocityControl: { Kp: 0.075, Kp_standstill: 0.055 },
        feedForward: {
          KpAccFFT: 8,
          FrictionCompensation: 0.1,
          DetectionCurrentRamp: 25,
          DetectionMaxCurrent: 12,
          PhaseAdvanceAngle: 54,
        },
      })

      const result = convertParameters(source, 5.4)

      expect(result.encoder.ObserverCorrectionFactor).toBeCloseTo(1.4286, 3)
      expect(result.velocityControl.Kp).toBeCloseTo(127.17, 1)
      expect(result.velocityControl.Kp_standstill).toBeCloseTo(93.258, 1)
      expect(result.feedForward.KpAccFFT).toBeCloseTo(2.8, 4)
      expect(result.feedForward.FrictionCompensation).toBeCloseTo(0.54, 4)
      expect(result.feedForward.DetectionForceRamp).toBeCloseTo(135, 4)
      expect(result.feedForward.DetectionMaxForceLimitFactor).toBe(1)
      expect(result.general.PhaseAdvance).toBe(3)
    })
  })

  describe('different mover types', () => {
    const source = makeSource({
      velocityControl: { Kp: 0.1, Kd: 0.5 },
      feedForward: { FrictionCompensation: 0.6, DetectionCurrentRamp: 25 },
    })

    it('AT9001-0550 (FF=7.7)', () => {
      const result = convertParameters(source, 7.7)
      expect(result.velocityControl.Kp).toBeCloseTo(0.1 * 314 * 7.7, 2)
      expect(result.velocityControl.Kd).toBeCloseTo(0.5 * 7.7, 4)
      expect(result.feedForward.FrictionCompensation).toBeCloseTo(0.6 * 7.7, 4)
      expect(result.feedForward.DetectionForceRamp).toBeCloseTo(25 * 7.7, 4)
    })

    it('AT9001-0775 (FF=10)', () => {
      const result = convertParameters(source, 10)
      expect(result.velocityControl.Kp).toBeCloseTo(0.1 * 314 * 10, 2)
      expect(result.velocityControl.Kd).toBeCloseTo(0.5 * 10, 4)
      expect(result.feedForward.FrictionCompensation).toBeCloseTo(0.6 * 10, 4)
    })

    it('AT9001-0AA0 (FF=16)', () => {
      const result = convertParameters(source, 16)
      expect(result.velocityControl.Kp).toBeCloseTo(0.1 * 314 * 16, 2)
      expect(result.velocityControl.Kd).toBeCloseTo(0.5 * 16, 4)
    })

    it('ATH9001-0550 (FF=7)', () => {
      const result = convertParameters(source, 7)
      expect(result.velocityControl.Kp).toBeCloseTo(0.1 * 314 * 7, 2)
      expect(result.velocityControl.Kd).toBeCloseTo(0.5 * 7, 4)
    })
  })

  describe('edge cases', () => {
    it('handles zero values', () => {
      const source = makeSource({
        velocityControl: { Kp: 0, Kd: 0 },
        feedForward: { FrictionCompensation: 0, KpAccFFT: 0, PhaseAdvanceAngle: 0 },
        encoder: { CorrectionFactor: 0 },
      })
      const result = convertParameters(source, FF_0450)
      expect(result.velocityControl.Kp).toBe(0)
      expect(result.velocityControl.Kd).toBe(0)
      expect(result.feedForward.FrictionCompensation).toBe(0)
      expect(result.feedForward.KpAccFFT).toBe(0)
      expect(result.general.PhaseAdvance).toBe(0)
      expect(result.encoder.ObserverCorrectionFactor).toBe(0)
    })

    it('returns all expected module keys', () => {
      const source = makeSource()
      const result = convertParameters(source, FF_0450)
      expect(result).toHaveProperty('general')
      expect(result).toHaveProperty('encoder')
      expect(result).toHaveProperty('positionControl')
      expect(result).toHaveProperty('velocityControl')
      expect(result).toHaveProperty('filter')
      expect(result).toHaveProperty('feedForward')
    })
  })
})

describe('convertParameters - SoftDrive root parameters', () => {
  const FF = 5.4

  it('carries the root values through unchanged', () => {
    const source = makeSource({
      softDrive: {
        EmergencyRamp: 40000,
        EmergencyTimeOut: 0.75,
        StandstillSwitchTime: 0.2,
        StandstillSwitchMode: 'DIRECT_AT_SWITCHTIME',
      },
    })
    const result = convertParameters(source, FF)

    expect(result.general.EmergencyRamp).toBe(40000)
    expect(result.general.EmergencyTimeOut).toBe(0.75)
    expect(result.general.StandstillSwitchTime).toBe(0.2)
    expect(result.general.StandstillSwitchMode).toBe('DIRECT_AT_SWITCHTIME')
  })

  it('is unaffected by the force factor', () => {
    const source = makeSource({ softDrive: { EmergencyRamp: 40000 } })
    expect(convertParameters(source, 5.4).general.EmergencyRamp).toBe(
      convertParameters(source, 16).general.EmergencyRamp
    )
  })

  describe('OperationMode', () => {
    it.each([
      [8, 'CyclicSynchronousPosition'],
      [9, 'CyclicSynchronousVelocity'],
      [10, 'CyclicSynchronousForce'],
      [11, 'CyclicSynchronousForceWithCommutationAngle'],
    ])('translates %i to %s', (numeric, expected) => {
      const result = convertParameters(makeSource({ softDrive: { OperationMode: numeric } }), FF)
      expect(result.general.OperationMode).toBe(expected)
    })

    it('falls back to CyclicSynchronousPosition for an out-of-range value', () => {
      const result = convertParameters(makeSource({ softDrive: { OperationMode: 99 } }), FF)
      expect(result.general.OperationMode).toBe('CyclicSynchronousPosition')
    })
  })

  describe('ResetIPart flags', () => {
    it('maps ON to TRUE and renames Current to Force', () => {
      const source = makeSource({
        velocityControl: {
          ResetIPartAtMotionStart: 'ON',
          ResetIPartWithBipolarCurrentLimitChange: 'ON',
          ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit: 'ON',
        },
      })
      const result = convertParameters(source, FF)

      expect(result.velocityControl.ResetIPartAtMotionStart).toBe('TRUE')
      expect(result.velocityControl.ResetIPartWithBipolarForceLimitChange).toBe('TRUE')
      expect(result.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarForceLimit).toBe('TRUE')
    })

    it('maps OFF to FALSE', () => {
      const source = makeSource({
        velocityControl: {
          ResetIPartAtMotionStart: 'OFF',
          ResetIPartWithBipolarCurrentLimitChange: 'OFF',
          ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit: 'OFF',
        },
      })
      const result = convertParameters(source, FF)

      expect(result.velocityControl.ResetIPartAtMotionStart).toBe('FALSE')
      expect(result.velocityControl.ResetIPartWithBipolarForceLimitChange).toBe('FALSE')
      expect(result.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarForceLimit).toBe('FALSE')
    })

    it('treats an unknown value as FALSE', () => {
      const source = makeSource({ velocityControl: { ResetIPartAtMotionStart: 'SOMETHING_ELSE' } })
      expect(convertParameters(source, FF).velocityControl.ResetIPartAtMotionStart).toBe('FALSE')
    })
  })

  it('does not transfer the motor torque constant', () => {
    // It only identifies the magnet plate; the MoverController has no such parameter.
    const result = convertParameters(makeSource({ softDrive: { TorqueConstant: 7.7 } }), FF)
    expect(JSON.stringify(result)).not.toContain('TorqueConstant')
  })
})
