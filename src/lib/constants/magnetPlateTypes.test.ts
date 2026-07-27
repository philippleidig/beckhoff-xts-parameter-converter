import { describe, it, expect } from 'vitest'
import { MAGNET_PLATE_TYPES, detectMagnetPlateType } from './magnetPlateTypes'

describe('detectMagnetPlateType', () => {
  it('identifies the plate from samples/Mover_Axis_1.xti', () => {
    // The sample carries SoftDriveMotorPara.TorqueConstant = 7.7.
    expect(detectMagnetPlateType(7.7)).toBe('AT9001_0550')
  })

  it('does not guess when nothing matches', () => {
    // samples/ParameterSet.xml carries 8, which is not a known force factor.
    expect(detectMagnetPlateType(8)).toBeNull()
    expect(detectMagnetPlateType(7.75)).toBeNull()
    expect(detectMagnetPlateType(100)).toBeNull()
  })

  it('matches every known plate by its own force factor', () => {
    for (const plate of Object.values(MAGNET_PLATE_TYPES)) {
      expect(detectMagnetPlateType(plate.forceFactor)).toBe(plate.id)
    }
  })

  it('keeps similarly named plates apart', () => {
    // ATH9001-0550 (7) and AT9001-0550 (7.7) must not be confused.
    expect(detectMagnetPlateType(7)).toBe('ATH9001_0550')
    expect(detectMagnetPlateType(7.7)).toBe('AT9001_0550')
  })

  it('tolerates floating point representation error', () => {
    expect(detectMagnetPlateType(5.4 + 1e-12)).toBe('AT9001_0450')
  })

  it('rejects missing, zero and non-finite values', () => {
    expect(detectMagnetPlateType(0)).toBeNull()
    expect(detectMagnetPlateType(-7.7)).toBeNull()
    expect(detectMagnetPlateType(NaN)).toBeNull()
    expect(detectMagnetPlateType(Infinity)).toBeNull()
  })

  it('has no two plates sharing a force factor, so a match is unambiguous', () => {
    const factors = Object.values(MAGNET_PLATE_TYPES).map((p) => p.forceFactor)
    expect(new Set(factors).size).toBe(factors.length)
  })
})
