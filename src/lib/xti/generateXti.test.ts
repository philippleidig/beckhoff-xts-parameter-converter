import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateXti } from './generateXti'
import { parseSoftDriveXml } from '@/lib/xml/parser'
import { convertParameters } from '@/lib/converter/converter'
import { applyVariant } from '@/lib/converter/areas'
import { MAGNET_PLATE_TYPES } from '@/lib/constants/magnetPlateTypes'

function readSample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

/** Reads a <Value> entry out of the generated XTI by its <Name>. */
function valueOf(xti: string, name: string): string | null {
  const match = xti.match(
    new RegExp(`<Name>${name}</Name>\\s*<(?:Value|EnumText)>([^<]*)</(?:Value|EnumText)>`)
  )
  return match ? match[1] : null
}

function convertSample(file: string, plateId = 'AT9001_0550') {
  const { params } = parseSoftDriveXml(readSample(file))
  const forceFactor = MAGNET_PLATE_TYPES[plateId].forceFactor
  return {
    params,
    base: generateXti(convertParameters(applyVariant(params, 'base'), forceFactor)),
    area: generateXti(convertParameters(applyVariant(params, 'area'), forceFactor)),
  }
}

describe('generateXti - SoftDrive root parameters are not overwritten', () => {
  // Regression test for the defect where these were emitted as template constants,
  // silently replacing values configured in the source file.
  it('keeps the customised values from samples/ParameterSet.xml', () => {
    const { params, base } = convertSample('ParameterSet.xml')

    // Guard the fixture: if the sample ever changes, this test must be revisited.
    expect(params.softDrive.EmergencyRamp).toBe(40000)
    expect(params.softDrive.StandstillSwitchMode).toBe('DIRECT_AT_SWITCHTIME')

    expect(valueOf(base, 'EmergencyRamp')).toBe('40000')
    expect(valueOf(base, 'StandstillSwitchMode')).toBe('DIRECT_AT_SWITCHTIME')
  })

  it('keeps the values from samples/Mover_Axis_1.xti', () => {
    const { params, base } = convertSample('Mover_Axis_1.xti')

    expect(valueOf(base, 'EmergencyRamp')).toBe(String(params.softDrive.EmergencyRamp))
    expect(valueOf(base, 'EmergencyTimeOut')).toBe(String(params.softDrive.EmergencyTimeOut))
    expect(valueOf(base, 'StandstillSwitchTime')).toBe(String(params.softDrive.StandstillSwitchTime))
    expect(valueOf(base, 'StandstillSwitchMode')).toBe(params.softDrive.StandstillSwitchMode)
  })

  it('translates the numeric OperationMode into the MoverController enum', () => {
    const { params, base } = convertSample('ParameterSet.xml')
    expect(params.softDrive.OperationMode).toBe(8)
    expect(valueOf(base, 'OperationMode')).toBe('CyclicSynchronousPosition')
  })

  it('writes the same root values into the base and the area set', () => {
    const { base, area } = convertSample('ParameterSet.xml')
    for (const name of ['EmergencyRamp', 'EmergencyTimeOut', 'StandstillSwitchTime', 'StandstillSwitchMode', 'OperationMode']) {
      expect(valueOf(area, name)).toBe(valueOf(base, name))
    }
  })

  it('leaves the force limits off, since MaxCurrentOutput is not a force limit', () => {
    const { base } = convertSample('ParameterSet.xml')
    expect(valueOf(base, 'EnableForceLimit')).toBe('FALSE')
    expect(valueOf(base, 'ForceLimit')).toBe('0')
  })

  it('produces well-formed XML for both variants', () => {
    const { base, area } = convertSample('ParameterSet.xml')
    for (const xml of [base, area]) {
      const doc = new DOMParser().parseFromString(xml, 'text/xml')
      expect(doc.querySelector('parsererror')).toBeNull()
    }
  })

  it('round-trips: the generated area set differs from the base set in the _area values', () => {
    const { base, area } = convertSample('ParameterSet.xml')
    expect(area).not.toBe(base)
  })
})
