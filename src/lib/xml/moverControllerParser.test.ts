import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseMoverControllerXti } from './moverControllerParser'
import { validateMoverControllerXti } from './moverControllerValidator'
import { generateXti } from '@/lib/xti/generateXti'
import { createDefaultMoverControllerParameters } from '@/lib/converter/defaults'

function sample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

describe('parseMoverControllerXti', () => {
  it('reads back everything generateXti writes', () => {
    const params = createDefaultMoverControllerParameters()
    // Values chosen so no field can pass by coincidentally matching a default.
    params.velocityControl.Kp = 187.25
    params.velocityControl.VelocityLoopType = 'PID_VELOCITY'
    params.positionControl.Kp_standstill = 0.017
    params.filter.Type = 'NOTCH'
    params.feedForward.DetectionForceRamp = 42.5
    params.general.PhaseAdvance = 4
    params.encoder.PositionFeedbackMode = 'MODULO_START_INVERT'

    expect(parseMoverControllerXti(generateXti(params))).toEqual(params)
  })

  it('parses the bundled default parameter set', () => {
    const params = parseMoverControllerXti(sample('MoverControllerDefaultParameterSet.xti'))
    expect(params).toEqual(createDefaultMoverControllerParameters())
  })

  it('rejects a SoftDrive file, which carries different modules', () => {
    expect(() => parseMoverControllerXti(sample('Mover_Axis_1.xti'))).toThrow(
      /No MoverController parameter set/
    )
  })

  it('reports malformed XML rather than returning defaults', () => {
    expect(() => parseMoverControllerXti('<TcSmItem>')).toThrow(/Invalid XML/)
  })
})

describe('validateMoverControllerXti', () => {
  it('accepts the bundled default parameter set', () => {
    const result = validateMoverControllerXti(sample('MoverControllerDefaultParameterSet.xti'))
    expect(result.errors).toEqual([])
    expect(result.valid).toBe(true)
  })

  it('accepts a generated parameter set', () => {
    const xml = generateXti(createDefaultMoverControllerParameters())
    expect(validateMoverControllerXti(xml).valid).toBe(true)
  })

  it('rejects a SoftDrive parameter export', () => {
    const result = validateMoverControllerXti(sample('ParameterSet.xml'))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/Expected root element 'TcSmItem'/)
  })

  it('rejects a Mover Axis XTI, which holds SoftDrive parameters', () => {
    const result = validateMoverControllerXti(sample('Mover_Axis_1.xti'))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/No MoverController parameters found/)
  })

  it('rejects a value that is not a readable number', () => {
    const broken = sample('MoverControllerDefaultParameterSet.xti').replace(
      /(<Name>MaxVelocity<\/Name>\s*<Value>)4200(<\/Value>)/,
      '$14200 mm\\/s$2'
    )
    const result = validateMoverControllerXti(broken)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/VelocityControl\.MaxVelocity is not a readable number/)
  })

  // The SoftDrive spelling of the velocity loop; the MoverController only knows PID_*.
  it('rejects an enum value the driver does not know', () => {
    const broken = sample('MoverControllerDefaultParameterSet.xti').replaceAll(
      '<EnumText>PID_VELOCITY_STANDSTILL</EnumText>',
      '<EnumText>PI_VELOCITY_STANDSTILL</EnumText>'
    )
    const result = validateMoverControllerXti(broken)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/Invalid value 'PI_VELOCITY_STANDSTILL'/)
  })
})
