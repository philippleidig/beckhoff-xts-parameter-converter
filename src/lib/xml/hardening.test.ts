import { describe, it, expect } from 'vitest'
import { parseParameterNumber, parseXmlDocument, getParseError, locateSoftDrive } from './locate'
import { validateSoftDriveXml } from './validator'
import { parseSoftDriveXml } from './parser'

/** Six sub-modules with optional injected values, so a document is always structurally valid. */
function modules(overrides: Partial<Record<string, string>> = {}): string {
  const ids: Record<string, string> = {
    interpolator: '13ed0df8-3244-45e9-b3ba-89c339e4dff3',
    encoder: '8d695a14-7db9-4d35-a64a-30d334b5e2d3',
    positionControl: '1a7898ef-f86a-4b73-8df4-2e8199b711ba',
    velocityControl: 'cce414ce-cccb-4126-b90c-5d2688af5025',
    filter: '3b51fb30-ac26-40e9-afb9-e5aded4491ac',
    feedForward: '68aa515c-6ba6-4d3e-86a0-1a3eb553cf37',
  }
  return Object.entries(ids)
    .map(
      ([key, id]) =>
        `<ParameterSet><TypeId>${id}</TypeId><ParameterValues>${overrides[key] ?? ''}</ParameterValues></ParameterSet>`
    )
    .join('')
}

function doc(overrides: Partial<Record<string, string>> = {}, root = ''): string {
  return `<?xml version="1.0"?><ParameterExport><ParameterSet><TypeId>SoftDrive</TypeId>` +
    `<ParameterValues>${root}</ParameterValues>` +
    `<ParameterSets>${modules(overrides)}</ParameterSets></ParameterSet></ParameterExport>`
}

describe('parseParameterNumber', () => {
  it('accepts plain decimals', () => {
    expect(parseParameterNumber('0.05')).toBe(0.05)
    expect(parseParameterNumber('  120  ')).toBe(120)
    expect(parseParameterNumber('-3.5')).toBe(-3.5)
    expect(parseParameterNumber('+7')).toBe(7)
    expect(parseParameterNumber('.5')).toBe(0.5)
    expect(parseParameterNumber('4200.')).toBe(4200)
    expect(parseParameterNumber('1e3')).toBe(1000)
    expect(parseParameterNumber('1.5E-3')).toBe(0.0015)
  })

  it('rejects a comma decimal separator instead of silently truncating it', () => {
    // parseFloat('1,5') would yield 1 — a plausible-looking but wrong gain.
    expect(parseParameterNumber('1,5')).toBeNull()
    expect(parseParameterNumber('1.234,5')).toBeNull()
  })

  it('rejects trailing or leading garbage', () => {
    expect(parseParameterNumber('12abc')).toBeNull()
    expect(parseParameterNumber('12 mm')).toBeNull()
    expect(parseParameterNumber('abc12')).toBeNull()
    expect(parseParameterNumber('0x10')).toBeNull()
    expect(parseParameterNumber('1 2')).toBeNull()
  })

  it('rejects non-finite and empty input', () => {
    expect(parseParameterNumber('1e999')).toBeNull()
    expect(parseParameterNumber('-1e999')).toBeNull()
    expect(parseParameterNumber('Infinity')).toBeNull()
    expect(parseParameterNumber('NaN')).toBeNull()
    expect(parseParameterNumber('')).toBeNull()
    expect(parseParameterNumber('   ')).toBeNull()
  })
})

describe('parse error detection', () => {
  it('reports malformed XML', () => {
    const result = parseXmlDocument('<not valid')
    expect('error' in result).toBe(true)
  })

  it('reports empty and whitespace-only input as empty rather than as a parse error', () => {
    expect(parseXmlDocument('')).toEqual({ error: 'The file is empty.' })
    expect(parseXmlDocument('   \n ')).toEqual({ error: 'The file is empty.' })
  })

  it('does not mistake a valid document containing a <parsererror> element for a failure', () => {
    // querySelector('parsererror') over the whole tree used to reject this file.
    const xml = doc({}, '') .replace('<ParameterExport>', '<ParameterExport><parsererror>not an error</parsererror>')
    const parsed = parseXmlDocument(xml)
    expect('doc' in parsed).toBe(true)
    expect(validateSoftDriveXml(xml).valid).toBe(true)
  })

  it('flags a document whose root really is a parse error', () => {
    const broken = new DOMParser().parseFromString('<a><b></a>', 'text/xml')
    expect(getParseError(broken)).not.toBeNull()
  })
})

