import { describe, it, expect } from 'vitest'
import { validateSoftDriveXml } from './validator'

const VALID_XML = `<?xml version="1.0" encoding="utf-8"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>Mover</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>Axis</TypeId>
        <ParameterValues />
        <ParameterSets>
          <ParameterSet>
            <TypeId>SoftDrive</TypeId>
            <ParameterValues />
            <ParameterSets>
              <ParameterSet>
                <TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId>
                <ParameterValues />
              </ParameterSet>
            </ParameterSets>
          </ParameterSet>
        </ParameterSets>
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

describe('validateSoftDriveXml', () => {
  it('accepts a valid XML with all required modules', () => {
    const result = validateSoftDriveXml(VALID_XML)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects malformed XML', () => {
    const result = validateSoftDriveXml('<not valid xml')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('XML parse error')
  })

  it('rejects XML with wrong root element', () => {
    const xml = `<?xml version="1.0"?><WrongRoot><ParameterSet><TypeId>SoftDrive</TypeId></ParameterSet></WrongRoot>`
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('ParameterExport'))).toBe(true)
  })

  it('rejects XML without SoftDrive ParameterSet', () => {
    const xml = `<?xml version="1.0"?><ParameterExport><ParameterSet><TypeId>NotSoftDrive</TypeId></ParameterSet></ParameterExport>`
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('SoftDrive'))).toBe(true)
  })

  it('reports missing module TypeIds', () => {
    const xml = `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId>
        <ParameterValues />
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBe(5) // missing 5 out of 6 modules
    expect(result.errors.some(e => e.includes('Encoder'))).toBe(true)
    expect(result.errors.some(e => e.includes('PositionControl'))).toBe(true)
    expect(result.errors.some(e => e.includes('VelocityControl'))).toBe(true)
    expect(result.errors.some(e => e.includes('Filter'))).toBe(true)
    expect(result.errors.some(e => e.includes('FeedForward'))).toBe(true)
  })

  it('accepts XML with SoftDrive nested deeply (Mover > Axis > SoftDrive)', () => {
    const result = validateSoftDriveXml(VALID_XML)
    expect(result.valid).toBe(true)
  })

  it('rejects empty string', () => {
    const result = validateSoftDriveXml('')
    expect(result.valid).toBe(false)
  })

  it('returns empty warnings for valid XML without Area values', () => {
    const result = validateSoftDriveXml(VALID_XML)
    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('returns warnings when PositionLoopType uses Area', () => {
    const xml = buildXmlWithEnumValues({ positionControl: { PositionLoopType: 'P_POSITION_STANDSTILL_AREA' } })
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBe(1)
    expect(result.warnings[0]).toContain('Position Loop Type')
    expect(result.warnings[0]).toContain('P_POSITION_STANDSTILL_AREA')
    expect(result.warnings[0]).toContain('Control Area')
    expect(result.warnings[0]).toContain('additional ParameterSet')
  })

  it('returns warnings when VelocityLoopType uses Area', () => {
    const xml = buildXmlWithEnumValues({ velocityControl: { VelocityLoopType: 'PI_VELOCITY_STANDSTILL_AREA' } })
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBe(1)
    expect(result.warnings[0]).toContain('Velocity Loop Type')
    expect(result.warnings[0]).toContain('PI_VELOCITY_STANDSTILL_AREA')
  })

  it('returns warnings when FeedforwardType uses Area', () => {
    const xml = buildXmlWithEnumValues({ feedForward: { FeedforwardType: 'FFT_ON_AREA' } })
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBe(1)
    expect(result.warnings[0]).toContain('Feed Forward Type')
    expect(result.warnings[0]).toContain('FFT_ON_AREA')
  })

  it('returns multiple warnings when multiple Area values are used', () => {
    const xml = buildXmlWithEnumValues({
      positionControl: { PositionLoopType: 'P_POSITION_STANDSTILL_AREA' },
      velocityControl: { VelocityLoopType: 'PI_VELOCITY_STANDSTILL_AREA' },
      feedForward: { FeedforwardType: 'FFT_ON_AREA' },
    })
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBe(3)
  })

  it('rejects invalid enum values', () => {
    const xml = buildXmlWithEnumValues({ positionControl: { PositionLoopType: 'INVALID_VALUE' } })
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Invalid value') && e.includes('INVALID_VALUE'))).toBe(true)
  })

  it('accepts valid non-Area enum values without warnings', () => {
    const xml = buildXmlWithEnumValues({
      positionControl: { PositionLoopType: 'P_POSITION_STANDSTILL' },
      velocityControl: { VelocityLoopType: 'PI_VELOCITY_STANDSTILL' },
      feedForward: { FeedforwardType: 'FFT_ON' },
    })
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('returns warnings in result even on early structural errors', () => {
    const result = validateSoftDriveXml('<not valid xml')
    expect(result.warnings).toBeDefined()
    expect(result.warnings).toHaveLength(0)
  })
})

/** Helper to build a valid SoftDrive XML with specific enum values injected. */
function buildXmlWithEnumValues(overrides: {
  positionControl?: Record<string, string>
  velocityControl?: Record<string, string>
  feedForward?: Record<string, string>
}): string {
  const buildParamValues = (params?: Record<string, string>) => {
    if (!params) return '<ParameterValues />'
    const entries = Object.entries(params)
      .map(([name, value]) => `<Value><Name>${name}</Name><EnumText>${value}</EnumText></Value>`)
      .join('\n              ')
    return `<ParameterValues>${entries}</ParameterValues>`
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId>
        <ParameterValues />
      </ParameterSet>
      <ParameterSet>
        <TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId>
        <ParameterValues />
      </ParameterSet>
      <ParameterSet>
        <TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId>
        ${buildParamValues(overrides.positionControl)}
      </ParameterSet>
      <ParameterSet>
        <TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId>
        ${buildParamValues(overrides.velocityControl)}
      </ParameterSet>
      <ParameterSet>
        <TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId>
        <ParameterValues />
      </ParameterSet>
      <ParameterSet>
        <TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId>
        ${buildParamValues(overrides.feedForward)}
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`
}
