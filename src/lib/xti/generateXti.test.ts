import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateXti } from './generateXti'
import { parseSoftDriveXml } from '@/lib/xml/parser'
import { convertParameters } from '@/lib/converter/converter'
import { applyVariant } from '@/lib/converter/areas'
import { MAGNET_PLATE_TYPES } from '@/lib/constants/magnetPlateTypes'
import { XTS_DRIVER_VERSION } from '@/lib/constants/xtsVersion'
import { isValidDriverVersion } from './xtiTemplate'
import { createDefaultSoftDriveParameters } from '@/lib/converter/defaults'

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

describe('generateXti - output safety', () => {
  const params = () => {
    const p = createDefaultSoftDriveParameters()
    return convertParameters(p, 7.7)
  }

  it('escapes characters that would break the XML', () => {
    const p = params()
    p.filter.Type = 'A & B'
    const xti = generateXti(p)

    expect(xti).toContain('<EnumText>A &amp; B</EnumText>')
    expect(xti).not.toContain('<EnumText>A & B</EnumText>')
    expect(new DOMParser().parseFromString(xti, 'text/xml').querySelector('parsererror')).toBeNull()
  })

  it('neutralises a value that would otherwise inject markup', () => {
    const p = params()
    p.filter.Type = '</EnumText></Value><Injected/><Value><EnumText>x'
    const xti = generateXti(p)

    expect(xti).not.toContain('<Injected/>')
    const doc = new DOMParser().parseFromString(xti, 'text/xml')
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.querySelector('Injected')).toBeNull()
  })

  it('refuses to write a non-finite number instead of emitting Infinity or NaN', () => {
    const infinite = params()
    infinite.velocityControl.Kp = Infinity
    expect(() => generateXti(infinite)).toThrow(/Kp.*Infinity/s)

    const notANumber = params()
    notANumber.positionControl.Kp = NaN
    expect(() => generateXti(notANumber)).toThrow(/NaN/)
  })

  it('never writes exponential notation', () => {
    const p = params()
    p.feedForward.KpAccFFT = 1e-9
    p.velocityControl.Kp = 1.23e21
    const xti = generateXti(p)

    expect(xti).not.toMatch(/<Value>[-\d.]+[eE][+-]?\d+<\/Value>/)
  })

  it('trims floating point artefacts', () => {
    const p = params()
    p.velocityControl.Kp = 120.89000000000001
    expect(generateXti(p)).toContain('<Value>120.89</Value>')
  })

  it('writes integers without a decimal point', () => {
    const p = params()
    p.velocityControl.MaxVelocity = 4200
    expect(generateXti(p)).toContain('<Value>4200</Value>')
  })
})

describe('generateXti - driver version', () => {
  it('defaults to the version declared by the bundled TcIoXts.tmc', () => {
    const xti = generateXti(convertParameters(createDefaultSoftDriveParameters(), 7.7))
    expect(xti).toContain(`|TcIoXts|${XTS_DRIVER_VERSION}`)
    expect(xti).not.toMatch(/\|TcIoXts\|(?!4\.4\.22\.0)/)
  })

  it('rewrites every occurrence when overridden', () => {
    const xti = generateXti(convertParameters(createDefaultSoftDriveParameters(), 7.7), {
      driverVersion: '4.5.0.0',
    })
    const occurrences = (xti.match(/\|TcIoXts\|4\.5\.0\.0/g) || []).length

    expect(occurrences).toBe(14)
    expect(xti).not.toContain(`|TcIoXts|${XTS_DRIVER_VERSION}`)
    expect(new DOMParser().parseFromString(xti, 'text/xml').querySelector('parsererror')).toBeNull()
  })

  it('rejects a malformed version rather than writing it into the file', () => {
    const p = convertParameters(createDefaultSoftDriveParameters(), 7.7)
    for (const bad of ['latest', '4.4.22', '', '4.4.22.0"/>']) {
      expect(() => generateXti(p, { driverVersion: bad })).toThrow(/version/i)
    }
  })

  it('accepts only four-part versions', () => {
    expect(isValidDriverVersion('4.4.22.0')).toBe(true)
    expect(isValidDriverVersion(' 4.4.22.0 ')).toBe(true)
    expect(isValidDriverVersion('4.4.22')).toBe(false)
    expect(isValidDriverVersion('latest')).toBe(false)
    expect(isValidDriverVersion('4.4.22.0.1')).toBe(false)
  })
})