describe('validateSoftDriveXml - unreadable numbers', () => {
  it('rejects a comma decimal and names the parameter', () => {
    const result = validateSoftDriveXml(doc({ velocityControl: '<Value><Name>Kp</Name><Value>1,5</Value></Value>' }))

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('VelocityControl.Kp') && e.includes('1,5'))).toBe(true)
  })

  it('rejects trailing garbage', () => {
    const result = validateSoftDriveXml(doc({ encoder: '<Value><Name>PositionLowPassFilter</Name><Value>500 Hz</Value></Value>' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Encoder.PositionLowPassFilter'))).toBe(true)
  })

  it('rejects an overflowing value', () => {
    const result = validateSoftDriveXml(doc({ velocityControl: '<Value><Name>MaxVelocity</Name><Value>1e999</Value></Value>' }))
    expect(result.valid).toBe(false)
  })

  it('checks the filter module under its prefixed name', () => {
    const result = validateSoftDriveXml(doc({ filter: '<Value><Name>ConfigurationFilter.LowPassFrequency</Name><Value>250,5</Value></Value>' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Filter.LowPassFrequency'))).toBe(true)
  })

  it('checks the SoftDrive root parameters too', () => {
    const result = validateSoftDriveXml(doc({}, '<Value><Name>EmergencyRamp</Name><Value>40.000,5</Value></Value>'))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('SoftDrive.EmergencyRamp'))).toBe(true)
  })

  it('accepts an absent or empty value, which falls back to the default', () => {
    expect(validateSoftDriveXml(doc({ velocityControl: '<Value><Name>Kp</Name><Value></Value></Value>' })).valid).toBe(true)
    expect(validateSoftDriveXml(doc()).valid).toBe(true)
  })

  it('suppresses advisory warnings when the file is rejected', () => {
    const result = validateSoftDriveXml(
      doc({
        velocityControl:
          '<Value><Name>VelocityLoopType</Name><EnumText>PI_VELOCITY_STANDSTILL_AREA</EnumText></Value>' +
          '<Value><Name>Kp</Name><Value>1,5</Value></Value>',
      })
    )
    expect(result.valid).toBe(false)
    expect(result.warnings).toEqual([])
  })

  it('still accepts the bundled samples', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    for (const name of ['ParameterSet.xml', 'ParameterSet_Old.xml', 'Mover_Axis_1.xti']) {
      const xml = readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
      const result = validateSoftDriveXml(xml)
      expect(result.errors, `${name} should validate`).toEqual([])
    }
  })
})

describe('parser robustness', () => {
  it('does not take a partial number from a malformed value', () => {
    // Even if validation were bypassed, "12abc" must not become 12.
    const { params } = parseSoftDriveXml(doc({ velocityControl: '<Value><Name>Kp</Name><Value>12abc</Value></Value>' }))
    expect(params.velocityControl.Kp).toBe(0.1) // the default, not 12
  })

  it('throws a clear error for malformed XML', () => {
    expect(() => parseSoftDriveXml('<broken')).toThrow(/Invalid XML/)
  })

  it('tolerates duplicate value entries deterministically', () => {
    const { params } = parseSoftDriveXml(
      doc({ velocityControl: '<Value><Name>Kp</Name><Value>0.2</Value></Value><Value><Name>Kp</Name><Value>0.9</Value></Value>' })
    )
    expect(params.velocityControl.Kp).toBe(0.2)
  })

  it('ignores values nested in an unrelated container', () => {
    const xml = doc({ velocityControl: '<Nested><ParameterValues><Value><Name>Kp</Name><Value>99</Value></Value></ParameterValues></Nested>' })
    expect(parseSoftDriveXml(xml).params.velocityControl.Kp).toBe(0.1)
  })

  it('returns null from locateSoftDrive for a document without a SoftDrive', () => {
    const empty = new DOMParser().parseFromString('<ParameterExport />', 'text/xml')
    expect(locateSoftDrive(empty)).toBeNull()
  })
})

describe('document-level rejections', () => {
  it('rejects a DOCTYPE declaration, removing entity declarations from consideration', () => {
    const withDoctype = doc().replace('<?xml version="1.0"?>', '<?xml version="1.0"?><!DOCTYPE t>')
    const result = validateSoftDriveXml(withDoctype)

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/DOCTYPE/)
  })

  it('rejects a document declaring entities even when they look harmless', () => {
    const bomb = doc().replace(
      '<?xml version="1.0"?>',
      '<?xml version="1.0"?><!DOCTYPE t [<!ENTITY a "aaaaaaaaaa">]>'
    )
    expect(validateSoftDriveXml(bomb).valid).toBe(false)
    expect(() => parseSoftDriveXml(bomb)).toThrow(/DOCTYPE/)
  })

  it('still accepts the bundled samples, none of which declare a DOCTYPE', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    for (const name of ['ParameterSet.xml', 'ParameterSet_Old.xml', 'Mover_Axis_1.xti']) {
      const xml = readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
      expect(validateSoftDriveXml(xml).valid, `${name} should validate`).toBe(true)
    }
  })
})
